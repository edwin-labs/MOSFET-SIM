/**
 * Advanced Physics Effects
 *
 * Additional physical models for enhanced simulation accuracy:
 * - Fowler-Nordheim Gate Tunneling
 * - Direct Tunneling
 * - Hot Carrier Injection
 * - Impact Ionization
 * - Auger Recombination
 * - Band-to-Band Tunneling (BTBT)
 */

import { Q, H, HBAR, M0 } from './constants';
import type { OxideMaterial } from '../types/device';

/**
 * Fowler-Nordheim Tunneling Current
 *
 * Electron tunneling through the oxide barrier under high electric field
 * J_FN = A_FN * E_ox^2 * exp(-B_FN / E_ox)
 *
 * @param Eox - Electric field in oxide (V/cm)
 * @param phiB - Barrier height (eV), typically ~3.1 eV for Si/SiO2
 * @returns Current density (A/cm^2)
 */
export function fowlerNordheimCurrent(Eox: number, phiB: number = 3.1): number {
  // Effective electron mass in oxide (m* ≈ 0.5 * m0 for SiO2)
  const meff = 0.5 * M0;

  // FN parameters
  // A_FN = q^3 / (8π * h * φ_B) ≈ 1.54e-6 A/V^2 for SiO2
  const A_FN = (Q * Q * Q) / (8 * Math.PI * H * phiB * Q);

  // B_FN = (4/3) * sqrt(2 * m* * φ_B^3) / (ℏ * q) ≈ 6.83e7 V/cm for SiO2
  const B_FN = (4 / 3) * Math.sqrt(2 * meff * Math.pow(phiB * Q, 3)) / (HBAR * Q);

  const absEox = Math.abs(Eox);
  if (absEox < 1e5) return 0; // Below threshold field

  const J_FN = A_FN * absEox * absEox * Math.exp(-B_FN / absEox);

  return J_FN;
}

/**
 * Direct Tunneling Current (for ultra-thin oxides < 3nm)
 *
 * Uses WKB approximation for trapezoidal barrier
 *
 * @param Vox - Voltage across oxide (V)
 * @param tox - Oxide thickness (nm)
 * @param oxideMaterial - Oxide material type
 * @returns Current density (A/cm^2)
 */
export function directTunnelingCurrent(
  Vox: number,
  tox: number,
  _oxideMaterial: OxideMaterial = 'SiO2'
): number {
  const phiB = 3.1; // Barrier height (eV)
  const meff = 0.5 * M0; // Effective mass

  const tox_cm = tox * 1e-7;
  const absVox = Math.abs(Vox);

  if (tox > 4 || absVox < 0.1) return 0; // Only significant for thin oxides

  // Simple WKB approximation
  const kappa = Math.sqrt(2 * meff * (phiB - absVox / 2) * Q) / HBAR;
  const T = Math.exp(-2 * kappa * tox_cm);

  // Pre-factor (simplified)
  const A_DT = (Q * Q * Q) / (4 * Math.PI * Math.PI * H * tox_cm * tox_cm);
  const J_DT = A_DT * absVox * T;

  return Math.min(J_DT, 1e6); // Cap at reasonable value
}

/**
 * Gate Leakage Current (combined FN + DT)
 *
 * @param Vgs - Gate-source voltage (V)
 * @param Vfb - Flat-band voltage (V)
 * @param tox - Oxide thickness (nm)
 * @param oxideMaterial - Oxide material type
 * @param area - Gate area (cm^2)
 * @returns Gate leakage current (A)
 */
export function gateLeakageCurrent(
  Vgs: number,
  Vfb: number,
  tox: number,
  oxideMaterial: OxideMaterial = 'SiO2',
  area: number = 1e-8
): number {
  const Vox = Vgs - Vfb;
  const Eox = Math.abs(Vox) / (tox * 1e-7); // V/cm

  let J = 0;

  // Fowler-Nordheim for thick oxides and high fields
  if (tox >= 3) {
    J = fowlerNordheimCurrent(Eox);
  }

  // Direct tunneling for thin oxides
  if (tox < 4) {
    J += directTunnelingCurrent(Vox, tox, oxideMaterial);
  }

  return J * area;
}

/**
 * Impact Ionization Multiplication Factor
 *
 * Models avalanche breakdown near drain
 * M = 1 / (1 - (Vds / BVds)^n)
 *
 * @param Vds - Drain-source voltage (V)
 * @param Vdsat - Saturation voltage (V)
 * @param L - Channel length (nm)
 * @returns Multiplication factor M
 */
export function impactIonizationFactor(
  Vds: number,
  Vdsat: number,
  L: number
): number {
  const absVds = Math.abs(Vds);
  const absVdsat = Math.abs(Vdsat);

  if (absVds <= absVdsat) return 1;

  // Impact ionization coefficient
  const alpha = 2e6; // cm^-1 (typical for Si)
  const beta = 1.5e6; // V/cm

  // Electric field in pinch-off region
  const Epinch = (absVds - absVdsat) / (L * 1e-7 * 0.1); // Simplified

  if (Epinch > 1e5) {
    // Chynoweth model: α = α_0 * exp(-β/E)
    const alpha_eff = alpha * Math.exp(-beta / Epinch);
    const M = 1 + alpha_eff * L * 1e-7 * 0.1;
    return Math.min(M, 10); // Cap at reasonable value
  }

  return 1;
}

/**
 * Hot Carrier Substrate Current
 *
 * Models impact ionization generated substrate current
 * Isub = Id * (M - 1) * Ai * exp(-Bi / (Vds - Vdsat))
 *
 * @param Id - Drain current (A)
 * @param Vds - Drain-source voltage (V)
 * @param Vdsat - Saturation voltage (V)
 * @param L - Channel length (nm)
 * @returns Substrate current (A)
 */
export function hotCarrierSubstrateCurrent(
  Id: number,
  Vds: number,
  Vdsat: number,
  L: number
): number {
  const absVds = Math.abs(Vds);
  const absVdsat = Math.abs(Vdsat);
  const absId = Math.abs(Id);

  if (absVds <= absVdsat * 1.1) return 0;

  // Empirical parameters
  const Ai = 1e-6; // Impact ionization pre-factor
  const Bi = 1.5; // Characteristic voltage

  const deltaV = absVds - absVdsat;
  if (deltaV < 0.1) return 0;

  const M = impactIonizationFactor(Vds, Vdsat, L);
  const Isub = absId * (M - 1) * Ai * Math.exp(-Bi / deltaV);

  return Math.min(Isub, absId * 0.1); // Cap at 10% of Id
}

/**
 * Auger Recombination Rate
 *
 * Three-particle recombination process significant at high carrier densities
 * R_Auger = (Cn * n + Cp * p) * (n * p - ni^2)
 *
 * @param n - Electron concentration (cm^-3)
 * @param p - Hole concentration (cm^-3)
 * @param ni - Intrinsic carrier concentration (cm^-3)
 * @returns Recombination rate (cm^-3 s^-1)
 */
export function augerRecombination(
  n: number,
  p: number,
  ni: number
): number {
  // Auger coefficients for Si (cm^6/s)
  const Cn = 2.8e-31; // Electron-electron-hole
  const Cp = 9.9e-32; // Hole-hole-electron

  const np_excess = n * p - ni * ni;
  if (np_excess <= 0) return 0;

  return (Cn * n + Cp * p) * np_excess;
}

/**
 * Band-to-Band Tunneling Current
 *
 * Tunneling in high-field depletion region (gate-induced drain leakage)
 *
 * @param E - Electric field (V/cm)
 * @param Eg - Bandgap (eV)
 * @returns Tunneling generation rate (cm^-3 s^-1)
 */
export function bandToBandTunneling(E: number, Eg: number = 1.12): number {
  const absE = Math.abs(E);

  if (absE < 1e5) return 0; // Below threshold

  // Kane model parameters for Si
  const A_BTBT = 4e14; // cm^-1 s^-1 V^-1
  const B_BTBT = 1.9e7; // V/cm

  const G_BTBT = A_BTBT * absE * absE / Math.sqrt(Eg) * Math.exp(-B_BTBT * Math.pow(Eg, 1.5) / absE);

  return G_BTBT;
}

/**
 * Gate-Induced Drain Leakage (GIDL)
 *
 * BTBT at gate-drain overlap region
 *
 * @param Vgd - Gate-drain voltage (V)
 * @param Vth - Threshold voltage (V)
 * @param tox - Oxide thickness (nm)
 * @param xj - Junction depth (nm)
 * @param area - Overlap area (cm^2)
 * @returns GIDL current (A)
 */
export function gidlCurrent(
  Vgd: number,
  Vth: number,
  tox: number,
  xj: number,
  area: number = 1e-10
): number {
  // GIDL is significant when gate is negative relative to drain
  const Vgd_eff = Vgd - Vth;
  if (Vgd_eff > -0.5) return 0;

  const absVgd = Math.abs(Vgd_eff);

  // Electric field at surface
  const Es = absVgd / (tox * 1e-7 + xj * 1e-7 * 0.5);

  // Band-to-band tunneling
  const G_btbt = bandToBandTunneling(Es);

  // Effective volume
  const Leff = Math.min(xj * 1e-7, 20e-7); // Effective depletion length
  const Ibtbt = Q * G_btbt * Leff * area;

  return Math.min(Ibtbt, 1e-6); // Cap at 1uA
}

/**
 * Self-Heating Temperature Rise
 *
 * Estimates device temperature rise due to power dissipation
 *
 * @param Pd - Power dissipation (W)
 * @param Rth - Thermal resistance (K/W)
 * @param Tamb - Ambient temperature (K)
 * @returns Device temperature (K)
 */
export function selfHeatingTemperature(
  Pd: number,
  Rth: number = 1000, // Typical value for small device
  Tamb: number = 300
): number {
  const deltaT = Pd * Rth;
  return Tamb + Math.min(deltaT, 200); // Cap at 200K rise
}

/**
 * Quantum Mechanical Correction to Oxide Capacitance
 *
 * Accounts for finite inversion layer thickness
 *
 * @param Cox - Oxide capacitance (F/cm^2)
 * @param Ns - Surface carrier concentration (cm^-2)
 * @param T - Temperature (K)
 * @returns Effective capacitance (F/cm^2)
 */
export function quantumCapacitanceCorrection(
  Cox: number,
  _Ns: number = 1e12,
  _T: number = 300
): number {
  // Quantum capacitance: Cq = q^2 * m* / (π * ℏ^2) for 2DEG
  const meff = 0.19 * M0; // Effective mass in inversion layer
  const Cq = (Q * Q * meff) / (Math.PI * HBAR * HBAR);

  // Dark space thickness (typical ~1nm)
  const eps_si = 11.7 * 8.854e-14; // F/cm
  const tdark = 1e-7; // 1nm in cm
  const Cdark = eps_si / tdark;

  // Series combination
  const Ceff = 1 / (1 / Cox + 1 / Cq + 1 / Cdark);

  return Ceff;
}

/**
 * Polysilicon Depletion Effect
 *
 * Additional capacitance in series when poly gate is depleted
 *
 * @param Cox - Oxide capacitance (F/cm^2)
 * @param Npoly - Poly doping concentration (cm^-3)
 * @param Vgs - Gate-source voltage (V)
 * @param Vfb - Flat-band voltage (V)
 * @returns Effective capacitance with poly depletion (F/cm^2)
 */
export function polyDepletionCapacitance(
  Cox: number,
  Npoly: number,
  Vgs: number,
  Vfb: number
): number {
  const eps_si = 11.7 * 8.854e-14; // F/cm

  // Only significant in inversion
  const Vgb = Vgs - Vfb;
  if (Vgb < 0) return Cox;

  // Poly depletion width
  const Wpoly = Math.sqrt((2 * eps_si * Math.abs(Vgb)) / (Q * Npoly));
  const maxWpoly = 10e-7; // Max 10nm depletion
  const Wpoly_eff = Math.min(Wpoly, maxWpoly);

  const Cpoly = eps_si / Wpoly_eff;

  // Series combination
  return 1 / (1 / Cox + 1 / Cpoly);
}
