import { useRef, useEffect, useCallback } from 'react';
import { useDeviceStore, useSimulationStore, useViewStore } from '../../store';
import { dopingToColor, netTypeToColor, potentialToColor, efieldToColor, drawColorbar } from '../../utils/colormap';
import styles from './View2D.module.css';

export function View2DFront() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { deviceType, deviceParams } = useDeviceStore();
  const { depletionWidth, doping2d, numerical2d } = useSimulationStore();
  const { colormap, theme } = useViewStore();

  const isDark = theme === 'dark';

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    // Only resize if dimensions changed
    const targetWidth = Math.floor(width * dpr);
    const targetHeight = Math.floor(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Reset transformation and apply DPR scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f0';
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
      (totalWidth - 40) * scale,
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
    ctx.fillStyle = isDark ? '#e0e0e0' : '#1f2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Source', toX(-L / 2 - lddLen - sdLen / 2), toY(-xj - 10));
    ctx.fillText('Gate', toX(0), toY(tox + gateHeight + 10));
    ctx.fillText('Drain', toX(L / 2 + lddLen + sdLen / 2), toY(-xj - 10));

    // Draw colormap overlay based on selected view
    if ((colormap === 'doping' || colormap === 'netType') && doping2d) {
      const xArr = doping2d.x;
      const zArr = doping2d.z;
      const xMin = xArr[0];
      const xMax = xArr[xArr.length - 1];
      const zMin = zArr[0];
      const zMax = zArr[zArr.length - 1];

      // Create offscreen canvas for the doping image
      const offscreen = document.createElement('canvas');
      offscreen.width = doping2d.nx;
      offscreen.height = doping2d.nz;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(doping2d.nx, doping2d.nz);
        const data = imgData.data;

        for (let zi = 0; zi < doping2d.nz; zi++) {
          for (let xi = 0; xi < doping2d.nx; xi++) {
            const idx = zi * doping2d.nx + xi;
            let r: number, g: number, b: number;

            if (colormap === 'doping') {
              [r, g, b] = dopingToColor(doping2d.Nd[idx], doping2d.Na[idx]);
            } else {
              [r, g, b] = netTypeToColor(doping2d.Nnet[idx]);
            }

            const pidx = (zi * doping2d.nx + xi) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
            data[pidx + 3] = 180;
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        // Draw the offscreen canvas scaled to fit the device region
        // z=0 is surface, z increases into substrate, so top of image is at y=0
        const drawWidth = (xMax - xMin) * scale;
        const drawHeight = (zMax - zMin) * scale;
        ctx.drawImage(
          offscreen,
          toX(xMin),
          toY(0),  // Surface level (z=0 maps to y=0)
          drawWidth,
          drawHeight
        );
      }

      drawColorbar(
        ctx,
        width - 30,
        40,
        12,
        80,
        'p-type',
        'n-type',
        colormap === 'doping' ? 'Doping' : 'Net Type',
        true
      );
    }

    // Potential colormap (requires numerical data)
    if (colormap === 'potential' && numerical2d) {
      const { x: xArr, z: zArr, psi, nx, nz } = numerical2d;
      const xMin = xArr[0];
      const xMax = xArr[xArr.length - 1];
      const zMin = zArr[0];
      const zMax = zArr[zArr.length - 1];

      // Find min/max potential
      let minPsi = Infinity, maxPsi = -Infinity;
      for (let i = 0; i < psi.length; i++) {
        if (psi[i] < minPsi) minPsi = psi[i];
        if (psi[i] > maxPsi) maxPsi = psi[i];
      }

      // Create offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = nx;
      offscreen.height = nz;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(nx, nz);
        const data = imgData.data;

        for (let zi = 0; zi < nz; zi++) {
          for (let xi = 0; xi < nx; xi++) {
            const idx = zi * nx + xi;
            const [r, g, b] = potentialToColor(psi[idx], minPsi, maxPsi);

            const pidx = (zi * nx + xi) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
            data[pidx + 3] = 180;
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        const drawWidth = (xMax - xMin) * scale;
        const drawHeight = (zMax - zMin) * scale;
        ctx.drawImage(offscreen, toX(xMin), toY(0), drawWidth, drawHeight);
      }

      drawColorbar(ctx, width - 30, 40, 12, 80, `${minPsi.toFixed(1)}V`, `${maxPsi.toFixed(1)}V`, 'Potential', false);
    }

    // E-Field colormap (requires numerical data)
    if (colormap === 'efield' && numerical2d) {
      const { x: xArr, z: zArr, Ex, Ez, nx, nz } = numerical2d;
      const xMin = xArr[0];
      const xMax = xArr[xArr.length - 1];
      const zMin = zArr[0];
      const zMax = zArr[zArr.length - 1];

      // Find max field magnitude
      let maxE = 0;
      for (let i = 0; i < Ex.length; i++) {
        const E = Math.sqrt(Ex[i] * Ex[i] + Ez[i] * Ez[i]);
        if (E > maxE) maxE = E;
      }

      // Create offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = nx;
      offscreen.height = nz;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(nx, nz);
        const data = imgData.data;

        for (let zi = 0; zi < nz; zi++) {
          for (let xi = 0; xi < nx; xi++) {
            const idx = zi * nx + xi;
            const E = Math.sqrt(Ex[idx] * Ex[idx] + Ez[idx] * Ez[idx]);
            const [r, g, b] = efieldToColor(E, maxE);

            const pidx = (zi * nx + xi) * 4;
            data[pidx] = r;
            data[pidx + 1] = g;
            data[pidx + 2] = b;
            data[pidx + 3] = 180;
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        const drawWidth = (xMax - xMin) * scale;
        const drawHeight = (zMax - zMin) * scale;
        ctx.drawImage(offscreen, toX(xMin), toY(0), drawWidth, drawHeight);
      }
      drawColorbar(ctx, width - 30, 40, 12, 80, '0', `${(maxE / 1e5).toFixed(1)}MV/cm`, 'E-Field', false);
    }

    // Show message if potential/efield selected but no numerical data
    if ((colormap === 'potential' || colormap === 'efield') && !numerical2d) {
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      ctx.fillRect(width / 2 - 100, height / 2 - 20, 200, 40);
      ctx.fillStyle = isDark ? '#e0e0e0' : '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Requires Level C (Numerical)', width / 2, height / 2);
      ctx.font = '10px sans-serif';
      ctx.fillText('Run numerical simulation first', width / 2, height / 2 + 14);
    }

    // Draw scale bar
    const scaleBarLen = 50; // nm
    ctx.strokeStyle = isDark ? '#e0e0e0' : '#1f2937';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20 + scaleBarLen * scale, height - 20);
    ctx.stroke();
    ctx.fillStyle = isDark ? '#e0e0e0' : '#1f2937';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${scaleBarLen} nm`, 20, height - 8);

    // Title
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Front View (X-Z)', 10, 16);
  }, [deviceType, deviceParams, depletionWidth, colormap, doping2d, numerical2d, isDark]);

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
