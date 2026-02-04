/**
 * Colormap utilities for 2D visualization
 */

export type ColorScale = 'hot' | 'cool' | 'viridis' | 'redblue';

/**
 * Maps a normalized value [0,1] to an RGB color
 */
export function valueToColor(
  value: number,
  scale: ColorScale = 'hot'
): [number, number, number] {
  const t = Math.max(0, Math.min(1, value));

  switch (scale) {
    case 'hot': {
      // Black -> Red -> Yellow -> White
      if (t < 0.33) {
        return [Math.round(t * 3 * 255), 0, 0];
      } else if (t < 0.66) {
        return [255, Math.round((t - 0.33) * 3 * 255), 0];
      } else {
        return [255, 255, Math.round((t - 0.66) * 3 * 255)];
      }
    }
    case 'cool': {
      // Cyan -> Magenta
      return [Math.round(t * 255), Math.round((1 - t) * 255), 255];
    }
    case 'viridis': {
      // Approximate viridis colormap
      const r = Math.round(72 + t * (253 - 72) * (1 - t) + t * t * (215 - 72));
      const g = Math.round(40 + t * 180);
      const b = Math.round(120 + t * 50 * (1 - t * t));
      return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
    }
    case 'redblue': {
      // Blue (-) -> White (0) -> Red (+)
      if (t < 0.5) {
        const s = t * 2;
        return [Math.round(s * 255), Math.round(s * 255), 255];
      } else {
        const s = (t - 0.5) * 2;
        return [255, Math.round((1 - s) * 255), Math.round((1 - s) * 255)];
      }
    }
  }
}

/**
 * Convert RGB to CSS color string
 */
export function rgbToCss(rgb: [number, number, number], alpha = 1): string {
  return alpha === 1
    ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * Doping concentration to color
 * Uses log scale with red for n-type (donors) and blue for p-type (acceptors)
 */
export function dopingToColor(
  Nd: number,
  Na: number,
  minConc = 1e15,
  maxConc = 1e21
): [number, number, number] {
  const netDoping = Nd - Na;
  const absNet = Math.abs(netDoping);

  if (absNet < minConc) {
    // Intrinsic - gray
    return [128, 128, 128];
  }

  // Log scale normalization
  const logMin = Math.log10(minConc);
  const logMax = Math.log10(maxConc);
  const logVal = Math.log10(Math.min(absNet, maxConc));
  const intensity = (logVal - logMin) / (logMax - logMin);

  if (netDoping > 0) {
    // n-type (donors dominant) - Red
    const r = 255;
    const g = Math.round(255 * (1 - intensity * 0.8));
    const b = Math.round(255 * (1 - intensity * 0.8));
    return [r, g, b];
  } else {
    // p-type (acceptors dominant) - Blue
    const r = Math.round(255 * (1 - intensity * 0.8));
    const g = Math.round(255 * (1 - intensity * 0.8));
    const b = 255;
    return [r, g, b];
  }
}

/**
 * Net doping type to color (simplified: n-type red, p-type blue)
 */
export function netTypeToColor(Nnet: number): [number, number, number] {
  if (Math.abs(Nnet) < 1e14) {
    // Near intrinsic - gray
    return [128, 128, 128];
  }
  if (Nnet > 0) {
    // n-type - Red
    return [220, 80, 80];
  } else {
    // p-type - Blue
    return [80, 80, 220];
  }
}

/**
 * Potential to color (blue negative -> white zero -> red positive)
 */
export function potentialToColor(
  psi: number,
  minPsi: number,
  maxPsi: number
): [number, number, number] {
  const range = maxPsi - minPsi;
  if (range === 0) return [128, 128, 128];

  // Normalize to 0-1
  const t = (psi - minPsi) / range;

  // Blue -> White -> Red
  if (t < 0.5) {
    const s = t * 2;
    return [Math.round(s * 255), Math.round(s * 255), 255];
  } else {
    const s = (t - 0.5) * 2;
    return [255, Math.round((1 - s) * 255), Math.round((1 - s) * 255)];
  }
}

/**
 * Electric field magnitude to color (viridis-like)
 */
export function efieldToColor(
  E: number,
  maxE: number
): [number, number, number] {
  if (maxE === 0) return [68, 1, 84]; // Dark purple

  const t = Math.min(E / maxE, 1);

  // Viridis-like colormap
  const r = Math.round(68 + t * (253 - 68));
  const g = Math.round(1 + t * (231 - 1));
  const b = Math.round(84 + t * (37 - 84));
  return [r, g, b];
}

/**
 * Draw a colorbar legend on canvas
 */
export function drawColorbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  minLabel: string,
  maxLabel: string,
  title: string,
  isLogScale = false
): void {
  const gradient = ctx.createLinearGradient(x, y + height, x, y);

  if (isLogScale) {
    // Doping colorbar: blue (p) -> gray -> red (n)
    gradient.addColorStop(0, 'rgb(51, 51, 255)');
    gradient.addColorStop(0.5, 'rgb(128, 128, 128)');
    gradient.addColorStop(1, 'rgb(255, 51, 51)');
  } else {
    // Standard hot colormap
    gradient.addColorStop(0, 'rgb(0, 0, 0)');
    gradient.addColorStop(0.33, 'rgb(255, 0, 0)');
    gradient.addColorStop(0.66, 'rgb(255, 255, 0)');
    gradient.addColorStop(1, 'rgb(255, 255, 255)');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Border
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Labels
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(maxLabel, x + width + 4, y + 8);
  ctx.fillText(minLabel, x + width + 4, y + height);
  ctx.fillText(title, x, y - 4);
}
