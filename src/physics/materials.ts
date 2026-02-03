import { kT_eV } from './constants';
import type { ImplantSpecies } from '../types/device';
import type { SiliconProperties, OxidePropertiesMap, GateWorkFunctionMap, ImplantTableMap } from '../types/materials';

/**
 * Silicon material parameters
 * Reference: Sze, Physics of Semiconductor Devices
 */
export const Si: SiliconProperties = {
  Eg_0: 1.166,          // eV - bandgap at 0K
  Eg_alpha: 4.73e-4,    // eV/K - Varshni alpha
  Eg_beta: 636,         // K - Varshni beta
  eps_r: 11.7,          // relative permittivity
  chi: 4.05,            // eV - electron affinity
  Nc_300: 2.86e19,      // cm^-3 - conduction band DOS at 300K
  Nv_300: 3.10e19,      // cm^-3 - valence band DOS at 300K
  ni_300: 1.07e10,      // cm^-3 - intrinsic carrier at 300K
  mu_n_max: 1400,       // cm^2/V·s - low-field electron mobility
  mu_p_max: 450,        // cm^2/V·s - low-field hole mobility
  mu_n_min: 65,         // cm^2/V·s - Caughey-Thomas minimum
  mu_p_min: 47,         // cm^2/V·s
  Nref_n: 8.5e16,       // cm^-3 - Caughey-Thomas reference
  Nref_p: 6.3e16,       // cm^-3
  alpha_n: 0.72,        // Caughey-Thomas exponent
  alpha_p: 0.76,        // Caughey-Thomas exponent
  vsat_n: 1.07e7,       // cm/s - electron saturation velocity
  vsat_p: 8.37e6,       // cm/s - hole saturation velocity
};

/**
 * Varshni bandgap model: Eg(T) = Eg_0 - alpha*T^2/(T+beta)
 * @param T Temperature in Kelvin
 * @returns Bandgap in eV
 */
export function bandgapSi(T: number): number {
  return Si.Eg_0 - (Si.Eg_alpha * T * T) / (T + Si.Eg_beta);
}

/**
 * Intrinsic carrier concentration ni(T)
 * Uses Varshni bandgap and T^1.5 scaling for DOS
 * @param T Temperature in Kelvin
 * @returns ni in cm^-3
 */
export function niSi(T: number): number {
  const Eg = bandgapSi(T);
  const Nc = Si.Nc_300 * Math.pow(T / 300, 1.5);
  const Nv = Si.Nv_300 * Math.pow(T / 300, 1.5);
  return Math.sqrt(Nc * Nv) * Math.exp(-Eg / (2 * kT_eV(T)));
}

/**
 * Effective density of states in conduction band
 * @param T Temperature in Kelvin
 * @returns Nc in cm^-3
 */
export function NcSi(T: number): number {
  return Si.Nc_300 * Math.pow(T / 300, 1.5);
}

/**
 * Effective density of states in valence band
 * @param T Temperature in Kelvin
 * @returns Nv in cm^-3
 */
export function NvSi(T: number): number {
  return Si.Nv_300 * Math.pow(T / 300, 1.5);
}

/**
 * Caughey-Thomas mobility model for electrons
 * @param Ntotal Total doping concentration in cm^-3
 * @param T Temperature in Kelvin
 * @returns Mobility in cm^2/V·s
 */
export function mobilityElectron(Ntotal: number, T: number): number {
  const mu_max = Si.mu_n_max * Math.pow(T / 300, -2.4);
  return (
    Si.mu_n_min +
    (mu_max - Si.mu_n_min) / (1 + Math.pow(Ntotal / Si.Nref_n, Si.alpha_n))
  );
}

/**
 * Caughey-Thomas mobility model for holes
 * @param Ntotal Total doping concentration in cm^-3
 * @param T Temperature in Kelvin
 * @returns Mobility in cm^2/V·s
 */
export function mobilityHole(Ntotal: number, T: number): number {
  const mu_max = Si.mu_p_max * Math.pow(T / 300, -2.2);
  return (
    Si.mu_p_min +
    (mu_max - Si.mu_p_min) / (1 + Math.pow(Ntotal / Si.Nref_p, Si.alpha_p))
  );
}

/**
 * Electron saturation velocity with temperature dependence
 * @param T Temperature in Kelvin
 * @returns vsat in cm/s
 */
export function vsatElectron(T: number): number {
  return Si.vsat_n * Math.pow(300 / T, 0.8);
}

/**
 * Hole saturation velocity with temperature dependence
 * @param T Temperature in Kelvin
 * @returns vsat in cm/s
 */
export function vsatHole(T: number): number {
  return Si.vsat_p * Math.pow(300 / T, 0.8);
}

/**
 * Oxide material properties
 */
export const OXIDES: OxidePropertiesMap = {
  SiO2: { eps_r: 3.9, Eg: 9.0, barrier_n: 3.1 },
  HfO2: { eps_r: 25, Eg: 5.8, barrier_n: 1.5 },
};

/**
 * Gate material work functions (eV)
 */
export const GATE_WORK_FUNCTIONS: GateWorkFunctionMap = {
  'poly-n': 4.15,   // n+ polysilicon
  'poly-p': 5.25,   // p+ polysilicon
  TiN: 4.6,
  TaN: 4.4,
};

/**
 * Implant range tables: species -> energy(keV) -> { Rp(nm), dRp(nm) }
 * Values from SRIM/TRIM simulations for silicon target
 */
export const IMPLANT_TABLES: ImplantTableMap = {
  B: [
    { energy: 5, Rp: 20, dRp: 9 },
    { energy: 10, Rp: 35, dRp: 15 },
    { energy: 20, Rp: 68, dRp: 27 },
    { energy: 30, Rp: 100, dRp: 37 },
    { energy: 50, Rp: 165, dRp: 53 },
    { energy: 80, Rp: 260, dRp: 73 },
    { energy: 100, Rp: 320, dRp: 85 },
  ],
  BF2: [
    { energy: 10, Rp: 15, dRp: 6 },
    { energy: 20, Rp: 25, dRp: 10 },
    { energy: 30, Rp: 37, dRp: 14 },
    { energy: 50, Rp: 60, dRp: 21 },
    { energy: 80, Rp: 95, dRp: 32 },
  ],
  P: [
    { energy: 10, Rp: 13, dRp: 5 },
    { energy: 20, Rp: 24, dRp: 10 },
    { energy: 30, Rp: 36, dRp: 14 },
    { energy: 50, Rp: 60, dRp: 22 },
    { energy: 80, Rp: 98, dRp: 34 },
    { energy: 100, Rp: 125, dRp: 42 },
  ],
  As: [
    { energy: 10, Rp: 8, dRp: 3 },
    { energy: 20, Rp: 14, dRp: 6 },
    { energy: 30, Rp: 20, dRp: 8 },
    { energy: 50, Rp: 30, dRp: 11 },
    { energy: 80, Rp: 44, dRp: 16 },
    { energy: 100, Rp: 55, dRp: 19 },
  ],
};

/**
 * Interpolate implant range parameters for given energy
 * @param species Implant species
 * @param energy Energy in keV
 * @returns { Rp: nm, dRp: nm }
 */
export function getImplantRange(
  species: ImplantSpecies,
  energy: number
): { Rp: number; dRp: number } {
  const table = IMPLANT_TABLES[species];
  if (!table || table.length === 0) {
    return { Rp: 10, dRp: 5 };
  }

  // Clamp to table range
  if (energy <= table[0].energy) {
    return { Rp: table[0].Rp, dRp: table[0].dRp };
  }
  if (energy >= table[table.length - 1].energy) {
    const last = table[table.length - 1];
    return { Rp: last.Rp, dRp: last.dRp };
  }

  // Linear interpolation
  for (let i = 0; i < table.length - 1; i++) {
    if (energy >= table[i].energy && energy <= table[i + 1].energy) {
      const t =
        (energy - table[i].energy) / (table[i + 1].energy - table[i].energy);
      return {
        Rp: table[i].Rp + t * (table[i + 1].Rp - table[i].Rp),
        dRp: table[i].dRp + t * (table[i + 1].dRp - table[i].dRp),
      };
    }
  }

  return { Rp: 10, dRp: 5 };
}
