/**
 * Physical constants in SI units
 * Reference: CODATA 2018
 */

/** Elementary charge (C) */
export const Q = 1.602176634e-19;

/** Boltzmann constant (J/K) */
export const K_B = 1.380649e-23;

/** Vacuum permittivity (F/m) */
export const EPS0 = 8.8541878128e-12;

/** Planck constant (J·s) */
export const H = 6.62607015e-34;

/** Reduced Planck constant (J·s) */
export const HBAR = 1.054571817e-34;

/** Electron rest mass (kg) */
export const M0 = 9.1093837015e-31;

/** Speed of light (m/s) */
export const C0 = 299792458;

/**
 * Thermal voltage V_T = kT/q (V)
 * @param T Temperature in Kelvin
 */
export function thermalVoltage(T: number): number {
  return (K_B * T) / Q;
}

/**
 * Thermal energy kT in eV
 * @param T Temperature in Kelvin
 */
export function kT_eV(T: number): number {
  return (K_B * T) / Q;
}

// Unit conversion constants
/** nm to cm */
export const NM_TO_CM = 1e-7;

/** cm to m */
export const CM_TO_M = 1e-2;

/** m to cm */
export const M_TO_CM = 1e2;

/** eV to Joules */
export const EV_TO_J = Q;

/** cm^-3 to m^-3 */
export const CM3_TO_M3 = 1e6;

/** m^-3 to cm^-3 */
export const M3_TO_CM3 = 1e-6;

/** F/m to F/cm */
export const F_M_TO_F_CM = 1e-2;
