/**
 * Level A Physics Engine - Analytical MOSFET Model
 *
 * Implements Shockley model with:
 * - Linear and saturation regions
 * - Subthreshold current
 * - MOS capacitance (high frequency)
 * - Energy band diagram
 */

import { Q, EPS0, thermalVoltage, NM_TO_CM } from './constants';
import {
  Si,
  niSi,
  bandgapSi,
  mobilityElectron,
  mobilityHole,
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

export class LevelAEngine {
  /**
   * Fermi potential: φ_F = (kT/q) * ln(N_A / n_i)
   * Positive for p-type, negative for n-type
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
   * @param epsr_ox Oxide relative permittivity
   * @param tox_nm Oxide thickness in nm
   * @returns C_ox in F/cm^2
   */
  oxideCap(epsr_ox: number, tox_nm: number): number {
    const tox_cm = tox_nm * NM_TO_CM;
    // EPS0 is F/m, multiply by 0.01 to convert to F/cm
    return (EPS0 * epsr_ox * 1e-2) / tox_cm; // F/cm^2
  }

  /**
   * Flat-band voltage: V_FB = φ_ms - Q_f/C_ox
   * φ_ms = φ_m - φ_s (gate work function - silicon work function)
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

    // Silicon work function: χ + Eg/2 ± φF
    // For p-type: φ_s = χ + Eg/2 + φ_F
    // For n-type: φ_s = χ + Eg/2 - |φ_F|
    const phi_s = isPType
      ? Si.chi + Eg / 2 + phiF
      : Si.chi + Eg / 2 + phiF; // phiF is negative for n-type

    const phi_ms = phi_m - phi_s;
    return phi_ms - (Qf * Q) / Cox;
  }

  /**
   * Body effect coefficient: γ = sqrt(2*q*ε_Si*N_A) / C_ox
   */
  bodyCoefficient(doping: number, Cox: number): number {
    const eps_si = EPS0 * Si.eps_r * 1e-2; // F/cm (EPS0 is F/m, convert to F/cm)
    return Math.sqrt(2 * Q * eps_si * doping) / Cox;
  }

  /**
   * Threshold voltage calculation
   * V_th = V_FB + 2φ_F + γ*sqrt(2φ_F + V_SB)
   */
  Vth(params: DeviceParams, T: number, deviceType: DeviceType, Vbs: number = 0): number {
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

    // For nMOS with p-substrate:
    // V_th = V_FB + 2φ_F + γ*sqrt(2φ_F - V_BS)
    // V_BS is typically negative (body tied to lowest potential)
    const Vsb = isNMOS ? -Vbs : Vbs; // Sign convention
    const phiS = Math.abs(2 * phiF);

    let Vth0: number;
    if (isNMOS) {
      Vth0 = Vfb + 2 * phiF + gamma * Math.sqrt(phiS + Math.max(0, Vsb));
    } else {
      // pMOS: threshold is negative
      Vth0 = Vfb + 2 * phiF - gamma * Math.sqrt(phiS + Math.max(0, -Vsb));
    }

    return Vth0;
  }

  /**
   * Depletion width under the gate
   * W_dep = sqrt(2*ε_Si*|2φ_F + V_SB| / (q*N_A))
   */
  depletionWidth(doping: number, T: number, Vbs: number = 0): number {
    const phiF = Math.abs(this.phiF(doping, T, true));
    const eps_si = EPS0 * Si.eps_r; // F/m
    const surfacePotential = 2 * phiF + Math.abs(Vbs);

    const W_dep_m = Math.sqrt((2 * eps_si * surfacePotential) / (Q * doping * 1e6));
    return W_dep_m * 1e9; // Convert to nm
  }

  /**
   * Drain current for given bias conditions (Shockley model with subthreshold)
   */
  drainCurrent(
    deviceType: DeviceType,
    params: DeviceParams,
    bias: BiasConditions,
    T: number
  ): number {
    const isNMOS = deviceType === 'nmos';
    const { vgs, vds, vbs } = bias;

    // Get effective voltages (sign handling for pMOS)
    const Vgs_eff = isNMOS ? vgs : -vgs;
    const Vds_eff = isNMOS ? vds : -vds;

    const Vth = this.Vth(params, T, deviceType, vbs);
    const Vt = thermalVoltage(T);

    // Device parameters
    const W_nm = params.geometry.width;
    const L_nm = params.gate.length;
    const W = W_nm * NM_TO_CM;
    const L = L_nm * NM_TO_CM;

    const oxideProps = OXIDES[params.gate.oxideMaterial];
    const Cox = this.oxideCap(oxideProps.eps_r, params.gate.tox);

    // Mobility (use channel doping)
    const mu = isNMOS
      ? mobilityElectron(params.channel.doping, T)
      : mobilityHole(params.channel.doping, T);

    const Vov = Vgs_eff - Vth; // Overdrive voltage

    // Subthreshold region (Vgs < Vth)
    const n = 1.5; // Subthreshold slope factor
    const I0 = (W / L) * mu * Cox * (n - 1) * Vt * Vt;

    if (Vov < 0) {
      // Subthreshold: I = I0 * exp(Vgs/(n*Vt)) * (1 - exp(-Vds/Vt))
      const Isub = I0 * Math.exp(Vov / (n * Vt)) * (1 - Math.exp(-Math.abs(Vds_eff) / Vt));
      return isNMOS ? Isub : -Isub;
    }

    // Above threshold
    const k = (W / L) * mu * Cox;
    const Vdsat = Vov; // Simple saturation voltage

    let Id: number;
    if (Math.abs(Vds_eff) < Vdsat) {
      // Linear region: Id = k * [(Vgs-Vth)*Vds - Vds^2/2]
      Id = k * (Vov * Math.abs(Vds_eff) - (Vds_eff * Vds_eff) / 2);
    } else {
      // Saturation region: Id = (k/2) * (Vgs-Vth)^2
      Id = (k / 2) * Vov * Vov;
    }

    // Add smooth transition near Vth using interpolation
    const smoothFactor = 1 / (1 + Math.exp(-Vov / (2 * Vt)));
    const Isub_th = I0 * (1 - Math.exp(-Math.abs(Vds_eff) / Vt));
    Id = smoothFactor * Id + (1 - smoothFactor) * Isub_th;

    return isNMOS ? Id : -Id;
  }

  /**
   * MOS capacitance (high frequency C-V)
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

    const eps_si = EPS0 * Si.eps_r * 1e-2; // F/cm (EPS0 is F/m, convert to F/cm)

    // Surface potential (simplified)
    const Vgb = Vg_eff - Vfb;

    // Accumulation (Vgb < 0 for nMOS on p-sub)
    if ((isNMOS && Vgb < 0) || (!isNMOS && Vgb > 0)) {
      return Cox;
    }

    // Depletion and inversion
    const phiS_inv = 2 * Math.abs(phiF); // Surface potential at inversion

    // Depletion capacitance
    const Wdep_max = Math.sqrt((2 * eps_si * phiS_inv) / (Q * substrateDoping));
    const Cdep_min = eps_si / Wdep_max;

    // High-frequency capacitance in inversion = series of Cox and Cdep_min
    const Cmin = (Cox * Cdep_min) / (Cox + Cdep_min);

    // Transition from depletion to inversion
    const Vth = this.Vth(params, T, deviceType, 0);
    const Vth_eff = isNMOS ? Vth : -Vth;

    if ((isNMOS && Vg_eff > Vth_eff) || (!isNMOS && Vg_eff < Vth_eff)) {
      // Strong inversion (HF) - capacitance stays at Cmin
      return Cmin;
    }

    // Depletion region - capacitance varies
    // Simplified: linear interpolation between Cox and Cmin
    const t = Math.abs((Vg_eff - Vfb) / (Vth_eff - Vfb));
    return Cox * (1 - t) + Cmin * t;
  }

  /**
   * Energy band diagram (vertical, from gate to substrate)
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
    void niSi(T); // ni used for reference

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

    // Gate work function
    const phi_m = GATE_WORK_FUNCTIONS[params.gate.gateMaterial as keyof typeof GATE_WORK_FUNCTIONS] || 4.15;

    // Surface potential from gate voltage
    const Vgb = Vgs - Vfb;
    let phiS = 0; // Surface potential

    // Simplified surface potential calculation
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

    // Build depth array (oxide + silicon)
    const tox = params.gate.tox;
    const depthSi = 200; // nm into silicon
    const nPointsOx = 10;
    const nPointsSi = 50;

    const depth: number[] = [];
    const Ec: number[] = [];
    const Ev: number[] = [];
    const Ei: number[] = [];

    // Reference: Si bulk Fermi level at 0
    const Ef = 0;
    const Ef_bulk = isPType ? -Math.abs(phiF) : Math.abs(phiF); // Ef position from Ei

    // Oxide region
    const oxideBarrier = oxideProps.barrier_n;
    for (let i = 0; i < nPointsOx; i++) {
      const x = (i / (nPointsOx - 1)) * tox;
      depth.push(x);

      // Linear potential drop in oxide
      const Vox = (phi_m - Si.chi - Eg / 2 - Ef_bulk + phiS) * (1 - x / tox);

      Ec.push(Si.chi + oxideBarrier - Vox);
      Ev.push(Si.chi + oxideBarrier - oxideProps.Eg - Vox);
      Ei.push(Si.chi + oxideBarrier - oxideProps.Eg / 2 - Vox);
    }

    // Silicon region
    const eps_si = EPS0 * Si.eps_r;
    const Ld = Math.sqrt((eps_si * thermalVoltage(T)) / (Q * substrateDoping * 1e6)); // Debye length

    for (let i = 0; i < nPointsSi; i++) {
      const x = tox + (i / (nPointsSi - 1)) * depthSi;
      depth.push(x);

      // Potential decay from surface (simplified exponential)
      const xSi = x - tox;
      const Wdep = this.depletionWidth(substrateDoping, T, bias.vbs);
      const phi = phiS * Math.exp(-xSi / Math.max(Wdep, Ld * 1e9));

      // Band positions
      const Ec_bulk = Si.chi + Eg / 2 + Ef_bulk;
      const Ev_bulk = Si.chi - Eg / 2 + Ef_bulk;
      const Ei_bulk = Si.chi + Ef_bulk;

      Ec.push(Ec_bulk - phi);
      Ev.push(Ev_bulk - phi);
      Ei.push(Ei_bulk - phi);
    }

    return {
      vertical: {
        depth,
        Ec,
        Ev,
        Ef,
        Ei,
      },
    };
  }

  /**
   * I-V sweep: output characteristics (Id vs Vds for multiple Vgs)
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

      curves.push({
        label: `Vgs=${vgs.toFixed(1)}V`,
        x,
        y,
      });
    }

    return curves;
  }

  /**
   * I-V sweep: transfer characteristics (Id vs Vgs)
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

      linearCurves.push({
        label: `Vds=${vds.toFixed(2)}V`,
        x,
        y: yLin,
      });

      logCurves.push({
        label: `Vds=${vds.toFixed(2)}V`,
        x,
        y: yLog,
      });
    }

    return { linear: linearCurves, log: logCurves };
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
   * Extract device metrics from I-V data
   */
  extractMetrics(
    deviceType: DeviceType,
    params: DeviceParams,
    T: number,
    iv: { linear: SweepCurve[]; log: SweepCurve[] }
  ): DeviceMetrics {
    const isNMOS = deviceType === 'nmos';
    void thermalVoltage(T); // Vt for future use

    // Use the higher Vds curve for metrics
    const curve = iv.log[iv.log.length - 1];
    const x = curve.x;
    const y = curve.y;

    // Find Vth using constant current method (100nA * W/L)
    const W = params.geometry.width;
    const L = params.gate.length;
    const Ith = 100e-9 * (W / L); // Target current for Vth extraction

    let Vth = 0;
    for (let i = 0; i < y.length - 1; i++) {
      if ((y[i] < Ith && y[i + 1] >= Ith) || (y[i] > Ith && y[i + 1] <= Ith)) {
        // Linear interpolation
        const t = (Ith - y[i]) / (y[i + 1] - y[i]);
        Vth = x[i] + t * (x[i + 1] - x[i]);
        break;
      }
    }

    // If not found, use analytical Vth
    if (Vth === 0) {
      Vth = this.Vth(params, T, deviceType, 0);
    }

    // Subthreshold swing: SS = dVgs / d(log10(Id))
    let minSS = Infinity;
    for (let i = 1; i < y.length - 1; i++) {
      if (y[i] > 1e-15 && y[i - 1] > 1e-15) {
        const dVgs = x[i] - x[i - 1];
        const dLogId = Math.log10(y[i]) - Math.log10(y[i - 1]);
        if (Math.abs(dLogId) > 0.01) {
          const SS = Math.abs(dVgs / dLogId) * 1000; // mV/dec
          if (SS < minSS && SS > 50) {
            minSS = SS;
          }
        }
      }
    }
    const SS = minSS < Infinity ? minSS : 60 * (T / 300) * 1.5; // Fallback

    // Ion: current at Vgs=Vds=Vdd
    const Vdd = isNMOS ? 1.0 : -1.0;
    const Ion = Math.abs(this.drainCurrent(deviceType, params, { vgs: Vdd, vds: Vdd, vbs: 0 }, T));

    // Ioff: current at Vgs=0, Vds=Vdd
    const Ioff = Math.abs(this.drainCurrent(deviceType, params, { vgs: 0, vds: Vdd, vbs: 0 }, T));

    return {
      Vth,
      SS,
      Ion,
      Ioff,
      IonIoffRatio: Ion / Math.max(Ioff, 1e-18),
    };
  }

  /**
   * Full calculation: all I-V, C-V, band diagram, and metrics
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
  } {
    const output = this.sweepIdVds(deviceType, params, T);
    const { linear, log } = this.sweepIdVgs(deviceType, params, T);
    const iv: IVResult = {
      output,
      transfer: linear,
      transferLog: log,
    };

    const cv = this.sweepCV(deviceType, params, T);
    const band = this.bandDiagram(deviceType, params, bias, T);
    const metrics = this.extractMetrics(deviceType, params, T, { linear, log });
    const depletionWidth = this.depletionWidth(params.substrate.doping, T, bias.vbs);

    return { iv, cv, band, metrics, depletionWidth };
  }
}
