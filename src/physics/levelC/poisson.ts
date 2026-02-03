/**
 * 2D Poisson Solver
 *
 * Solves: ∇·(ε∇ψ) = -ρ/ε₀
 * where ρ = q(p - n + N_D - N_A)
 *
 * Uses 5-point stencil finite difference on non-uniform grid
 * with Newton linearization for charge terms
 */

import { Q, EPS0, K_B } from '../constants';
import { Si, niSi } from '../materials';
import { Mesh2D, meshIndex, isInSilicon, getDoping, RegionType } from './mesh';
import { CSRBuilder, CSRMatrix, biCGSTAB } from './sparseSolver';
import type { DeviceParams, DeviceType } from '../../types/device';

export interface PoissonResult {
  psi: Float64Array;        // Potential (V)
  n: Float64Array;          // Electron concentration (cm^-3)
  p: Float64Array;          // Hole concentration (cm^-3)
  converged: boolean;
  iterations: number;
  maxResidual: number;
}

export interface PoissonOptions {
  maxIter: number;          // Maximum Newton iterations
  tolerance: number;        // Convergence tolerance (V)
  dampingFactor: number;    // Under-relaxation factor (0-1)
}

const DEFAULT_OPTIONS: PoissonOptions = {
  maxIter: 100,
  tolerance: 1e-6,
  dampingFactor: 0.3,
};

/**
 * Compute electron and hole concentrations from potential
 * Using Boltzmann statistics: n = ni * exp(q*ψ/kT), p = ni * exp(-q*ψ/kT)
 */
function computeCarriers(
  psi: Float64Array,
  _Nd: Float64Array,
  _Na: Float64Array,
  T: number,
  region: Int32Array
): { n: Float64Array; p: Float64Array } {
  const N = psi.length;
  const n = new Float64Array(N);
  const p = new Float64Array(N);

  const ni = niSi(T);
  const Vt = K_B * T / Q; // Thermal voltage

  for (let i = 0; i < N; i++) {
    if (!isInSilicon(region[i] as RegionType)) {
      continue;
    }

    // Use potential to compute carriers
    // Clamp to prevent overflow
    const psiNorm = psi[i] / Vt;
    const clampedExp = Math.min(Math.max(psiNorm, -40), 40);

    n[i] = ni * Math.exp(clampedExp);
    p[i] = ni * Math.exp(-clampedExp);

    // Limit carriers to physical range
    n[i] = Math.max(1e4, Math.min(1e22, n[i]));
    p[i] = Math.max(1e4, Math.min(1e22, p[i]));
  }

  return { n, p };
}

/**
 * Build Poisson equation Jacobian matrix
 *
 * For interior point (i,j):
 * -ε_{i+1/2}(ψ_{i+1}-ψ_i)/Δx_{i+1/2} + ε_{i-1/2}(ψ_i-ψ_{i-1})/Δx_{i-1/2}
 * + similar for z direction = ρ/ε₀
 */
function buildPoissonMatrix(
  mesh: Mesh2D,
  psi: Float64Array,
  Nd: Float64Array,
  Na: Float64Array,
  T: number,
  _isNMOS: boolean
): { A: CSRMatrix; b: Float64Array } {
  const { x, z, nx, nz, region } = mesh;
  const N = nx * nz;

  const builder = new CSRBuilder(N);
  const b = new Float64Array(N);

  const ni = niSi(T);
  const Vt = K_B * T / Q;
  const eps_si = EPS0 * Si.eps_r * 1e-7; // F/nm (converted from F/cm)

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const reg = region[idx] as RegionType;

      // Oxide/Gate: Dirichlet boundary (set later) or Laplace
      if (reg === RegionType.OXIDE || reg === RegionType.GATE) {
        builder.set(idx, idx, 1);
        b[idx] = psi[idx]; // Keep current value
        continue;
      }

      // Silicon region: solve Poisson equation
      const xc = x[i];
      const zc = z[j];

      // Grid spacings
      const dx_left = i > 0 ? xc - x[i - 1] : 1;
      const dx_right = i < nx - 1 ? x[i + 1] - xc : 1;
      const dz_up = j > 0 ? zc - z[j - 1] : 1;
      const dz_down = j < nz - 1 ? z[j + 1] - zc : 1;

      // Average spacing for center point
      const dx_avg = (dx_left + dx_right) / 2;
      const dz_avg = (dz_up + dz_down) / 2;

      // Coefficients (using averaged permittivity at interfaces)
      const coef_center =
        eps_si / (dx_left * dx_avg) +
        eps_si / (dx_right * dx_avg) +
        eps_si / (dz_up * dz_avg) +
        eps_si / (dz_down * dz_avg);

      // Neighbor coefficients
      const coef_left = i > 0 ? -eps_si / (dx_left * dx_avg) : 0;
      const coef_right = i < nx - 1 ? -eps_si / (dx_right * dx_avg) : 0;
      const coef_up = j > 0 ? -eps_si / (dz_up * dz_avg) : 0;
      const coef_down = j < nz - 1 ? -eps_si / (dz_down * dz_avg) : 0;

      // Charge density contribution
      const Nnet = Nd[idx] - Na[idx];
      const psiVal = psi[idx];
      const psiNorm = Math.min(Math.max(psiVal / Vt, -40), 40);

      const n_carrier = ni * Math.exp(psiNorm);
      const p_carrier = ni * Math.exp(-psiNorm);

      // Charge density: ρ = q(p - n + Nd - Na)
      const rho = Q * (p_carrier - n_carrier + Nnet);

      // Jacobian of charge w.r.t. potential
      // dρ/dψ = q * (-dn/dψ - dp/dψ) = q * (-n/Vt - p/Vt) = -q(n+p)/Vt
      const dRho_dPsi = -Q * (n_carrier + p_carrier) / Vt;

      // Add Newton linearization term to diagonal
      const jacobian_charge = -dRho_dPsi; // Negative because we move to LHS

      builder.set(idx, idx, coef_center + jacobian_charge);

      if (i > 0) builder.set(idx, meshIndex(i - 1, j, nx), coef_left);
      if (i < nx - 1) builder.set(idx, meshIndex(i + 1, j, nx), coef_right);
      if (j > 0) builder.set(idx, meshIndex(i, j - 1, nx), coef_up);
      if (j < nz - 1) builder.set(idx, meshIndex(i, j + 1, nx), coef_down);

      // RHS: charge density + Newton correction term
      // F(ψ) = Laplacian(ψ) - ρ/ε = 0
      // Newton: J * Δψ = -F
      // RHS = ρ - jacobian_charge * ψ_old
      b[idx] = rho - jacobian_charge * psiVal;
    }
  }

  return { A: builder.build(), b };
}

/**
 * Apply boundary conditions
 */
function applyBoundaryConditions(
  psi: Float64Array,
  mesh: Mesh2D,
  params: DeviceParams,
  bias: { Vgs: number; Vds: number; Vbs: number },
  isNMOS: boolean,
  T: number
): void {
  const { x, z, nx, nz, region } = mesh;
  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;

  const gateEdge = L / 2;
  const sdEdge = gateEdge + lddLen + sdLen;

  const ni = niSi(T);
  const Nsub = params.substrate.doping;
  const Nsd = params.sourceDrain.doping;
  const Vt = K_B * T / Q;

  // Work function difference for gate
  const phiM = params.gate.workFunction;
  const phiS = 4.05 + Si.Eg_0 / 2 + Vt * Math.log(Nsub / ni);
  const Vfb = phiM - phiS;

  // Fermi potential for substrate
  const phiF = Vt * Math.log(Nsub / ni) * (isNMOS ? 1 : -1);

  // Built-in potential for S/D
  const Vbi = Vt * Math.log(Nsd * Nsub / (ni * ni));

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = meshIndex(i, j, nx);
      const reg = region[idx] as RegionType;
      const xVal = x[i];
      const zVal = z[j];

      // Gate contact (top boundary in oxide under gate)
      if (reg === RegionType.GATE && j === 0) {
        psi[idx] = bias.Vgs + Vfb;
        continue;
      }

      // Source contact (left boundary)
      if ((reg === RegionType.SOURCE || reg === RegionType.LDD_SOURCE) && xVal <= -sdEdge + 5) {
        psi[idx] = Vbi + (isNMOS ? 0 : bias.Vbs);
        continue;
      }

      // Drain contact (right boundary)
      if ((reg === RegionType.DRAIN || reg === RegionType.LDD_DRAIN) && xVal >= sdEdge - 5) {
        psi[idx] = Vbi + bias.Vds;
        continue;
      }

      // Substrate contact (bottom boundary)
      if (j === nz - 1 && isInSilicon(reg)) {
        psi[idx] = phiF + bias.Vbs;
        continue;
      }

      // Initialize silicon region with equilibrium potential
      if (isInSilicon(reg) && Math.abs(psi[idx]) < 1e-10) {
        // Initial guess based on doping
        const { Nd, Na } = getDoping(reg, params, isNMOS, zVal);
        const Nnet = Nd - Na;
        if (Math.abs(Nnet) > ni) {
          psi[idx] = (Nnet > 0 ? 1 : -1) * Vt * Math.log(Math.abs(Nnet) / ni);
        }
      }
    }
  }
}

/**
 * Solve Poisson equation using Newton iteration
 */
export function solvePoisson(
  mesh: Mesh2D,
  params: DeviceParams,
  deviceType: DeviceType,
  bias: { Vgs: number; Vds: number; Vbs: number },
  T: number,
  initialPsi: Float64Array | null = null,
  options: Partial<PoissonOptions> = {}
): PoissonResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isNMOS = deviceType === 'nmos';
  const { nx, nz, z, region } = mesh;
  const N = nx * nz;

  // Initialize potential
  const psi = new Float64Array(N);
  if (initialPsi) {
    psi.set(initialPsi);
  }

  // Pre-compute doping at each point
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

  // Apply boundary conditions
  applyBoundaryConditions(psi, mesh, params, bias, isNMOS, T);

  let converged = false;
  let maxResidual = Infinity;
  let iter = 0;

  // Newton iteration
  for (iter = 0; iter < opts.maxIter; iter++) {
    // Build Jacobian and RHS
    const { A, b } = buildPoissonMatrix(mesh, psi, Nd, Na, T, isNMOS);

    // Solve linear system for update
    const result = biCGSTAB(A, b, psi, { maxIter: 500, tolerance: 1e-10 });

    if (!result.converged) {
      console.warn(`Poisson: linear solver did not converge at Newton iter ${iter}`);
    }

    // Apply update with damping
    maxResidual = 0;
    for (let i = 0; i < N; i++) {
      if (!isInSilicon(region[i] as RegionType)) continue;

      const dpsi = result.x[i] - psi[i];
      maxResidual = Math.max(maxResidual, Math.abs(dpsi));
      psi[i] += opts.dampingFactor * dpsi;
    }

    // Re-apply boundary conditions
    applyBoundaryConditions(psi, mesh, params, bias, isNMOS, T);

    if (maxResidual < opts.tolerance) {
      converged = true;
      break;
    }
  }

  // Compute final carrier concentrations
  const { n, p } = computeCarriers(psi, Nd, Na, T, region);

  return {
    psi,
    n,
    p,
    converged,
    iterations: iter + 1,
    maxResidual,
  };
}
