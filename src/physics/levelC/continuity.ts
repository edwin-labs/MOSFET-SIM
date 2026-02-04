/**
 * Continuity Equation Solver (Scharfetter-Gummel)
 *
 * Solves electron and hole continuity equations:
 * ∂n/∂t = (1/q)∇·J_n - R
 * ∂p/∂t = -(1/q)∇·J_p - R
 *
 * At steady state: ∇·J_n = qR, ∇·J_p = -qR
 *
 * Uses Scharfetter-Gummel discretization for numerical stability
 */

import { Q, K_B } from '../constants';
import { niSi, mobilityElectron, mobilityHole } from '../materials';
import { Mesh2D, meshIndex, isInSilicon, getDoping, RegionType } from './mesh';
import { CSRBuilder, CSRMatrix, biCGSTAB, solve } from './sparseSolver';
import type { DeviceParams, DeviceType } from '../../types/device';

/**
 * Bernoulli function: B(x) = x / (exp(x) - 1)
 * Numerically stable implementation
 */
export function bernoulli(x: number): number {
  const absX = Math.abs(x);

  if (absX < 1e-10) {
    // Taylor expansion: B(x) ≈ 1 - x/2 + x²/12
    return 1 - x / 2 + x * x / 12;
  } else if (absX > 80) {
    // Asymptotic: B(x) ≈ -x for x << 0, 0 for x >> 0
    return x < 0 ? -x : x * Math.exp(-x);
  } else {
    return x / (Math.exp(x) - 1);
  }
}

/**
 * SRH recombination rate
 * R = (np - ni²) / (τ_p(n + ni) + τ_n(p + ni))
 */
export function srhRecombination(
  n: number,
  p: number,
  ni: number,
  tauN: number = 1e-7,  // electron lifetime (s)
  tauP: number = 1e-7   // hole lifetime (s)
): number {
  const np = n * p;
  const ni2 = ni * ni;

  if (np < ni2 * 0.99) {
    // Generation
    return (np - ni2) / (tauP * (n + ni) + tauN * (p + ni));
  } else if (np > ni2 * 1.01) {
    // Recombination
    return (np - ni2) / (tauP * (n + ni) + tauN * (p + ni));
  }

  return 0;
}

export interface ContinuityResult {
  n: Float64Array;
  p: Float64Array;
  Jn_x: Float64Array;   // Electron current density x-component
  Jn_z: Float64Array;   // Electron current density z-component
  Jp_x: Float64Array;   // Hole current density x-component
  Jp_z: Float64Array;   // Hole current density z-component
  converged: boolean;
  iterations: number;
}

export interface ContinuityOptions {
  maxIter: number;
  tolerance: number;
  dampingFactor: number;
}

const DEFAULT_OPTIONS: ContinuityOptions = {
  maxIter: 50,
  tolerance: 1e-6,
  dampingFactor: 0.5,
};

/**
 * Build electron continuity equation matrix
 * Using Scharfetter-Gummel discretization
 */
function buildElectronMatrix(
  mesh: Mesh2D,
  psi: Float64Array,
  n: Float64Array,
  p: Float64Array,
  Nd: Float64Array,
  Na: Float64Array,
  params: DeviceParams,
  isNMOS: boolean,
  T: number
): { A: CSRMatrix; b: Float64Array } {
  const { x, z, nx, nz, region } = mesh;
  const N = nx * nz;

  const builder = new CSRBuilder(N);
  const b = new Float64Array(N);

  const Vt = K_B * T / Q;
  const ni = niSi(T);
  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;
  const sdEdge = L / 2 + lddLen + sdLen;

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const reg = region[idx] as RegionType;

      // Non-silicon regions: identity
      if (!isInSilicon(reg)) {
        builder.set(idx, idx, 1);
        b[idx] = 0;
        continue;
      }

      // Boundary conditions
      const xVal = x[i];

      // Source contact
      if (xVal <= -sdEdge + 5 && (reg === RegionType.SOURCE || reg === RegionType.LDD_SOURCE)) {
        builder.set(idx, idx, 1);
        // Equilibrium: n = Nd (for n-type S/D in nMOS)
        b[idx] = isNMOS ? Nd[idx] : ni * ni / Na[idx];
        continue;
      }

      // Drain contact
      if (xVal >= sdEdge - 5 && (reg === RegionType.DRAIN || reg === RegionType.LDD_DRAIN)) {
        builder.set(idx, idx, 1);
        b[idx] = isNMOS ? Nd[idx] : ni * ni / Na[idx];
        continue;
      }

      // Bottom boundary
      if (j === nz - 1) {
        builder.set(idx, idx, 1);
        const Nnet = Nd[idx] - Na[idx];
        if (Nnet > 0) {
          b[idx] = (Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2;
        } else {
          b[idx] = ni * ni / ((-Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2);
        }
        continue;
      }

      // Interior point: Scharfetter-Gummel discretization
      // ∇·(μn∇ψ + Dn∇n) = R
      const doping = Nd[idx] + Na[idx];
      const mu = mobilityElectron(doping, T);
      const D = mu * Vt; // Einstein relation

      // Grid spacings
      const dx_left = i > 0 ? x[i] - x[i - 1] : 1e10;
      const dx_right = i < nx - 1 ? x[i + 1] - x[i] : 1e10;
      const dz_up = j > 0 ? z[j] - z[j - 1] : 1e10;
      const dz_down = j < nz - 1 ? z[j + 1] - z[j] : 1e10;

      const dx_avg = (dx_left + dx_right) / 2;
      const dz_avg = (dz_up + dz_down) / 2;

      let coef_center = 0;
      let rhs = 0;

      // Left neighbor
      if (i > 0 && isInSilicon(region[meshIndex(i - 1, j, nx)] as RegionType)) {
        const dpsi = (psi[idx] - psi[meshIndex(i - 1, j, nx)]) / Vt;
        const Bn = bernoulli(dpsi);
        const Bnm = bernoulli(-dpsi);
        const coef = D * mu / (dx_left * dx_avg);
        builder.set(idx, meshIndex(i - 1, j, nx), -coef * Bnm);
        coef_center += coef * Bn;
      }

      // Right neighbor
      if (i < nx - 1 && isInSilicon(region[meshIndex(i + 1, j, nx)] as RegionType)) {
        const dpsi = (psi[meshIndex(i + 1, j, nx)] - psi[idx]) / Vt;
        const Bn = bernoulli(dpsi);
        const Bnm = bernoulli(-dpsi);
        const coef = D * mu / (dx_right * dx_avg);
        builder.set(idx, meshIndex(i + 1, j, nx), -coef * Bn);
        coef_center += coef * Bnm;
      }

      // Up neighbor (smaller z)
      if (j > 0 && isInSilicon(region[meshIndex(i, j - 1, nx)] as RegionType)) {
        const dpsi = (psi[idx] - psi[meshIndex(i, j - 1, nx)]) / Vt;
        const Bn = bernoulli(dpsi);
        const Bnm = bernoulli(-dpsi);
        const coef = D * mu / (dz_up * dz_avg);
        builder.set(idx, meshIndex(i, j - 1, nx), -coef * Bnm);
        coef_center += coef * Bn;
      }

      // Down neighbor (larger z)
      if (j < nz - 1 && isInSilicon(region[meshIndex(i, j + 1, nx)] as RegionType)) {
        const dpsi = (psi[meshIndex(i, j + 1, nx)] - psi[idx]) / Vt;
        const Bn = bernoulli(dpsi);
        const Bnm = bernoulli(-dpsi);
        const coef = D * mu / (dz_down * dz_avg);
        builder.set(idx, meshIndex(i, j + 1, nx), -coef * Bn);
        coef_center += coef * Bnm;
      }

      // SRH recombination (linearized)
      const R = srhRecombination(n[idx], p[idx], ni);
      rhs = -R;

      // Add recombination Jacobian
      const dR_dn = p[idx] / (1e-7 * (n[idx] + ni) + 1e-7 * (p[idx] + ni));
      coef_center += dR_dn;

      builder.set(idx, idx, coef_center);
      b[idx] = rhs + dR_dn * n[idx];
    }
  }

  return { A: builder.build(), b };
}

/**
 * Build hole continuity equation matrix
 */
function buildHoleMatrix(
  mesh: Mesh2D,
  psi: Float64Array,
  n: Float64Array,
  p: Float64Array,
  Nd: Float64Array,
  Na: Float64Array,
  params: DeviceParams,
  isNMOS: boolean,
  T: number
): { A: CSRMatrix; b: Float64Array } {
  const { x, z, nx, nz, region } = mesh;
  const N = nx * nz;

  const builder = new CSRBuilder(N);
  const b = new Float64Array(N);

  const Vt = K_B * T / Q;
  const ni = niSi(T);
  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;
  const sdEdge = L / 2 + lddLen + sdLen;

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const reg = region[idx] as RegionType;

      if (!isInSilicon(reg)) {
        builder.set(idx, idx, 1);
        b[idx] = 0;
        continue;
      }

      const xVal = x[i];

      // Source contact
      if (xVal <= -sdEdge + 5 && (reg === RegionType.SOURCE || reg === RegionType.LDD_SOURCE)) {
        builder.set(idx, idx, 1);
        b[idx] = isNMOS ? ni * ni / Nd[idx] : Na[idx];
        continue;
      }

      // Drain contact
      if (xVal >= sdEdge - 5 && (reg === RegionType.DRAIN || reg === RegionType.LDD_DRAIN)) {
        builder.set(idx, idx, 1);
        b[idx] = isNMOS ? ni * ni / Nd[idx] : Na[idx];
        continue;
      }

      // Bottom boundary
      if (j === nz - 1) {
        builder.set(idx, idx, 1);
        const Nnet = Nd[idx] - Na[idx];
        if (Nnet < 0) {
          b[idx] = (-Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2;
        } else {
          b[idx] = ni * ni / ((Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2);
        }
        continue;
      }

      // Interior: S-G discretization for holes
      const doping = Nd[idx] + Na[idx];
      const mu = mobilityHole(doping, T);
      const D = mu * Vt;

      const dx_left = i > 0 ? x[i] - x[i - 1] : 1e10;
      const dx_right = i < nx - 1 ? x[i + 1] - x[i] : 1e10;
      const dz_up = j > 0 ? z[j] - z[j - 1] : 1e10;
      const dz_down = j < nz - 1 ? z[j + 1] - z[j] : 1e10;

      const dx_avg = (dx_left + dx_right) / 2;
      const dz_avg = (dz_up + dz_down) / 2;

      let coef_center = 0;
      let rhs = 0;

      // Note: For holes, potential sign is reversed
      if (i > 0 && isInSilicon(region[meshIndex(i - 1, j, nx)] as RegionType)) {
        const dpsi = -(psi[idx] - psi[meshIndex(i - 1, j, nx)]) / Vt;
        const Bp = bernoulli(dpsi);
        const Bpm = bernoulli(-dpsi);
        const coef = D * mu / (dx_left * dx_avg);
        builder.set(idx, meshIndex(i - 1, j, nx), -coef * Bpm);
        coef_center += coef * Bp;
      }

      if (i < nx - 1 && isInSilicon(region[meshIndex(i + 1, j, nx)] as RegionType)) {
        const dpsi = -(psi[meshIndex(i + 1, j, nx)] - psi[idx]) / Vt;
        const Bp = bernoulli(dpsi);
        const Bpm = bernoulli(-dpsi);
        const coef = D * mu / (dx_right * dx_avg);
        builder.set(idx, meshIndex(i + 1, j, nx), -coef * Bp);
        coef_center += coef * Bpm;
      }

      if (j > 0 && isInSilicon(region[meshIndex(i, j - 1, nx)] as RegionType)) {
        const dpsi = -(psi[idx] - psi[meshIndex(i, j - 1, nx)]) / Vt;
        const Bp = bernoulli(dpsi);
        const Bpm = bernoulli(-dpsi);
        const coef = D * mu / (dz_up * dz_avg);
        builder.set(idx, meshIndex(i, j - 1, nx), -coef * Bpm);
        coef_center += coef * Bp;
      }

      if (j < nz - 1 && isInSilicon(region[meshIndex(i, j + 1, nx)] as RegionType)) {
        const dpsi = -(psi[meshIndex(i, j + 1, nx)] - psi[idx]) / Vt;
        const Bp = bernoulli(dpsi);
        const Bpm = bernoulli(-dpsi);
        const coef = D * mu / (dz_down * dz_avg);
        builder.set(idx, meshIndex(i, j + 1, nx), -coef * Bp);
        coef_center += coef * Bpm;
      }

      const R = srhRecombination(n[idx], p[idx], ni);
      rhs = -R;

      const dR_dp = n[idx] / (1e-7 * (n[idx] + ni) + 1e-7 * (p[idx] + ni));
      coef_center += dR_dp;

      builder.set(idx, idx, coef_center);
      b[idx] = rhs + dR_dp * p[idx];
    }
  }

  return { A: builder.build(), b };
}

/**
 * Solve continuity equations for electrons and holes
 */
export function solveContinuity(
  mesh: Mesh2D,
  psi: Float64Array,
  n0: Float64Array,
  p0: Float64Array,
  params: DeviceParams,
  deviceType: DeviceType,
  T: number,
  options: Partial<ContinuityOptions> = {}
): ContinuityResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isNMOS = deviceType === 'nmos';
  const { nx, nz, z, region } = mesh;
  const N = nx * nz;

  // Copy initial values
  const n = new Float64Array(n0);
  const p = new Float64Array(p0);

  // Pre-compute doping
  const Nd = new Float64Array(N);
  const Na = new Float64Array(N);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const dop = getDoping(region[idx] as RegionType, params, isNMOS, z[j]);
      Nd[idx] = dop.Nd;
      Na[idx] = dop.Na;
    }
  }

  let converged = false;
  let iter = 0;

  for (iter = 0; iter < opts.maxIter; iter++) {
    // Solve electron continuity
    const { A: An, b: bn } = buildElectronMatrix(mesh, psi, n, p, Nd, Na, params, isNMOS, T);
    const nResult = biCGSTAB(An, bn, n, { maxIter: 200, tolerance: 1e-8 });

    // Solve hole continuity
    const { A: Ap, b: bp } = buildHoleMatrix(mesh, psi, n, p, Nd, Na, params, isNMOS, T);
    const pResult = biCGSTAB(Ap, bp, p, { maxIter: 200, tolerance: 1e-8 });

    // Update with damping
    let maxChange = 0;
    for (let i = 0; i < N; i++) {
      if (!isInSilicon(region[i] as RegionType)) continue;

      const dn = nResult.x[i] - n[i];
      const dp = pResult.x[i] - p[i];

      maxChange = Math.max(maxChange, Math.abs(dn) / Math.max(n[i], 1e10));
      maxChange = Math.max(maxChange, Math.abs(dp) / Math.max(p[i], 1e10));

      n[i] = Math.max(1e4, n[i] + opts.dampingFactor * dn);
      p[i] = Math.max(1e4, p[i] + opts.dampingFactor * dp);
    }

    if (maxChange < opts.tolerance) {
      converged = true;
      break;
    }
  }

  // Compute current densities (placeholder - would need proper S-G flux calculation)
  const Jn_x = new Float64Array(N);
  const Jn_z = new Float64Array(N);
  const Jp_x = new Float64Array(N);
  const Jp_z = new Float64Array(N);

  return {
    n,
    p,
    Jn_x,
    Jn_z,
    Jp_x,
    Jp_z,
    converged,
    iterations: iter + 1,
  };
}

/**
 * Async continuity solver with optional GPU acceleration
 */
export async function solveContinuityAsync(
  mesh: Mesh2D,
  psi: Float64Array,
  n0: Float64Array,
  p0: Float64Array,
  params: DeviceParams,
  deviceType: DeviceType,
  T: number,
  options: Partial<ContinuityOptions> = {},
  useGPU = false
): Promise<ContinuityResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isNMOS = deviceType === 'nmos';
  const { nx, nz, z, region } = mesh;
  const N = nx * nz;

  // Copy initial values
  const n = new Float64Array(n0);
  const p = new Float64Array(p0);

  // Pre-compute doping
  const Nd = new Float64Array(N);
  const Na = new Float64Array(N);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const dop = getDoping(region[idx] as RegionType, params, isNMOS, z[j]);
      Nd[idx] = dop.Nd;
      Na[idx] = dop.Na;
    }
  }

  let converged = false;
  let iter = 0;

  for (iter = 0; iter < opts.maxIter; iter++) {
    // Solve electron continuity (async with optional GPU)
    const { A: An, b: bn } = buildElectronMatrix(mesh, psi, n, p, Nd, Na, params, isNMOS, T);
    const nResult = await solve(An, bn, n, { maxIter: 200, tolerance: 1e-8, useGPU });

    // Solve hole continuity (async with optional GPU)
    const { A: Ap, b: bp } = buildHoleMatrix(mesh, psi, n, p, Nd, Na, params, isNMOS, T);
    const pResult = await solve(Ap, bp, p, { maxIter: 200, tolerance: 1e-8, useGPU });

    // Update with damping
    let maxChange = 0;
    for (let i = 0; i < N; i++) {
      if (!isInSilicon(region[i] as RegionType)) continue;

      const dn = nResult.x[i] - n[i];
      const dp = pResult.x[i] - p[i];

      maxChange = Math.max(maxChange, Math.abs(dn) / Math.max(n[i], 1e10));
      maxChange = Math.max(maxChange, Math.abs(dp) / Math.max(p[i], 1e10));

      n[i] = Math.max(1e4, n[i] + opts.dampingFactor * dn);
      p[i] = Math.max(1e4, p[i] + opts.dampingFactor * dp);
    }

    if (maxChange < opts.tolerance) {
      converged = true;
      break;
    }
  }

  // Compute current densities (placeholder)
  const Jn_x = new Float64Array(N);
  const Jn_z = new Float64Array(N);
  const Jp_x = new Float64Array(N);
  const Jp_z = new Float64Array(N);

  return {
    n,
    p,
    Jn_x,
    Jn_z,
    Jp_x,
    Jp_z,
    converged,
    iterations: iter + 1,
  };
}
