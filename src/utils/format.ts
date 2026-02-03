/**
 * Format a number in engineering notation with SI prefix
 */
export function formatSI(value: number, unit: string = '', precision: number = 3): string {
  if (value === 0) return `0 ${unit}`.trim();

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const prefixes = [
    { exp: 24, prefix: 'Y' },
    { exp: 21, prefix: 'Z' },
    { exp: 18, prefix: 'E' },
    { exp: 15, prefix: 'P' },
    { exp: 12, prefix: 'T' },
    { exp: 9, prefix: 'G' },
    { exp: 6, prefix: 'M' },
    { exp: 3, prefix: 'k' },
    { exp: 0, prefix: '' },
    { exp: -3, prefix: 'm' },
    { exp: -6, prefix: 'u' },
    { exp: -9, prefix: 'n' },
    { exp: -12, prefix: 'p' },
    { exp: -15, prefix: 'f' },
    { exp: -18, prefix: 'a' },
  ];

  const exp = Math.floor(Math.log10(absValue));

  for (const { exp: pExp, prefix } of prefixes) {
    if (exp >= pExp) {
      const scaled = absValue / Math.pow(10, pExp);
      return `${sign}${scaled.toPrecision(precision)} ${prefix}${unit}`.trim();
    }
  }

  return `${sign}${absValue.toExponential(precision - 1)} ${unit}`.trim();
}

/**
 * Format current value
 */
export function formatCurrent(value: number, precision: number = 3): string {
  return formatSI(value, 'A', precision);
}

/**
 * Format voltage value
 */
export function formatVoltage(value: number, precision: number = 3): string {
  if (Math.abs(value) >= 1) {
    return `${value.toFixed(precision - 1)} V`;
  }
  return formatSI(value, 'V', precision);
}

/**
 * Format capacitance value
 */
export function formatCapacitance(value: number, precision: number = 3): string {
  return formatSI(value, 'F', precision);
}

/**
 * Format ratio (e.g., Ion/Ioff)
 */
export function formatRatio(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}G`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}k`;
  } else {
    return value.toFixed(1);
  }
}

/**
 * Parse scientific notation input (e.g., "1e17", "5.2E-3")
 */
export function parseScientific(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try parsing as regular number first
  const num = parseFloat(trimmed);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  // Try scientific notation patterns
  const sciPattern = /^([+-]?\d*\.?\d+)[eE]([+-]?\d+)$/;
  const match = trimmed.match(sciPattern);
  if (match) {
    const mantissa = parseFloat(match[1]);
    const exponent = parseInt(match[2], 10);
    return mantissa * Math.pow(10, exponent);
  }

  return null;
}

/**
 * Format number for display in input field
 */
export function formatForInput(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);

  // Use scientific notation for very large or small numbers
  if (absValue >= 1e6 || absValue < 1e-3) {
    return value.toExponential(2);
  }

  // Otherwise use fixed notation
  if (absValue >= 100) {
    return value.toFixed(0);
  } else if (absValue >= 1) {
    return value.toFixed(2);
  } else {
    return value.toFixed(4);
  }
}
