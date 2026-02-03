import type { OxideMaterial, GateMaterial, ImplantSpecies } from './device';

export interface SiliconProperties {
  Eg_0: number;       // eV - bandgap at 0K
  Eg_alpha: number;   // eV/K - Varshni parameter
  Eg_beta: number;    // K - Varshni parameter
  eps_r: number;      // relative permittivity
  chi: number;        // eV - electron affinity
  Nc_300: number;     // cm^-3 - conduction band DOS at 300K
  Nv_300: number;     // cm^-3 - valence band DOS at 300K
  ni_300: number;     // cm^-3 - intrinsic carrier concentration at 300K
  mu_n_max: number;   // cm^2/V·s - max electron mobility
  mu_p_max: number;   // cm^2/V·s - max hole mobility
  mu_n_min: number;   // cm^2/V·s - min electron mobility
  mu_p_min: number;   // cm^2/V·s - min hole mobility
  Nref_n: number;     // cm^-3 - Caughey-Thomas reference for electrons
  Nref_p: number;     // cm^-3 - Caughey-Thomas reference for holes
  alpha_n: number;    // Caughey-Thomas exponent for electrons
  alpha_p: number;    // Caughey-Thomas exponent for holes
  vsat_n: number;     // cm/s - electron saturation velocity
  vsat_p: number;     // cm/s - hole saturation velocity
}

export interface OxideProperties {
  eps_r: number;      // relative permittivity
  Eg: number;         // eV - bandgap
  barrier_n: number;  // eV - electron barrier height
}

export interface ImplantRange {
  energy: number;     // keV
  Rp: number;         // nm - projected range
  dRp: number;        // nm - straggle
}

export type OxidePropertiesMap = Record<OxideMaterial, OxideProperties>;
export type GateWorkFunctionMap = Record<GateMaterial, number>;
export type ImplantTableMap = Record<ImplantSpecies, ImplantRange[]>;
