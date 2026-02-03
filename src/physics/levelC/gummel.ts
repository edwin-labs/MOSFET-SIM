/**
 * Gummel Iteration Loop
 *
 * Decoupled self-consistent solver for Poisson-DD equations:
 * 1. Solve Poisson equation for potential ψ
 * 2. Solve electron continuity for n
 * 3. Solve hole continuity for p
 * 4. Check convergence, repeat
 *
 * This decoupled approach is simpler and more robust than
 * fully-coupled Newton iteration.
 */

import { Q, K_B } from '../constants';
import { niSi, mobilityElectron } from '../materials';
import { Mesh2D, generateMesh, meshIndex, isInSilicon, getDoping, RegionType } from './mesh';
import { solvePoisson } from './poisson';
import { solveContinuity } from './continuity';
import type { DeviceParams, DeviceType } from '../../types/device';
import type { NumericalResult2D } from '../../types/simulation';

const NM_TO_CM = 1e-7;

export interface GummelResult {
  mesh: Mesh2D;
  psi: Float64Array;
  n: Float64Array;
  p: Float64Array;
  Ex: Float64Array;
  Ez: Float64Array;
  Id: number;          // Drain current (A)
  converged: boolean;
  iterations: number;
  poissonIters: number;
  continuityIters: number;
}

export interface GummelOptions {
  maxIter: number;
  tolerance: number;
  meshOptions?: {
    minSpacing?: number;
    maxSpacing?: number;
  };
  progressCallback?: (progress: GummelProgress) => void;
}

export interface GummelProgress {
  iteration: number;
  maxIter: number;
  residual: number;
  phase: 'mesh' | 'poisson' | 'continuity' | 'convergence';
}

const DEFAULT_OPTIONS: GummelOptions = {
  maxIter: 50,
  tolerance: 1e-5,
};

/**
 * Compute electric field from potential
 */
function computeElectricField(
  mesh: Mesh2D,
  psi: Float64Array
): { Ex: Float64Array; Ez: Float64Array } {
  const { x, z, nx, nz } = mesh;
  const N = nx * nz;

  const Ex = new Float64Array(N);
  const Ez = new Float64Array(N);

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);

      // E = -∇ψ
      // Central difference where possible
      if (i > 0 && i < nx - 1) {
        Ex[idx] = -(psi[meshIndex(i + 1, j, nx)] - psi[meshIndex(i - 1, j, nx)]) /
                   (x[i + 1] - x[i - 1]) / NM_TO_CM; // V/cm
      } else if (i === 0) {
        Ex[idx] = -(psi[meshIndex(i + 1, j, nx)] - psi[idx]) /
                   (x[i + 1] - x[i]) / NM_TO_CM;
      } else {
        Ex[idx] = -(psi[idx] - psi[meshIndex(i - 1, j, nx)]) /
                   (x[i] - x[i - 1]) / NM_TO_CM;
      }

      if (j > 0 && j < nz - 1) {
        Ez[idx] = -(psi[meshIndex(i, j + 1, nx)] - psi[meshIndex(i, j - 1, nx)]) /
                   (z[j + 1] - z[j - 1]) / NM_TO_CM;
      } else if (j === 0) {
        Ez[idx] = -(psi[meshIndex(i, j + 1, nx)] - psi[idx]) /
                   (z[j + 1] - z[j]) / NM_TO_CM;
      } else {
        Ez[idx] = -(psi[idx] - psi[meshIndex(i, j - 1, nx)]) /
                   (z[j] - z[j - 1]) / NM_TO_CM;
      }
    }
  }

  return { Ex, Ez };
}

/**
 * Extract drain current from solution
 * Integrates current density at drain contact
 */
function extractDrainCurrent(
  mesh: Mesh2D,
  psi: Float64Array,
  n: Float64Array,
  params: DeviceParams,
  deviceType: DeviceType,
  T: number
): number {
  const { x, z, nx, nz, region } = mesh;
  const isNMOS = deviceType === 'nmos';
  const Vt = K_B * T / Q;
  const W = params.geometry.width * NM_TO_CM; // cm

  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;
  const drainEdge = L / 2 + lddLen + sdLen - 10;

  let totalCurrent = 0;

  // Find column near drain contact
  let drainCol = -1;
  for (let i = 0; i < nx; i++) {
    if (x[i] >= drainEdge) {
      drainCol = i;
      break;
    }
  }

  if (drainCol < 1) return 0;

  // Integrate current density across the drain contact
  for (let j = 0; j < nz - 1; j++) {
    const idx = meshIndex(drainCol, j, nx);
    const idx_left = meshIndex(drainCol - 1, j, nx);

    if (!isInSilicon(region[idx] as RegionType)) continue;
    if (!isInSilicon(region[idx_left] as RegionType)) continue;

    const dz = (j < nz - 1 ? z[j + 1] - z[j] : z[j] - z[j - 1]) * NM_TO_CM;
    const dx = (x[drainCol] - x[drainCol - 1]) * NM_TO_CM;

    // Scharfetter-Gummel current
    const dpsi = (psi[idx] - psi[idx_left]) / Vt;

    const doping = params.sourceDrain.doping;
    const mu = mobilityElectron(doping, T);

    // J_n = q * mu * n * E + q * D * dn/dx
    // Using S-G: J = q * D/dx * (n_j * B(-dpsi) - n_i * B(dpsi))
    const B_pos = dpsi / (Math.exp(dpsi) - 1 + 1e-30);
    const B_neg = -dpsi / (Math.exp(-dpsi) - 1 + 1e-30);

    const D = mu * Vt;
    const Jn = Q * D / dx * (n[idx] * Math.abs(B_neg) - n[idx_left] * Math.abs(B_pos));

    totalCurrent += Jn * dz * W;
  }

  return isNMOS ? Math.abs(totalCurrent) : -Math.abs(totalCurrent);
}

/**
 * Main Gummel iteration solver
 */
export function solveGummel(
  params: DeviceParams,
  deviceType: DeviceType,
  bias: { Vgs: number; Vds: number; Vbs: number },
  T: number,
  options: Partial<GummelOptions> = {},
  initialSolution?: GummelResult
): GummelResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isNMOS = deviceType === 'nmos';

  // Generate mesh
  opts.progressCallback?.({
    iteration: 0,
    maxIter: opts.maxIter,
    residual: Infinity,
    phase: 'mesh',
  });

  const mesh = initialSolution?.mesh || generateMesh(params, opts.meshOptions);
  const { nx, nz, z, region } = mesh;
  const N = nx * nz;

  // Initialize arrays
  let psi = new Float64Array(N);
  let n = new Float64Array(N);
  let p = new Float64Array(N);

  if (initialSolution) {
    psi.set(initialSolution.psi);
    n.set(initialSolution.n);
    p.set(initialSolution.p);
  } else {
    // Initialize with equilibrium values
    const ni = niSi(T);
    const Vt = K_B * T / Q;

    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = meshIndex(i, j, nx);
        const reg = region[idx] as RegionType;

        if (!isInSilicon(reg)) {
          continue;
        }

        const { Nd, Na } = getDoping(reg, params, isNMOS, z[j]);
        const Nnet = Nd - Na;

        if (Math.abs(Nnet) > ni) {
          psi[idx] = (Nnet > 0 ? 1 : -1) * Vt * Math.log(Math.abs(Nnet) / ni);
        }

        // Equilibrium carriers
        if (Nnet > 0) {
          n[idx] = (Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2;
          p[idx] = ni * ni / n[idx];
        } else {
          p[idx] = (-Nnet + Math.sqrt(Nnet * Nnet + 4 * ni * ni)) / 2;
          n[idx] = ni * ni / p[idx];
        }
      }
    }
  }

  let converged = false;
  let iter = 0;
  let totalPoissonIters = 0;
  let totalContinuityIters = 0;
  let prevPsi = new Float64Array(psi);

  // Gummel iteration loop
  for (iter = 0; iter < opts.maxIter; iter++) {
    // 1. Solve Poisson equation
    opts.progressCallback?.({
      iteration: iter,
      maxIter: opts.maxIter,
      residual: Infinity,
      phase: 'poisson',
    });

    const poissonResult = solvePoisson(mesh, params, deviceType, bias, T, psi, {
      maxIter: 30,
      tolerance: 1e-7,
      dampingFactor: 0.3,
    });

    psi = poissonResult.psi;
    totalPoissonIters += poissonResult.iterations;

    // Update carriers from Poisson
    n = poissonResult.n;
    p = poissonResult.p;

    // 2. Solve continuity equations
    opts.progressCallback?.({
      iteration: iter,
      maxIter: opts.maxIter,
      residual: Infinity,
      phase: 'continuity',
    });

    const continuityResult = solveContinuity(mesh, psi, n, p, params, deviceType, T, {
      maxIter: 20,
      tolerance: 1e-6,
      dampingFactor: 0.5,
    });

    n = continuityResult.n;
    p = continuityResult.p;
    totalContinuityIters += continuityResult.iterations;

    // 3. Check convergence
    opts.progressCallback?.({
      iteration: iter,
      maxIter: opts.maxIter,
      residual: 0,
      phase: 'convergence',
    });

    let maxChange = 0;
    for (let i = 0; i < N; i++) {
      if (isInSilicon(region[i] as RegionType)) {
        maxChange = Math.max(maxChange, Math.abs(psi[i] - prevPsi[i]));
      }
    }

    if (maxChange < opts.tolerance) {
      converged = true;
      break;
    }

    prevPsi.set(psi);
  }

  // Compute electric field
  const { Ex, Ez } = computeElectricField(mesh, psi);

  // Extract drain current
  const Id = extractDrainCurrent(mesh, psi, n, params, deviceType, T);

  return {
    mesh,
    psi,
    n,
    p,
    Ex,
    Ez,
    Id,
    converged,
    iterations: iter + 1,
    poissonIters: totalPoissonIters,
    continuityIters: totalContinuityIters,
  };
}

/**
 * Convert Gummel result to NumericalResult2D format for visualization
 */
export function toNumericalResult2D(result: GummelResult): NumericalResult2D {
  const { mesh, psi, n, p, Ex, Ez } = result;

  return {
    x: Array.from(mesh.x),
    z: Array.from(mesh.z),
    nx: mesh.nx,
    nz: mesh.nz,
    psi,
    n,
    p,
    Ex,
    Ez,
  };
}

/**
 * Level C Engine wrapper class
 */
export class LevelCEngine {
  private lastResult: GummelResult | null = null;

  /**
   * Solve for a single bias point
   */
  solve(
    params: DeviceParams,
    deviceType: DeviceType,
    bias: { Vgs: number; Vds: number; Vbs: number },
    T: number,
    options?: Partial<GummelOptions>
  ): GummelResult {
    // Use previous result as initial guess if bias is similar
    const initialSolution = this.lastResult || undefined;
    const result = solveGummel(params, deviceType, bias, T, options, initialSolution);
    this.lastResult = result;
    return result;
  }

  /**
   * I-V sweep (transfer or output characteristics)
   */
  sweepIV(
    params: DeviceParams,
    deviceType: DeviceType,
    sweepType: 'transfer' | 'output',
    fixedV: number,
    sweepRange: { start: number; end: number; points: number },
    T: number,
    options?: Partial<GummelOptions>,
    onPoint?: (index: number, total: number, V: number, Id: number) => void
  ): { V: number[]; Id: number[] } {
    const V: number[] = [];
    const Id: number[] = [];

    const { start, end, points } = sweepRange;

    for (let i = 0; i < points; i++) {
      const sweepV = start + (end - start) * (i / (points - 1));

      let bias: { Vgs: number; Vds: number; Vbs: number };
      if (sweepType === 'transfer') {
        bias = { Vgs: sweepV, Vds: fixedV, Vbs: 0 };
      } else {
        bias = { Vgs: fixedV, Vds: sweepV, Vbs: 0 };
      }

      const result = this.solve(params, deviceType, bias, T, options);

      V.push(sweepV);
      Id.push(result.Id);

      onPoint?.(i, points, sweepV, result.Id);
    }

    return { V, Id };
  }

  /**
   * Clear cached solution
   */
  reset(): void {
    this.lastResult = null;
  }
}
