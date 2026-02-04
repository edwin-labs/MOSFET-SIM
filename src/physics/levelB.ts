/**
 * Level B Physics Engine - Semi-Empirical MOSFET Model
 *
 * Extends Level A with:
 * - Velocity Saturation
 * - DIBL (Drain-Induced Barrier Lowering)
 * - Channel Length Modulation (CLM)
 * - Body Effect
 * - Mobility Degradation (vertical field)
 * - Subthreshold Swing (non-ideal)
 * - Short Channel Vth Roll-off
 * - Narrow Width Effect
 */

import { Q, EPS0, thermalVoltage, NM_TO_CM } from './constants';
import {
  Si,
  niSi,
  bandgapSi,
  mobilityElectron,
  mobilityHole,
  vsatElectron,
  vsatHole,
  OXIDES,
  GATE_WORK_FUNCTIONS,
} from './materials';
import type { DeviceType, DeviceParams, BiasConditions } from '../types/device';
import type {
  IVResult,
  CVResult,
  BandDiagramResult,
  DeviceMetrics,
  SweepCurve,
} from '../types/simulation';

export class LevelBEngine {
  /**
   * Fermi potential: φ_F = (kT/q) * ln(N_A / n_i)
   */
  phiF(doping: number, T: number, isPType: boolean): number {
    const ni = niSi(T);
    const Vt = thermalVoltage(T);
    if (isPType) {
      return Vt * Math.log(doping / ni);
    } else {
      return -Vt * Math.log(doping / ni);
    }
  }

  /**
   * Oxide capacitance per unit area: C_ox = ε_ox / t_ox
   */
  oxideCap(epsr_ox: number, tox_nm: number): number {
    const tox_cm = tox_nm * NM_TO_CM;
    // EPS0 is F/m, multiply by 0.01 to convert to F/cm
    return (EPS0 * epsr_ox * 1e-2) / tox_cm; // F/cm^2
  }

  /**
   * Flat-band voltage
   */
  Vfb(
    gateMaterial: string,
    doping: number,
    T: number,
    isPType: boolean,
    Cox: number,
    Qf: number
  ): number {
    const phi_m = GATE_WORK_FUNCTIONS[gateMaterial as keyof typeof GATE_WORK_FUNCTIONS] || 4.15;
    const Eg = bandgapSi(T);
    const phiF = this.phiF(doping, T, isPType);
    const phi_s = isPType
      ? Si.chi + Eg / 2 + phiF
      : Si.chi + Eg / 2 + phiF;
    const phi_ms = phi_m - phi_s;
    return phi_ms - (Qf * Q) / Cox;
  }

  /**
   * Body effect coefficient: γ = sqrt(2*q*ε_Si*N_A) / C_ox
   */
  bodyCoefficient(doping: number, Cox: number): number {
    const eps_si = EPS0 * Si.eps_r * 1e-2; // F/cm (EPS0 is F/m)
    return Math.sqrt(2 * Q * eps_si * doping) / Cox;
  }

  /**
   * Short channel Vth roll-off using charge sharing model
   * ΔVth ≈ -(1/L) * (xj * xd / tox) * factor
   */
  shortChannelVthShift(
    L_nm: number,
    xj_nm: number,
    tox_nm: number,
    Vds: number,
    doping: number,
    T: number
  ): number {
    const L = L_nm * NM_TO_CM;
    const xj = xj_nm * NM_TO_CM;
    const tox = tox_nm * NM_TO_CM;

    // Depletion width at drain
    const eps_si = EPS0 * Si.eps_r;
    const phiF = Math.abs(this.phiF(doping, T, true));
    const Vbi = 0.7; // Built-in potential approximation
    const xd = Math.sqrt((2 * eps_si * (Vbi + Math.abs(Vds))) / (Q * doping * 1e6));

    // Charge sharing factor
    const factor = 0.5 * (xj + xd) / L;
    const deltaVth = -factor * (2 * phiF) * Math.min(1, 2 * tox / xj);

    return Math.max(deltaVth, -0.3); // Limit roll-off
  }

  /**
   * DIBL coefficient: η (mV/V)
   * ΔVth = -η * Vds
   */
  diblCoefficient(L_nm: number, tox_nm: number, xj_nm: number): number {
    // Empirical DIBL model
    const L = L_nm;
    const tox = tox_nm;
    const xj = xj_nm;

    // Characteristic length
    const lambda = Math.sqrt(tox * xj);

    // DIBL increases as L decreases relative to lambda
    const eta = 0.08 * Math.exp(-L / (3 * lambda));

    return Math.min(eta, 0.2); // Limit to 200 mV/V max
  }

  /**
   * Channel length modulation parameter λ
   */
  clmParameter(L_nm: number, _doping: number): number {
    const L = L_nm * NM_TO_CM;
    // Empirical: λ ∝ 1/L
    const lambda = 0.01e-4 / L; // 1/V, scaled
    return Math.min(lambda, 0.5); // Limit
  }

  /**
   * Threshold voltage with all effects
   */
  Vth(
    params: DeviceParams,
    T: number,
    deviceType: DeviceType,
    Vbs: number = 0,
    Vds: number = 0
  ): number {
    const isNMOS = deviceType === 'nmos';
    const substrateDoping = params.substrate.doping;
    const isPType = params.substrate.type === 'p-type';

    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);

    const phiF = this.phiF(substrateDoping, T, isPType);
    const Vfb = this.Vfb(
      params.gate.gateMaterial,
      substrateDoping,
      T,
      isPType,
      Cox,
      params.advanced.fixedCharge
    );

    const gamma = this.bodyCoefficient(substrateDoping, Cox);
    const Vsb = isNMOS ? -Vbs : Vbs;
    const phiS = Math.abs(2 * phiF);

    // Long channel Vth
    let Vth0: number;
    if (isNMOS) {
      Vth0 = Vfb + 2 * phiF + gamma * Math.sqrt(phiS + Math.max(0, Vsb));
    } else {
      Vth0 = Vfb + 2 * phiF - gamma * Math.sqrt(phiS + Math.max(0, -Vsb));
    }

    // Short channel effect (Vth roll-off)
    const deltaVth_sc = this.shortChannelVthShift(
      params.gate.length,
      params.sourceDrain.junctionDepth,
      params.gate.tox,
      Vds,
      substrateDoping,
      T
    );

    // DIBL
    const eta = this.diblCoefficient(
      params.gate.length,
      params.gate.tox,
      params.sourceDrain.junctionDepth
    );
    const deltaVth_dibl = isNMOS ? -eta * Math.abs(Vds) : eta * Math.abs(Vds);

    return Vth0 + deltaVth_sc + deltaVth_dibl;
  }

  /**
   * Effective mobility with vertical field degradation
   * μ_eff = μ_0 / (1 + θ*(Vgs - Vth))
   */
  effectiveMobility(
    mu0: number,
    Vgs: number,
    Vth: number,
    theta: number = 0.1
  ): number {
    const Vov = Math.max(Vgs - Vth, 0);
    return mu0 / (1 + theta * Vov);
  }

  /**
   * Velocity saturation effect
   * μ_eff = μ / (1 + μ*E / vsat)
   */
  velocitySaturatedMobility(
    mu: number,
    Vds: number,
    L_nm: number,
    vsat: number
  ): number {
    const L = L_nm * NM_TO_CM;
    const E = Math.abs(Vds) / L; // V/cm
    return mu / (1 + (mu * E) / vsat);
  }

  /**
   * Saturation voltage with velocity saturation
   * Vdsat = (Vgs - Vth) * Esat*L / (Esat*L + Vgs - Vth)
   */
  saturationVoltage(
    Vgs: number,
    Vth: number,
    L_nm: number,
    mu: number,
    vsat: number
  ): number {
    const Vov = Math.max(Vgs - Vth, 0.001);
    const L = L_nm * NM_TO_CM;
    const Esat = 2 * vsat / mu; // Saturation field

    const Vdsat = (Vov * Esat * L) / (Esat * L + Vov);
    return Math.max(Vdsat, 0.01);
  }

  /**
   * Depletion width
   */
  depletionWidth(doping: number, T: number, Vbs: number = 0): number {
    const phiF = Math.abs(this.phiF(doping, T, true));
    const eps_si = EPS0 * Si.eps_r;
    const surfacePotential = 2 * phiF + Math.abs(Vbs);
    const W_dep_m = Math.sqrt((2 * eps_si * surfacePotential) / (Q * doping * 1e6));
    return W_dep_m * 1e9;
  }

  /**
   * Subthreshold swing (non-ideal)
   * SS = (kT/q) * ln(10) * (1 + Cdep/Cox) * n
   */
  subthresholdSwing(
    params: DeviceParams,
    T: number
  ): number {
    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);

    const eps_si = EPS0 * Si.eps_r * 1e-2; // F/cm (EPS0 is F/m)
    const phiF = Math.abs(this.phiF(params.substrate.doping, T, true));
    const Wdep = Math.sqrt((2 * eps_si * 2 * phiF) / (Q * params.substrate.doping));
    const Cdep = eps_si / Wdep;

    const n = 1 + Cdep / Cox;
    const Vt = thermalVoltage(T);

    // Interface trap contribution
    const Dit = params.advanced.interfaceTrapDensity;
    const Cit = Q * Dit; // Approximate
    const n_eff = n + Cit / Cox;

    return n_eff * Vt * Math.log(10) * 1000; // mV/dec
  }

  /**
   * Drain current with all Level B effects
   * Uses unified model with smooth transitions to avoid discontinuities
   */
  drainCurrent(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): number {
    const isNMOS = deviceType === 'nmos';
    const { vgs, vds, vbs } = bias;

    const Vgs_eff = isNMOS ? vgs : -vgs;
    const Vds_eff = isNMOS ? vds : -vds;
    const absVds = Math.abs(Vds_eff);

    // Threshold voltage with all effects
    const Vth = this.Vth(params, T, deviceType, vbs, vds);
    const Vt = thermalVoltage(T);

    // Device parameters
    const W_nm = params.geometry.width;
    const L_nm = params.gate.length;
    const W = W_nm * NM_TO_CM;
    const L = L_nm * NM_TO_CM;

    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);

    // Low-field mobility
    const mu0 = isNMOS
      ? mobilityElectron(params.channel.doping, T)
      : mobilityHole(params.channel.doping, T);

    // Saturation velocity
    const vsat = isNMOS ? vsatElectron(T) : vsatHole(T);

    const Vov = Vgs_eff - Vth;

    // Subthreshold region parameters
    const SS = this.subthresholdSwing(params, T);
    const n = SS / (Vt * Math.log(10) * 1000);

    // Subthreshold current component
    // Clamp Vov for subthreshold calculation to prevent exponential blowup
    // The subthreshold model is only valid for Vov < few * n * Vt
    const Vov_sub = Math.min(Vov, 3 * n * Vt);
    const I0 = (W / L) * mu0 * Cox * (n - 1) * Vt * Vt;
    const Isub = I0 * Math.exp(Vov_sub / (n * Vt)) * (1 - Math.exp(-absVds / Vt));

    // Smooth overdrive for unified model (ensures positive value)
    const Vov_smooth = n * Vt * Math.log(1 + Math.exp(Vov / (n * Vt)));

    // Apply mobility degradation
    const theta = 0.1; // Mobility degradation factor
    const mu_eff = mu0 / (1 + theta * Vov_smooth);

    // Saturation voltage with velocity saturation
    const Esat = 2 * vsat / mu_eff;
    const Vdsat = (Vov_smooth * Esat * L) / (Esat * L + Vov_smooth + 1e-9);

    // CLM parameter
    const lambda = this.clmParameter(L_nm, params.substrate.doping);

    // Unified current model
    const k = (W / L) * mu_eff * Cox;

    // Effective Vds for current calculation (clamped to avoid negative Id_lin)
    const Vds_lin = Math.min(absVds, Vdsat);

    // Linear region current
    const Id_lin = k * (Vov_smooth * Vds_lin - Vds_lin * Vds_lin / 2);

    // Saturation current with CLM
    const Id_sat_base = k * (Vov_smooth * Vdsat - Vdsat * Vdsat / 2);
    const Id_sat = Id_sat_base * (1 + lambda * Math.max(0, absVds - Vdsat));

    // Smooth transition between linear and saturation using tanh
    const transitionWidth = Math.max(0.05 * Vdsat, 0.01);
    const satFactor = 0.5 * (1 + Math.tanh((absVds - Vdsat) / transitionWidth));

    // Strong inversion current
    const Id_strong = (1 - satFactor) * Id_lin + satFactor * Id_sat;

    // Blend strong inversion with subthreshold current
    // blendFactor → 0 for Vov << 0 (subthreshold), → 1 for Vov >> 0 (strong inversion)
    const blendFactor = 1 / (1 + Math.exp(-Vov / (2 * Vt)));
    let Id = blendFactor * Id_strong + (1 - blendFactor) * Isub;

    // Ensure minimum off-state leakage (realistic floor)
    Id = Math.max(Id, 1e-18);

    // Series resistance effect
    const Rs = params.advanced.seriesResistanceS;
    const Rd = params.advanced.seriesResistanceD;
    if ((Rs > 0 || Rd > 0) && Id > 0 && absVds > 0) {
      const Rtotal = Rs + Rd;
      const Vds_int = Math.max(absVds - Id * Rtotal, 0.01 * absVds);
      Id = Id * Vds_int / absVds;
    }

    return isNMOS ? Id : -Id;
  }

  /**
   * Transconductance gm = dId/dVgs
   */
  transconductance(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): number {
    const dV = 0.001; // 1mV
    const Id1 = this.drainCurrent(deviceType, params, { ...bias, vgs: bias.vgs - dV }, T);
    const Id2 = this.drainCurrent(deviceType, params, { ...bias, vgs: bias.vgs + dV }, T);
    return (Id2 - Id1) / (2 * dV);
  }

  /**
   * Output conductance gds = dId/dVds
   */
  outputConductance(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): number {
    const dV = 0.001;
    const Id1 = this.drainCurrent(deviceType, params, { ...bias, vds: bias.vds - dV }, T);
    const Id2 = this.drainCurrent(deviceType, params, { ...bias, vds: bias.vds + dV }, T);
    return (Id2 - Id1) / (2 * dV);
  }

  /**
   * MOS capacitance (same as Level A for now)
   */
  mosCapacitance(
    deviceType: DeviceType,
    params: DeviceParams,
    Vg: number,
    T: number
  ): number {
    const isNMOS = deviceType === 'nmos';
    const Vg_eff = isNMOS ? Vg : -Vg;

    const substrateDoping = params.substrate.doping;
    const isPType = params.substrate.type === 'p-type';
    const phiF = this.phiF(substrateDoping, T, isPType);

    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);
    const Vfb = this.Vfb(
      params.gate.gateMaterial,
      substrateDoping,
      T,
      isPType,
      Cox,
      params.advanced.fixedCharge
    );

    const eps_si = EPS0 * Si.eps_r * 1e-2; // F/cm (EPS0 is F/m)
    const Vgb = Vg_eff - Vfb;

    if ((isNMOS && Vgb < 0) || (!isNMOS && Vgb > 0)) {
      return Cox;
    }

    const phiS_inv = 2 * Math.abs(phiF);
    const Wdep_max = Math.sqrt((2 * eps_si * phiS_inv) / (Q * substrateDoping));
    const Cdep_min = eps_si / Wdep_max;
    const Cmin = (Cox * Cdep_min) / (Cox + Cdep_min);

    const Vth = this.Vth(params, T, deviceType, 0, 0);
    const Vth_eff = isNMOS ? Vth : -Vth;

    if ((isNMOS && Vg_eff > Vth_eff) || (!isNMOS && Vg_eff < Vth_eff)) {
      return Cmin;
    }

    const t = Math.abs((Vg_eff - Vfb) / (Vth_eff - Vfb));
    return Cox * (1 - t) + Cmin * t;
  }

  /**
   * Band diagram (same structure as Level A)
   */
  bandDiagram(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): BandDiagramResult {
    const isNMOS = deviceType === 'nmos';
    const Vgs = isNMOS ? bias.vgs : -bias.vgs;

    const substrateDoping = params.substrate.doping;
    const isPType = params.substrate.type === 'p-type';
    const phiF = this.phiF(substrateDoping, T, isPType);
    const Eg = bandgapSi(T);

    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);
    const Vfb = this.Vfb(
      params.gate.gateMaterial,
      substrateDoping,
      T,
      isPType,
      Cox,
      params.advanced.fixedCharge
    );

    const phi_m = GATE_WORK_FUNCTIONS[params.gate.gateMaterial as keyof typeof GATE_WORK_FUNCTIONS] || 4.15;
    const Vgb = Vgs - Vfb;
    let phiS = 0;

    if (isNMOS) {
      if (Vgb > 0) {
        phiS = Math.min(Vgb * 0.8, 2 * Math.abs(phiF) + 0.3);
      } else {
        phiS = Vgb * 0.5;
      }
    } else {
      if (Vgb < 0) {
        phiS = Math.max(Vgb * 0.8, -(2 * Math.abs(phiF) + 0.3));
      } else {
        phiS = Vgb * 0.5;
      }
    }

    const tox = params.gate.tox;
    const depthSi = 200;
    const nPointsOx = 10;
    const nPointsSi = 50;

    const depth: number[] = [];
    const Ec: number[] = [];
    const Ev: number[] = [];
    const Ei: number[] = [];

    const Ef = 0;
    const Ef_bulk = isPType ? -Math.abs(phiF) : Math.abs(phiF);

    const oxideBarrier = oxideProps.barrier_n;
    for (let i = 0; i < nPointsOx; i++) {
      const x = (i / (nPointsOx - 1)) * tox;
      depth.push(x);
      const Vox = (phi_m - Si.chi - Eg / 2 - Ef_bulk + phiS) * (1 - x / tox);
      Ec.push(Si.chi + oxideBarrier - Vox);
      Ev.push(Si.chi + oxideBarrier - oxideProps.Eg - Vox);
      Ei.push(Si.chi + oxideBarrier - oxideProps.Eg / 2 - Vox);
    }

    const Ld = Math.sqrt((EPS0 * Si.eps_r * thermalVoltage(T)) / (Q * substrateDoping * 1e6));

    for (let i = 0; i < nPointsSi; i++) {
      const x = tox + (i / (nPointsSi - 1)) * depthSi;
      depth.push(x);

      const xSi = x - tox;
      const Wdep = this.depletionWidth(substrateDoping, T, bias.vbs);
      const phi = phiS * Math.exp(-xSi / Math.max(Wdep, Ld * 1e9));

      const Ec_bulk = Si.chi + Eg / 2 + Ef_bulk;
      const Ev_bulk = Si.chi - Eg / 2 + Ef_bulk;
      const Ei_bulk = Si.chi + Ef_bulk;

      Ec.push(Ec_bulk - phi);
      Ev.push(Ev_bulk - phi);
      Ei.push(Ei_bulk - phi);
    }

    return {
      vertical: { depth, Ec, Ev, Ef, Ei },
    };
  }

  /**
   * I-V sweep: output characteristics
   */
  sweepIdVds(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    options: {
      vdsMin?: number;
      vdsMax?: number;
      vdsStep?: number;
      vgsValues?: number[];
      vbs?: number;
    } = {}
  ): SweepCurve[] {
    const isNMOS = deviceType === 'nmos';
    const {
      vdsMin = 0,
      vdsMax = isNMOS ? 1.8 : -1.8,
      vdsStep = Math.abs(vdsMax - vdsMin) / 50,
      vgsValues = isNMOS ? [0.4, 0.6, 0.8, 1.0, 1.2] : [-0.4, -0.6, -0.8, -1.0, -1.2],
      vbs = 0,
    } = options;

    const curves: SweepCurve[] = [];

    for (const vgs of vgsValues) {
      const x: number[] = [];
      const y: number[] = [];

      const nPoints = Math.ceil(Math.abs(vdsMax - vdsMin) / vdsStep) + 1;
      for (let i = 0; i < nPoints; i++) {
        const vds = vdsMin + (i / (nPoints - 1)) * (vdsMax - vdsMin);
        const Id = this.drainCurrent(deviceType, params, { vgs, vds, vbs }, T);
        x.push(vds);
        y.push(Id);
      }

      curves.push({ label: `Vgs=${vgs.toFixed(1)}V`, x, y });
    }

    return curves;
  }

  /**
   * I-V sweep: transfer characteristics
   */
  sweepIdVgs(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    options: {
      vgsMin?: number;
      vgsMax?: number;
      vgsStep?: number;
      vdsValues?: number[];
      vbs?: number;
    } = {}
  ): { linear: SweepCurve[]; log: SweepCurve[] } {
    const isNMOS = deviceType === 'nmos';
    const {
      vgsMin = isNMOS ? -0.2 : 0.2,
      vgsMax = isNMOS ? 1.8 : -1.8,
      vgsStep = Math.abs(vgsMax - vgsMin) / 100,
      vdsValues = isNMOS ? [0.05, 1.0] : [-0.05, -1.0],
      vbs = 0,
    } = options;

    const linearCurves: SweepCurve[] = [];
    const logCurves: SweepCurve[] = [];

    for (const vds of vdsValues) {
      const x: number[] = [];
      const yLin: number[] = [];
      const yLog: number[] = [];

      const nPoints = Math.ceil(Math.abs(vgsMax - vgsMin) / vgsStep) + 1;
      for (let i = 0; i < nPoints; i++) {
        const vgs = vgsMin + (i / (nPoints - 1)) * (vgsMax - vgsMin);
        const Id = this.drainCurrent(deviceType, params, { vgs, vds, vbs }, T);

        x.push(vgs);
        yLin.push(Math.abs(Id));
        yLog.push(Math.abs(Id) > 1e-18 ? Math.abs(Id) : 1e-18);
      }

      linearCurves.push({ label: `Vds=${vds.toFixed(2)}V`, x, y: yLin });
      logCurves.push({ label: `Vds=${vds.toFixed(2)}V`, x, y: yLog });
    }

    return { linear: linearCurves, log: logCurves };
  }

  /**
   * gm vs Vgs sweep
   */
  sweepGm(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    Vds: number
  ): SweepCurve {
    const isNMOS = deviceType === 'nmos';
    const vgsMin = isNMOS ? 0 : -1.8;
    const vgsMax = isNMOS ? 1.8 : 0;

    const x: number[] = [];
    const y: number[] = [];

    const nPoints = 100;
    for (let i = 0; i < nPoints; i++) {
      const vgs = vgsMin + (i / (nPoints - 1)) * (vgsMax - vgsMin);
      const gm = this.transconductance(deviceType, params, { vgs, vds: Vds, vbs: 0 }, T);
      x.push(vgs);
      y.push(Math.abs(gm));
    }

    return { label: `Vds=${Vds.toFixed(2)}V`, x, y };
  }

  /**
   * gds vs Vds sweep
   */
  sweepGds(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    Vgs: number
  ): SweepCurve {
    const isNMOS = deviceType === 'nmos';
    const vdsMin = isNMOS ? 0 : -1.8;
    const vdsMax = isNMOS ? 1.8 : 0;

    const x: number[] = [];
    const y: number[] = [];

    const nPoints = 100;
    for (let i = 0; i < nPoints; i++) {
      const vds = vdsMin + (i / (nPoints - 1)) * (vdsMax - vdsMin);
      const gds = this.outputConductance(deviceType, params, { vgs: Vgs, vds, vbs: 0 }, T);
      x.push(vds);
      y.push(Math.abs(gds));
    }

    return { label: `Vgs=${Vgs.toFixed(2)}V`, x, y };
  }

  /**
   * C-V sweep
   */
  sweepCV(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    options: {
      vgMin?: number;
      vgMax?: number;
      vgStep?: number;
    } = {}
  ): CVResult {
    const isNMOS = deviceType === 'nmos';
    const {
      vgMin = isNMOS ? -2.0 : 2.0,
      vgMax = isNMOS ? 2.0 : -2.0,
      vgStep = Math.abs(vgMax - vgMin) / 100,
    } = options;

    const vg: number[] = [];
    const c: number[] = [];

    const nPoints = Math.ceil(Math.abs(vgMax - vgMin) / vgStep) + 1;
    for (let i = 0; i < nPoints; i++) {
      const Vg = vgMin + (i / (nPoints - 1)) * (vgMax - vgMin);
      const C = this.mosCapacitance(deviceType, params, Vg, T);
      vg.push(Vg);
      c.push(C);
    }

    return { highFreq: { vg, c } };
  }

  /**
   * Extract device metrics
   */
  extractMetrics(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    iv: { linear: SweepCurve[]; log: SweepCurve[] }
  ): DeviceMetrics {
    const isNMOS = deviceType === 'nmos';

    const curve = iv.log[iv.log.length - 1];
    const x = curve.x;
    const y = curve.y;

    // Vth using constant current method
    const W = params.geometry.width;
    const L = params.gate.length;
    const Ith = 100e-9 * (W / L);

    let Vth = 0;
    for (let i = 0; i < y.length - 1; i++) {
      if ((y[i] < Ith && y[i + 1] >= Ith) || (y[i] > Ith && y[i + 1] <= Ith)) {
        const t = (Ith - y[i]) / (y[i + 1] - y[i]);
        Vth = x[i] + t * (x[i + 1] - x[i]);
        break;
      }
    }

    if (Vth === 0) {
      Vth = this.Vth(params, T, deviceType, 0, 0);
    }

    // Subthreshold swing
    let minSS = Infinity;
    for (let i = 1; i < y.length - 1; i++) {
      if (y[i] > 1e-15 && y[i - 1] > 1e-15) {
        const dVgs = x[i] - x[i - 1];
        const dLogId = Math.log10(y[i]) - Math.log10(y[i - 1]);
        if (Math.abs(dLogId) > 0.01) {
          const SS = Math.abs(dVgs / dLogId) * 1000;
          if (SS < minSS && SS > 50) {
            minSS = SS;
          }
        }
      }
    }
    const SS = minSS < Infinity ? minSS : this.subthresholdSwing(params, T);

    // Ion and Ioff
    const Vdd = isNMOS ? 1.0 : -1.0;
    const Ion = Math.abs(this.drainCurrent(deviceType, params, { vgs: Vdd, vds: Vdd, vbs: 0 }, T));
    const Ioff = Math.abs(this.drainCurrent(deviceType, params, { vgs: 0, vds: Vdd, vbs: 0 }, T));

    // DIBL
    const Vth_lowVds = this.Vth(params, T, deviceType, 0, isNMOS ? 0.05 : -0.05);
    const Vth_highVds = this.Vth(params, T, deviceType, 0, isNMOS ? 1.0 : -1.0);
    const DIBL = Math.abs((Vth_lowVds - Vth_highVds) / 0.95) * 1000; // mV/V

    // gm_max
    const gmCurve = this.sweepGm(deviceType, params, T, Vdd);
    const gmMax = Math.max(...gmCurve.y);

    // Vdsat
    const mu0 = isNMOS
      ? mobilityElectron(params.channel.doping, T)
      : mobilityHole(params.channel.doping, T);
    const vsat = isNMOS ? vsatElectron(T) : vsatHole(T);
    const Vdsat = this.saturationVoltage(Math.abs(Vdd), Math.abs(Vth), params.gate.length, mu0, vsat);

    return {
      Vth,
      SS,
      Ion,
      Ioff,
      IonIoffRatio: Ion / Math.max(Ioff, 1e-18),
      DIBL,
      gmMax,
      Vdsat,
    };
  }

  /**
   * Full calculation
   */
  fullCalculation(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): {
    iv: IVResult;
    cv: CVResult;
    band: BandDiagramResult;
    metrics: DeviceMetrics;
    depletionWidth: number;
    gm: SweepCurve;
    gds: SweepCurve;
  } {
    const output = this.sweepIdVds(deviceType, params, T);
    const { linear, log } = this.sweepIdVgs(deviceType, params, T);
    const iv: IVResult = { output, transfer: linear, transferLog: log };

    const cv = this.sweepCV(deviceType, params, T);
    const band = this.bandDiagram(deviceType, params, bias, T);
    const metrics = this.extractMetrics(deviceType, params, T, { linear, log });
    const depletionWidth = this.depletionWidth(params.substrate.doping, T, bias.vbs);

    const isNMOS = deviceType === 'nmos';
    const Vdd = isNMOS ? 1.0 : -1.0;
    const gm = this.sweepGm(deviceType, params, T, Vdd);
    const gds = this.sweepGds(deviceType, params, T, Vdd);

    return { iv, cv, band, metrics, depletionWidth, gm, gds };
  }
}
