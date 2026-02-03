export interface SweepCurve {
  label: string;
  x: number[];
  y: number[];
}

export interface IVResult {
  output: SweepCurve[];       // I_D vs V_DS (multiple V_GS curves)
  transfer: SweepCurve[];     // I_D vs V_GS (multiple V_DS curves)
  transferLog: SweepCurve[];  // log(I_D) vs V_GS
}

export interface CVResult {
  highFreq: { vg: number[]; c: number[] };  // High frequency C-V
  lowFreq?: { vg: number[]; c: number[] };  // Low frequency C-V (quasi-static)
}

export interface BandDiagramResult {
  vertical: {
    depth: number[];  // nm - distance from gate
    Ec: number[];     // eV - conduction band
    Ev: number[];     // eV - valence band
    Ef: number;       // eV - Fermi level (constant)
    Ei: number[];     // eV - intrinsic level
  };
  lateral?: {
    position: number[];  // nm - position along channel
    Ec: number[];
    Ev: number[];
    EfN: number[];       // quasi-Fermi level for electrons
    EfP: number[];       // quasi-Fermi level for holes
  };
}

export interface DopingProfile1D {
  position: number[];  // nm
  Nd: number[];        // cm^-3 - donor concentration
  Na: number[];        // cm^-3 - acceptor concentration
  Nnet: number[];      // cm^-3 - net doping (Nd - Na)
}

export interface DopingProfile2D {
  x: number[];         // nm - lateral position
  z: number[];         // nm - vertical position (depth)
  nx: number;
  nz: number;
  Nd: Float64Array;    // [nx * nz] cm^-3 - donor concentration
  Na: Float64Array;    // [nx * nz] cm^-3 - acceptor concentration
  Nnet: Float64Array;  // [nx * nz] cm^-3 - net doping
}

export interface NumericalResult2D {
  x: number[];
  z: number[];
  nx: number;
  nz: number;
  psi: Float64Array;   // V - electrostatic potential
  n: Float64Array;     // cm^-3 - electron concentration
  p: Float64Array;     // cm^-3 - hole concentration
  Ex: Float64Array;    // V/cm - electric field x-component
  Ez: Float64Array;    // V/cm - electric field z-component
  Jn?: Float64Array;   // A/cm^2 - electron current density
  Jp?: Float64Array;   // A/cm^2 - hole current density
}

export interface DeviceMetrics {
  Vth: number;           // V - threshold voltage
  SS: number;            // mV/dec - subthreshold swing
  Ion: number;           // A - on-state current
  Ioff: number;          // A - off-state current
  IonIoffRatio: number;  // Ion/Ioff ratio
  DIBL?: number;         // mV/V - DIBL coefficient
  gmMax?: number;        // S - maximum transconductance
  Vdsat?: number;        // V - saturation voltage
  rout?: number;         // Ohm - output resistance
  Cgg?: number;          // F - total gate capacitance
}

export type SimulationStatus = 'idle' | 'computing' | 'done' | 'error';

export interface SimulationState {
  status: SimulationStatus;
  progress: number;      // 0-1
  calcTime: number;      // ms
  iv: IVResult | null;
  cv: CVResult | null;
  band: BandDiagramResult | null;
  doping1d: DopingProfile1D | null;
  doping2d: DopingProfile2D | null;
  dopingLateral1d: DopingProfile1D | null;
  numerical2d: NumericalResult2D | null;
  metrics: DeviceMetrics | null;
  gm: SweepCurve | null;   // gm vs Vgs
  gds: SweepCurve | null;  // gds vs Vds
  error: string | null;
  depletionWidth: number;  // nm - for visualization
}
