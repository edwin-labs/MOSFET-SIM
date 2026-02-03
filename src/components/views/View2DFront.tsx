import { useRef, useEffect, useCallback } from 'react';
import { useDeviceStore, useSimulationStore, useViewStore } from '../../store';
import { dopingToColor, drawColorbar } from '../../utils/colormap';
import styles from './View2D.module.css';

export function View2DFront() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { deviceType, deviceParams } = useDeviceStore();
  const { depletionWidth, doping2d } = useSimulationStore();
  const { colormap } = useViewStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Device dimensions
    const isNMOS = deviceType === 'nmos';
    const L = deviceParams.gate.length;
    const tox = deviceParams.gate.tox;
    const xj = deviceParams.sourceDrain.junctionDepth;
    const lddLen = deviceParams.sourceDrain.lddLength;
    const subDepth = 100;
    const sdLen = 60;
    const gateHeight = 40;
    const spacerWidth = 15;

    // Calculate scale to fit
    const totalWidth = L + sdLen * 2 + lddLen * 2 + 40;
    const totalHeight = subDepth + xj + tox + gateHeight + 40;
    const scale = Math.min((width - 40) / totalWidth, (height - 60) / totalHeight);

    // Center offset
    const offsetX = width / 2;
    const offsetY = height * 0.6;

    const toX = (x: number) => offsetX + x * scale;
    const toY = (y: number) => offsetY - y * scale;

    // Colors
    const colors = {
      substrate: isNMOS ? '#2196f3' : '#f44336',
      channel: isNMOS ? '#64b5f6' : '#ef5350',
      gateOxide: '#80deea',
      gate: '#9e9e9e',
      source: isNMOS ? '#f44336' : '#2196f3',
      ldd: isNMOS ? '#ef9a9a' : '#90caf9',
      spacer: '#ffeb3b',
      depletion: 'rgba(0, 255, 0, 0.3)',
    };

    // Draw substrate
    ctx.fillStyle = colors.substrate;
    ctx.fillRect(
      toX(-totalWidth / 2 + 20),
      toY(0),
      totalWidth * scale - 40,
      (subDepth + xj) * scale
    );

    // Draw channel
    ctx.fillStyle = colors.channel;
    ctx.fillRect(toX(-L / 2), toY(0), L * scale, xj * scale);

    // Draw LDD regions
    ctx.fillStyle = colors.ldd;
    ctx.fillRect(toX(-L / 2 - lddLen), toY(0), lddLen * scale, xj * 0.7 * scale);
    ctx.fillRect(toX(L / 2), toY(0), lddLen * scale, xj * 0.7 * scale);

    // Draw source/drain
    ctx.fillStyle = colors.source;
    ctx.fillRect(toX(-L / 2 - lddLen - sdLen), toY(0), sdLen * scale, xj * scale);
    ctx.fillRect(toX(L / 2 + lddLen), toY(0), sdLen * scale, xj * scale);

    // Draw gate oxide
    ctx.fillStyle = colors.gateOxide;
    ctx.fillRect(toX(-L / 2 - spacerWidth), toY(tox), (L + spacerWidth * 2) * scale, tox * scale);

    // Draw gate
    ctx.fillStyle = colors.gate;
    ctx.fillRect(toX(-L / 2), toY(tox + gateHeight), L * scale, gateHeight * scale);

    // Draw spacers
    ctx.fillStyle = colors.spacer;
    ctx.fillRect(toX(-L / 2 - spacerWidth), toY(tox + gateHeight), spacerWidth * scale, (gateHeight + tox) * scale);
    ctx.fillRect(toX(L / 2), toY(tox + gateHeight), spacerWidth * scale, (gateHeight + tox) * scale);

    // Draw depletion region
    if (depletionWidth > 0) {
      ctx.fillStyle = colors.depletion;
      ctx.fillRect(toX(-L / 2 - lddLen), toY(0), (L + lddLen * 2) * scale, depletionWidth * scale);
    }

    // Draw labels
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Source', toX(-L / 2 - lddLen - sdLen / 2), toY(-xj - 10));
    ctx.fillText('Gate', toX(0), toY(tox + gateHeight + 10));
    ctx.fillText('Drain', toX(L / 2 + lddLen + sdLen / 2), toY(-xj - 10));

    // Draw doping heatmap overlay if colormap is 'doping'
    if (colormap === 'doping' && doping2d) {
      const xArr = doping2d.x;
      const zArr = doping2d.z;
      const xMin = xArr[0];
      const xMax = xArr[xArr.length - 1];
      const zMin = zArr[0];
      const zMax = zArr[zArr.length - 1];

      const imgWidth = Math.ceil((xMax - xMin) * scale);
      const imgHeight = Math.ceil((zMax - zMin) * scale);
      const imgData = ctx.createImageData(imgWidth, imgHeight);
      const data = imgData.data;

      for (let py = 0; py < imgHeight; py++) {
        for (let px = 0; px < imgWidth; px++) {
          // Convert pixel to nm coordinates
          const xNm = xMin + (px / scale);
          const zNm = zMin + (py / scale); // depth from surface

          // Find nearest doping2d grid point
          const xi = Math.floor((xNm - xMin) / (xMax - xMin) * (doping2d.nx - 1));
          const zi = Math.floor((zNm - zMin) / (zMax - zMin) * (doping2d.nz - 1));

          if (xi >= 0 && xi < doping2d.nx && zi >= 0 && zi < doping2d.nz) {
            const idx = zi * doping2d.nx + xi;
            const NdVal = doping2d.Nd[idx];
            const NaVal = doping2d.Na[idx];
            const [r, g, b] = dopingToColor(NdVal, NaVal);

            const pidx = (py * imgWidth + px) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
            data[pidx + 3] = 180; // Semi-transparent
          }
        }
      }

      ctx.putImageData(imgData, Math.round(toX(xMin)), Math.round(toY(0)));

      // Draw colorbar
      drawColorbar(
        ctx,
        width - 30,
        40,
        12,
        80,
        'p-type',
        'n-type',
        'Doping',
        true
      );
    }

    // Draw scale bar
    const scaleBarLen = 50; // nm
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20 + scaleBarLen * scale, height - 20);
    ctx.stroke();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${scaleBarLen} nm`, 20, height - 8);

    // Title
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Front View (X-Z)', 10, 16);
  }, [deviceType, deviceParams, depletionWidth, colormap, doping2d]);

  useEffect(() => {
    draw();

    const observer = new ResizeObserver(draw);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} />
    </div>
  );
}
