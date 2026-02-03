import { useRef, useEffect, useCallback } from 'react';
import { useDeviceStore, useViewStore } from '../../store';
import styles from './View2D.module.css';

export function View2DSide() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { deviceType, deviceParams } = useDeviceStore();
  const { theme } = useViewStore();
  const isDark = theme === 'dark';

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    const isNMOS = deviceType === 'nmos';
    const W = Math.min(deviceParams.geometry.width, 300);
    const tox = deviceParams.gate.tox;
    const xj = deviceParams.sourceDrain.junctionDepth;
    const subDepth = 100;
    const gateHeight = 40;
    const stiWidth = 50;
    const stiDepth = 80;

    const totalWidth = W + stiWidth * 2 + 40;
    const totalHeight = subDepth + xj + tox + gateHeight + 40;
    const scale = Math.min((width - 40) / totalWidth, (height - 60) / totalHeight);

    const offsetX = width / 2;
    const offsetY = height * 0.6;

    const toX = (x: number) => offsetX + x * scale;
    const toY = (y: number) => offsetY - y * scale;

    const colors = {
      substrate: isNMOS ? '#2196f3' : '#f44336',
      active: isNMOS ? '#64b5f6' : '#ef5350',
      gateOxide: '#80deea',
      gate: '#9e9e9e',
      sti: '#607d8b',
    };

    // STI left
    ctx.fillStyle = colors.sti;
    ctx.fillRect(toX(-W / 2 - stiWidth), toY(0), stiWidth * scale, stiDepth * scale);

    // Substrate
    ctx.fillStyle = colors.substrate;
    ctx.fillRect(toX(-W / 2 - stiWidth), toY(-stiDepth), (W + stiWidth * 2) * scale, (subDepth + xj) * scale);

    // Active region
    ctx.fillStyle = colors.active;
    ctx.fillRect(toX(-W / 2), toY(0), W * scale, xj * scale);

    // STI right
    ctx.fillStyle = colors.sti;
    ctx.fillRect(toX(W / 2), toY(0), stiWidth * scale, stiDepth * scale);

    // Gate oxide
    ctx.fillStyle = colors.gateOxide;
    ctx.fillRect(toX(-W / 2), toY(tox), W * scale, tox * scale);

    // Gate
    ctx.fillStyle = colors.gate;
    ctx.fillRect(toX(-W / 2), toY(tox + gateHeight), W * scale, gateHeight * scale);

    // Labels
    ctx.fillStyle = isDark ? '#e0e0e0' : '#1f2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STI', toX(-W / 2 - stiWidth / 2), toY(-stiDepth / 2) + 4);
    ctx.fillText('Active', toX(0), toY(-xj / 2) + 4);
    ctx.fillText('STI', toX(W / 2 + stiWidth / 2), toY(-stiDepth / 2) + 4);

    // Title
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Side View (Y-Z)', 10, 16);
  }, [deviceType, deviceParams, isDark]);

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
