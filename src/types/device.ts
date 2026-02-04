export type DeviceType = 'nmos' | 'pmos';
export type ModelType = 'compact' | 'numerical';
export type InputMode = 'device' | 'process';

/**
 * Compact Model Effects - toggleable physical effects
 * Each effect adds complexity and accuracy to the simulation
 */
export interface CompactModelEffects {
  /** Velocity saturation - reduces current at high lateral fields */
  velocitySaturation: boolean;
  /** DIBL - Drain-Induced Barrier Lowering, Vth reduction with Vds */
  dibl: boolean;
  /** CLM - Channel Length Modulation, finite output resistance */
  clm: boolean;
  /** Body effect - Vth dependence on Vbs */
  bodyEffect: boolean;
  /** Mobility degradation - vertical field reduces mobility */
  mobilityDegradation: boolean;
  /** Subthreshold slope degradation - non-ideal SS due to interface traps */
  subthresholdSlope: boolean;
  /** Short channel Vth roll-off */
  shortChannel: boolean;
  /** Series resistance - S/D contact and extension resistance */
  seriesResistance: boolean;
}

/** @deprecated Use ModelType instead */
export type PhysicsLevel = 'A' | 'B' | 'C';
export type OxideMaterial = 'SiO2' | 'HfO2';
export type GateMaterial = 'poly-n' | 'poly-p' | 'TiN' | 'TaN';
export type SubstrateType = 'p-type' | 'n-type';
export type ImplantSpecies = 'B' | 'BF2' | 'P' | 'As';
export type DopingProfileType = 'uniform' | 'gaussian' | 'retrograde';

export interface GateParams {
  oxideMaterial: OxideMaterial;
  tox: number;              // nm - oxide thickness
  gateMaterial: GateMaterial;
  workFunction: number;     // eV
  length: number;           // nm - L_eff (effective channel length)
}

export interface ChannelParams {
  doping: number;           // cm^-3 - channel doping concentration
  profileType: DopingProfileType;
}

export interface SourceDrainParams {
  doping: number;           // cm^-3 - S/D doping concentration
  junctionDepth: number;    // nm - x_j
  lddDoping: number;        // cm^-3 - LDD region doping
  lddLength: number;        // nm - LDD extension length
}

export interface SubstrateParams {
  type: SubstrateType;
  doping: number;           // cm^-3 - substrate doping
}

export interface GeometryParams {
  width: number;            // nm - channel width
  overlapLength: number;    // nm - gate-S/D overlap
}

export interface AdvancedParams {
  fixedCharge: number;          // cm^-2 - Q_f
  interfaceTrapDensity: number; // cm^-2 eV^-1 - D_it
  seriesResistanceS: number;    // Ohm - source series resistance
  seriesResistanceD: number;    // Ohm - drain series resistance
}

export interface AdvancedPhysicsOptions {
  gateLeakage: boolean;         // Enable Fowler-Nordheim / Direct tunneling
  impactIonization: boolean;    // Enable avalanche multiplication
  hotCarrier: boolean;          // Enable hot carrier substrate current
  gidl: boolean;                // Enable gate-induced drain leakage
  selfHeating: boolean;         // Enable self-heating effects
  quantumEffects: boolean;      // Enable quantum capacitance correction
  polyDepletion: boolean;       // Enable poly depletion effect
}

export interface DeviceParams {
  gate: GateParams;
  channel: ChannelParams;
  sourceDrain: SourceDrainParams;
  substrate: SubstrateParams;
  geometry: GeometryParams;
  advanced: AdvancedParams;
}

export interface ProcessGateStack {
  oxideMaterial: OxideMaterial;
  oxideThickness: number;   // nm
  gateMaterial: GateMaterial;
  gateLength: number;       // nm
  polyDepletion: boolean;
}

export interface ProcessWell {
  doping: number;           // cm^-3
  depth: number;            // nm
  retrograde: boolean;
  retrogradePeak: number;   // nm
}

export interface ProcessVtAdjust {
  species: ImplantSpecies;
  dose: number;             // cm^-2
  energy: number;           // keV
  profileType: DopingProfileType;
}

export interface ProcessHalo {
  enabled: boolean;
  species: ImplantSpecies;
  dose: number;             // cm^-2
  energy: number;           // keV
  tiltAngle: number;        // degrees
}

export interface ProcessSDMain {
  species: ImplantSpecies;
  dose: number;             // cm^-2
  energy: number;           // keV
  depth: number;            // nm (target junction depth)
}

export interface ProcessLDD {
  species: ImplantSpecies;
  dose: number;             // cm^-2
  energy: number;           // keV
}

export interface ProcessSpacer {
  width: number;            // nm
  material: 'Si3N4' | 'SiO2';
}

export interface ProcessSilicide {
  enabled: boolean;
  material: 'NiSi' | 'CoSi2' | 'TiSi2';
  thickness: number;        // nm
}

export interface ProcessAnneal {
  type: 'RTA' | 'Spike' | 'Laser';
  temperature: number;      // Celsius
  time: number;             // seconds
  activationRatio: number;  // 0-1
}

export interface ProcessIsolation {
  type: 'STI' | 'LOCOS';
  stiDepth: number;         // nm
  stiWidth: number;         // nm
  activeWidth: number;      // nm
}

export interface ProcessParams {
  gateStack: ProcessGateStack;
  well: ProcessWell;
  vtAdjust: ProcessVtAdjust;
  halo: ProcessHalo;
  sdMain: ProcessSDMain;
  ldd: ProcessLDD;
  spacer: ProcessSpacer;
  silicide: ProcessSilicide;
  anneal: ProcessAnneal;
  isolation: ProcessIsolation;
}

export interface BiasConditions {
  vgs: number;  // V - gate-source voltage
  vds: number;  // V - drain-source voltage
  vbs: number;  // V - body-source voltage
}
