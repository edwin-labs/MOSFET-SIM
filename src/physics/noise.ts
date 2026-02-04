/**
 * MOSFET Noise Analysis
 *
 * Implements thermal noise and 1/f (flicker) noise calculations
 * Reference: Y. Tsividis, "Operation and Modeling of the MOS Transistor"
 */

import { K_B } from './constants';

export interface NoiseParams {
  // Device parameters
  gm: number;           // S - transconductance
  gds: number;          // S - output conductance
  Id: number;           // A - drain current
  Cox: number;          // F/cm² - oxide capacitance
  W: number;            // cm - channel width
  L: number;            // cm - channel length

  // Temperature
  T: number;            // K

  // Model parameters
  gamma?: number;       // Thermal noise coefficient (2/3 for long-channel, ~1 for short)
  Kf?: number;          // 1/f noise coefficient (typically 1e-24 to 1e-28 for NMOS)
  Af?: number;          // 1/f current exponent (typically 1-2)
  Ef?: number;          // 1/f frequency exponent (typically 1)
}

export interface NoiseResult {
  freq: number[];           // Hz - frequency array
  Sid_thermal: number[];    // A²/Hz - thermal noise PSD
  Sid_flicker: number[];    // A²/Hz - 1/f noise PSD
  Sid_total: number[];      // A²/Hz - total drain current noise
  Svg_input: number[];      // V²/Hz - input-referred voltage noise
  cornerFreq: number;       // Hz - 1/f corner frequency
}

/**
 * Calculate thermal (channel) noise
 * Sid = 4kT * gamma * gm
 */
export function calcThermalNoise(
  gm: number,
  T: number,
  gamma: number = 2/3
): number {
  return 4 * K_B * T * gamma * gm;
}

/**
 * Calculate 1/f (flicker) noise
 * Sid = Kf * Id^Af / (Cox * W * L * f^Ef)
 */
export function calcFlickerNoise(
  Id: number,
  Cox: number,
  W: number,
  L: number,
  f: number,
  Kf: number = 1e-25,
  Af: number = 1,
  Ef: number = 1
): number {
  if (f <= 0) return 0;
  return (Kf * Math.pow(Math.abs(Id), Af)) / (Cox * W * L * Math.pow(f, Ef));
}

/**
 * Calculate 1/f corner frequency
 * The frequency where thermal and flicker noise are equal
 */
export function calcCornerFrequency(params: NoiseParams): number {
  const gamma = params.gamma ?? 2/3;
  const Kf = params.Kf ?? 1e-25;
  const Af = params.Af ?? 1;
  const Ef = params.Ef ?? 1;

  const Sid_thermal = calcThermalNoise(params.gm, params.T, gamma);

  if (Sid_thermal <= 0) return 1;

  // Solve: Kf * Id^Af / (Cox * W * L * fc^Ef) = 4kT * gamma * gm
  // fc = (Kf * Id^Af / (Cox * W * L * 4kT * gamma * gm))^(1/Ef)
  const numerator = Kf * Math.pow(Math.abs(params.Id), Af);
  const denominator = params.Cox * params.W * params.L * Sid_thermal;

  if (denominator <= 0) return 1e6;

  return Math.pow(numerator / denominator, 1 / Ef);
}

/**
 * Generate noise spectral density over frequency range
 */
export function calcNoiseSpectrum(
  params: NoiseParams,
  fMin: number = 1,      // Hz
  fMax: number = 1e9,    // Hz
  pointsPerDecade: number = 10
): NoiseResult {
  const gamma = params.gamma ?? 2/3;
  const Kf = params.Kf ?? 1e-25;
  const Af = params.Af ?? 1;
  const Ef = params.Ef ?? 1;

  // Generate logarithmic frequency array
  const decades = Math.log10(fMax / fMin);
  const numPoints = Math.ceil(decades * pointsPerDecade) + 1;

  const freq: number[] = [];
  const Sid_thermal: number[] = [];
  const Sid_flicker: number[] = [];
  const Sid_total: number[] = [];
  const Svg_input: number[] = [];

  // Thermal noise (frequency independent)
  const thermalNoise = calcThermalNoise(params.gm, params.T, gamma);

  for (let i = 0; i < numPoints; i++) {
    const f = fMin * Math.pow(10, i * decades / (numPoints - 1));
    freq.push(f);

    const flickerNoise = calcFlickerNoise(
      params.Id, params.Cox, params.W, params.L, f, Kf, Af, Ef
    );

    Sid_thermal.push(thermalNoise);
    Sid_flicker.push(flickerNoise);
    Sid_total.push(thermalNoise + flickerNoise);

    // Input-referred voltage noise: Svg = Sid / gm²
    const gm2 = params.gm * params.gm;
    Svg_input.push(gm2 > 0 ? (thermalNoise + flickerNoise) / gm2 : 0);
  }

  const cornerFreq = calcCornerFrequency(params);

  return {
    freq,
    Sid_thermal,
    Sid_flicker,
    Sid_total,
    Svg_input,
    cornerFreq
  };
}

/**
 * Calculate integrated noise (RMS) over frequency band
 */
export function calcIntegratedNoise(
  params: NoiseParams,
  fLow: number,
  fHigh: number
): { id_rms: number; vg_rms: number } {
  const gamma = params.gamma ?? 2/3;
  const Kf = params.Kf ?? 1e-25;
  const Af = params.Af ?? 1;

  // Thermal noise integral: Sid_thermal * (fHigh - fLow)
  const thermalNoise = calcThermalNoise(params.gm, params.T, gamma);
  const thermalIntegral = thermalNoise * (fHigh - fLow);

  // 1/f noise integral: Kf * Id^Af / (Cox * W * L) * ln(fHigh/fLow) for Ef=1
  const flickerCoeff = (Kf * Math.pow(Math.abs(params.Id), Af)) /
                       (params.Cox * params.W * params.L);
  const flickerIntegral = flickerCoeff * Math.log(fHigh / fLow);

  const totalIntegral = thermalIntegral + flickerIntegral;
  const id_rms = Math.sqrt(totalIntegral);

  const gm2 = params.gm * params.gm;
  const vg_rms = gm2 > 0 ? Math.sqrt(totalIntegral / gm2) : 0;

  return { id_rms, vg_rms };
}

/**
 * Get typical Kf value based on technology
 */
export function getTypicalKf(
  techNode: string,
  deviceType: 'nmos' | 'pmos'
): number {
  // Typical Kf values (A²·cm²/Hz)
  // PMOS typically has 3-10x lower 1/f noise than NMOS
  const baseKf: Record<string, number> = {
    '180nm': 2e-24,
    '90nm': 5e-25,
    '45nm': 2e-25,
    '28nm': 1e-25,
    'custom': 1e-25,
  };

  const kf = baseKf[techNode] ?? 1e-25;
  return deviceType === 'pmos' ? kf / 5 : kf;
}

/**
 * Get gamma (thermal noise coefficient) based on operating region
 */
export function getGammaCoeff(
  vov: number,       // V - overdrive voltage (Vgs - Vth)
  vds: number,       // V
  L: number          // nm - channel length
): number {
  // Long-channel in saturation: gamma = 2/3
  // Short-channel effects increase gamma towards 1
  // In linear region, gamma increases with Vds

  const isShortChannel = L < 100;
  const inSaturation = vds > vov;

  let gamma = 2/3;

  if (inSaturation) {
    // Short-channel hot carrier effects
    if (isShortChannel) {
      gamma = 0.67 + 0.33 * (100 - L) / 100;  // Increases towards 1 for short L
    }
  } else {
    // Linear region
    gamma = 2/3 * (1 + vds / (2 * vov));
  }

  return Math.min(gamma, 1.5);  // Cap at reasonable value
}
