import { useRef, useEffect, useCallback } from 'react';
import { useDeviceStore, useViewStore } from '../../store';
import styles from './View2D.module.css';

export function View2DTop() {
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
    const width = rect.width;
    const height = rect.height;

    const targetWidth = Math.floor(width * dpr);
    const targetHeight = Math.floor(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    const isNMOS = deviceType === 'nmos';
    const L = deviceParams.gate.length;
    const W = Math.min(deviceParams.geometry.width, 300);
    const lddLen = deviceParams.sourceDrain.lddLength;
    const sdLen = 60;

    const totalWidth = L + sdLen * 2 + lddLen * 2 + 40;
    const totalHeight = W + 40;
    const scale = Math.min((width - 40) / totalWidth, (height - 40) / totalHeight);

    const offsetX = width / 2;
    const offsetY = height / 2;

    const toX = (x: number) => offsetX + x * scale;
    const toY = (y: number) => offsetY - y * scale;

    const colors = {
      active: isNMOS ? '#64b5f6' : '#ef5350',
      gate: '#9e9e9e',
      source: isNMOS ? '#f44336' : '#2196f3',
      ldd: isNMOS ? '#ef9a9a' : '#90caf9',
    };

    // Active region
    ctx.fillStyle = colors.active;
    ctx.fillRect(
      toX(-totalWidth / 2 + 20),
      toY(W / 2),
      (totalWidth - 40) * scale,
      W * scale
    );

    // LDD regions
    ctx.fillStyle = colors.ldd;
    ctx.fillRect(toX(-L / 2 - lddLen), toY(W / 2), lddLen * scale, W * scale);
    ctx.fillRect(toX(L / 2), toY(W / 2), lddLen * scale, W * scale);

    // Source/Drain
    ctx.fillStyle = colors.source;
    ctx.fillRect(toX(-L / 2 - lddLen - sdLen), toY(W / 2), sdLen * scale, W * scale);
    ctx.fillRect(toX(L / 2 + lddLen), toY(W / 2), sdLen * scale, W * scale);

    // Gate (on top)
    ctx.fillStyle = colors.gate;
    ctx.fillRect(toX(-L / 2), toY(W / 2 + 10), L * scale, (W + 20) * scale);

    // Labels
    ctx.fillStyle = isDark ? '#e0e0e0' : '#1f2937';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S', toX(-L / 2 - lddLen - sdLen / 2), toY(0) + 4);
    ctx.fillText('D', toX(L / 2 + lddLen + sdLen / 2), toY(0) + 4);
    ctx.fillText('G', toX(0), toY(0) + 4);

    // Title
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Top View (X-Y)', 10, 16);
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
