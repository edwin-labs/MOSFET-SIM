/**
 * Process to Device Parameter Conversion
 *
 * Simplified TCAD-like calculation that converts process parameters
 * (implant doses, energies, anneal conditions) to device parameters
 * (doping concentrations, junction depths, etc.)
 */

import type { ProcessParams, DeviceParams, DeviceType } from '../types/device';

/**
 * Implant range parameters (simplified Gaussian model)
 * Rp = projected range, dRp = straggle
 * Values are approximate for Si substrate
 */
const IMPLANT_RANGES: Record<string, { a: number; b: number; c: number; d: number }> = {
  // Rp = a * E^b, dRp = c * E^d (E in keV, Rp/dRp in nm)
  B: { a: 2.5, b: 0.75, c: 1.2, d: 0.6 },
  BF2: { a: 1.2, b: 0.7, c: 0.8, d: 0.55 },
  P: { a: 1.8, b: 0.8, c: 1.0, d: 0.65 },
  As: { a: 1.0, b: 0.75, c: 0.6, d: 0.6 },
};

/**
 * Calculate projected range and straggle for an implant
 */
function getImplantRange(species: string, energy: number): { Rp: number; dRp: number } {
  const params = IMPLANT_RANGES[species] || IMPLANT_RANGES['B'];
  const Rp = params.a * Math.pow(energy, params.b);
  const dRp = params.c * Math.pow(energy, params.d);
  return { Rp, dRp };
}

/**
 * Calculate peak concentration from dose and straggle (Gaussian profile)
 * N_peak = dose / (sqrt(2*pi) * dRp)
 */
function peakConcentration(dose: number, dRp_nm: number): number {
  const dRp_cm = dRp_nm * 1e-7; // nm to cm
  return dose / (Math.sqrt(2 * Math.PI) * dRp_cm);
}

/**
 * Calculate junction depth for abrupt junction approximation
 * x_j ≈ Rp + dRp * sqrt(2 * ln(N_peak / N_sub))
 */
function junctionDepth(Rp: number, dRp: number, Npeak: number, Nsub: number): number {
  if (Npeak <= Nsub) return Rp;
  const ratio = Math.log(Npeak / Nsub);
  return Rp + dRp * Math.sqrt(2 * ratio);
}

/**
 * Apply thermal diffusion during anneal (simplified model)
 * Dt = D0 * exp(-Ea/kT) * time
 * For short RTA: mainly activation, minimal diffusion
 */
function diffusionLength(species: string, temperature: number, time: number): number {
  // Simplified diffusion coefficients at high temp (cm²/s)
  const D0: Record<string, number> = {
    B: 1e-13,
    BF2: 1e-13,
    P: 5e-14,
    As: 2e-14,
  };

  const Ea = 3.5; // eV (approximate activation energy)
  const kT = 8.617e-5 * temperature; // eV
  const D = (D0[species] || 1e-13) * Math.exp(-Ea / kT);
  const Dt = D * time; // cm²

  // 2 * sqrt(Dt) in nm
  return 2 * Math.sqrt(Dt) * 1e7;
}

/**
 * Calculate dopant activation ratio based on anneal conditions
 */
function activationRatio(temperature: number, time: number, annealType: string): number {
  // RTA at high temp gives good activation
  if (annealType === 'RTA' || annealType === 'Spike') {
    if (temperature >= 1000) return 0.8;
    if (temperature >= 900) return 0.6;
    return 0.4;
  }
  // Furnace anneal
  if (temperature >= 900 && time >= 30) return 0.7;
  return 0.5;
}

/**
 * Convert process parameters to device parameters
 */
export function processToDevice(
  process: ProcessParams,
  deviceType: DeviceType
): Partial<DeviceParams> {
  const isNMOS = deviceType === 'nmos';

  // Get anneal parameters
  const { temperature: Tanneal, time: tanneal, type: annealType } = process.anneal;
  const activation = activationRatio(Tanneal, tanneal, annealType);

  // === Gate Stack ===
  const tox = process.gateStack.oxideThickness;
  const gateLength = process.gateStack.gateLength;
  const gateMaterial = process.gateStack.gateMaterial;

  // Work function based on gate material
  let workFunction = 4.6; // mid-gap
  if (gateMaterial === 'poly-n') workFunction = 4.15;
  else if (gateMaterial === 'poly-p') workFunction = 5.25;
  else if (gateMaterial === 'TiN') workFunction = 4.6;
  else if (gateMaterial === 'TaN') workFunction = 4.5;

  // === Well / Substrate ===
  const wellDoping = process.well.doping;

  // === Channel Doping (Vt adjust) ===
  const vtSpecies = process.vtAdjust.species;
  const vtDose = process.vtAdjust.dose;
  const vtEnergy = process.vtAdjust.energy;
  const { dRp: vtdRp } = getImplantRange(vtSpecies, vtEnergy);

  // Vt implant adds to channel doping near surface
  const vtPeak = peakConcentration(vtDose, vtdRp) * activation;
  // Effective channel doping is well doping + Vt adjust contribution
  // Use a simplified model: average in channel region
  const channelDoping = wellDoping + vtPeak * 0.3; // 30% contribution factor

  // === S/D Main Implant ===
  const sdSpecies = process.sdMain.species;
  const sdDose = process.sdMain.dose;
  const sdEnergy = process.sdMain.energy;
  const { Rp: sdRp, dRp: sddRp } = getImplantRange(sdSpecies, sdEnergy);

  // Apply diffusion from anneal
  const sdDiffusion = diffusionLength(sdSpecies, Tanneal, tanneal);
  const sdRpFinal = sdRp + sdDiffusion * 0.5;
  const sddRpFinal = Math.sqrt(sddRp * sddRp + sdDiffusion * sdDiffusion * 0.25);

  const sdPeak = peakConcentration(sdDose, sddRpFinal) * activation;
  const sdJunctionDepth = junctionDepth(sdRpFinal, sddRpFinal, sdPeak, wellDoping);

  // Cap the S/D doping at solid solubility (~5e20 for As, ~2e20 for B)
  const maxSdDoping = sdSpecies === 'As' ? 5e20 : sdSpecies === 'P' ? 3e20 : 2e20;
  const sdDoping = Math.min(sdPeak, maxSdDoping);

  // === LDD Implant ===
  const lddSpecies = process.ldd.species;
  const lddDose = process.ldd.dose;
  const lddEnergy = process.ldd.energy;
  const { dRp: ldddRp } = getImplantRange(lddSpecies, lddEnergy);

  const lddDiffusion = diffusionLength(lddSpecies, Tanneal, tanneal);
  const ldddRpFinal = Math.sqrt(ldddRp * ldddRp + lddDiffusion * lddDiffusion * 0.25);

  const lddPeak = peakConcentration(lddDose, ldddRpFinal) * activation;
  const maxLddDoping = 1e20;
  const lddDoping = Math.min(lddPeak, maxLddDoping);

  // LDD length is approximately the spacer width + lateral diffusion
  const lddLength = process.spacer.width + lddDiffusion * 0.3;

  // === Halo (if enabled) ===
  let finalChannelDoping = channelDoping;
  if (process.halo.enabled) {
    const haloDose = process.halo.dose;
    const haloEnergy = process.halo.energy;
    const { dRp: halodRp } = getImplantRange(isNMOS ? 'B' : 'As', haloEnergy);
    const haloPeak = peakConcentration(haloDose, halodRp) * activation * 0.5;
    // Halo increases effective channel doping near S/D
    finalChannelDoping = channelDoping + haloPeak * 0.2;
  }

  // Build device params
  return {
    gate: {
      oxideMaterial: process.gateStack.oxideMaterial,
      tox,
      gateMaterial,
      workFunction,
      length: gateLength,
    },
    channel: {
      doping: finalChannelDoping,
      profileType: 'uniform',
    },
    sourceDrain: {
      doping: sdDoping,
      junctionDepth: Math.max(10, Math.min(200, sdJunctionDepth)),
      lddDoping,
      lddLength: Math.max(5, Math.min(50, lddLength)),
    },
    substrate: {
      type: isNMOS ? 'p-type' : 'n-type',
      doping: wellDoping,
    },
    geometry: {
      width: process.isolation.activeWidth,
      overlapLength: Math.min(10, lddLength * 0.3),
    },
    advanced: {
      fixedCharge: 0,
      interfaceTrapDensity: 0,
      seriesResistanceS: 0,
      seriesResistanceD: 0,
    },
  };
}

/**
 * Format a calculated parameter for display
 */
export function formatCalculatedParam(value: number, unit: string): string {
  if (Math.abs(value) >= 1e18) {
    return `${(value / 1e18).toFixed(2)}×10¹⁸ ${unit}`;
  }
  if (Math.abs(value) >= 1e15) {
    return `${(value / 1e15).toFixed(2)}×10¹⁵ ${unit}`;
  }
  if (Math.abs(value) >= 1e12) {
    return `${(value / 1e12).toFixed(2)}×10¹² ${unit}`;
  }
  return `${value.toFixed(2)} ${unit}`;
}
