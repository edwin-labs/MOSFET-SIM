/**
 * SPICE Netlist Export
 *
 * Generates SPICE-compatible model cards and netlists
 * Supports: BSIM3v3, BSIM4, and Level 1/3 models
 */

import type { DeviceParams, BiasConditions, DeviceType } from '../types/device';
import type { DeviceMetrics } from '../types/simulation';

export type SpiceModelType = 'level1' | 'level3' | 'bsim3' | 'bsim4';

export interface SpiceExportOptions {
  modelType: SpiceModelType;
  modelName?: string;
  includeTestbench?: boolean;
  includeComments?: boolean;
}

/**
 * Generate SPICE Level 1 model parameters
 */
function generateLevel1Model(
  deviceType: DeviceType,
  params: DeviceParams,
  metrics: DeviceMetrics | null,
  modelName: string
): string {
  const isNmos = deviceType === 'nmos';
  const type = isNmos ? 'NMOS' : 'PMOS';

  // Extract parameters
  const tox = params.gate.tox * 1e-9;  // nm to m
  const L = params.gate.length * 1e-9;  // nm to m

  // Oxide capacitance
  const epsOx = params.gate.oxideMaterial === 'HfO2' ? 25 : 3.9;
  const eps0 = 8.854e-12;  // F/m
  const Cox = epsOx * eps0 / tox;

  // Mobility (approximate)
  const u0 = isNmos ? 400e-4 : 150e-4;  // cm²/Vs to m²/Vs

  // Calculate KP = μ * Cox
  const KP = u0 * Cox;

  // Threshold voltage
  const VTO = metrics?.Vth ?? (isNmos ? 0.5 : -0.5);

  // Body effect coefficient (approximate)
  const GAMMA = 0.4;

  // Surface potential
  const PHI = 0.7;

  // Channel length modulation
  const LAMBDA = 0.05 / L * 1e-6;  // Approximate based on L

  return `
.MODEL ${modelName} ${type} (LEVEL=1
+ VTO=${VTO.toFixed(4)}        $ Threshold voltage (V)
+ KP=${KP.toExponential(4)}    $ Transconductance parameter (A/V²)
+ GAMMA=${GAMMA.toFixed(3)}    $ Body effect coefficient (V^0.5)
+ PHI=${PHI.toFixed(2)}        $ Surface potential (V)
+ LAMBDA=${LAMBDA.toExponential(3)} $ Channel length modulation (1/V)
+ TOX=${tox.toExponential(3)}  $ Oxide thickness (m)
+ LD=${(params.geometry.overlapLength * 1e-9).toExponential(3)}  $ Lateral diffusion (m)
+ U0=${(u0 * 1e4).toFixed(0)}  $ Surface mobility (cm²/Vs)
+ )
`;
}

/**
 * Generate SPICE Level 3 model parameters
 */
function generateLevel3Model(
  deviceType: DeviceType,
  params: DeviceParams,
  metrics: DeviceMetrics | null,
  modelName: string
): string {
  const isNmos = deviceType === 'nmos';
  const type = isNmos ? 'NMOS' : 'PMOS';

  const tox = params.gate.tox * 1e-9;
  const xj = params.sourceDrain.junctionDepth * 1e-9;

  // Mobility
  const u0 = isNmos ? 400e-4 : 150e-4;
  const epsOx = params.gate.oxideMaterial === 'HfO2' ? 25 : 3.9;
  const eps0 = 8.854e-12;
  const Cox = epsOx * eps0 / tox;
  const KP = u0 * Cox;

  const VTO = metrics?.Vth ?? (isNmos ? 0.5 : -0.5);
  const THETA = 0.1;  // Mobility degradation
  const VMAX = isNmos ? 1e5 : 0.8e5;  // Saturation velocity (m/s)
  const ETA = metrics?.DIBL ? metrics.DIBL / 1000 : 0.05;  // DIBL coefficient
  const KAPPA = 0.2;  // Saturation field factor

  return `
.MODEL ${modelName} ${type} (LEVEL=3
+ VTO=${VTO.toFixed(4)}        $ Threshold voltage (V)
+ KP=${KP.toExponential(4)}    $ Transconductance parameter (A/V²)
+ THETA=${THETA.toFixed(3)}    $ Mobility degradation coefficient (1/V)
+ ETA=${ETA.toFixed(4)}        $ DIBL coefficient
+ KAPPA=${KAPPA.toFixed(2)}    $ Saturation field factor
+ VMAX=${VMAX.toExponential(2)} $ Maximum carrier velocity (m/s)
+ TOX=${tox.toExponential(3)}  $ Oxide thickness (m)
+ XJ=${xj.toExponential(3)}    $ Junction depth (m)
+ LD=${(params.geometry.overlapLength * 1e-9).toExponential(3)}  $ Lateral diffusion (m)
+ U0=${(u0 * 1e4).toFixed(0)}  $ Surface mobility (cm²/Vs)
+ NFS=${(params.advanced.interfaceTrapDensity * 1e4).toExponential(2)} $ Fast surface state density (/m²)
+ )
`;
}

/**
 * Generate BSIM3v3 model parameters
 */
function generateBSIM3Model(
  deviceType: DeviceType,
  params: DeviceParams,
  metrics: DeviceMetrics | null,
  modelName: string
): string {
  const isNmos = deviceType === 'nmos';
  const type = isNmos ? 'NMOS' : 'PMOS';

  const tox = params.gate.tox * 1e-9;
  const xj = params.sourceDrain.junctionDepth * 1e-9;

  const VTH0 = metrics?.Vth ?? (isNmos ? 0.4 : -0.4);
  const K1 = 0.5;  // Body effect coefficient
  const K2 = -0.1;  // Body effect coefficient 2
  const NCH = params.channel.doping * 1e6;  // cm⁻³ to m⁻³
  const U0 = isNmos ? 400 : 150;  // cm²/Vs
  const VSAT = isNmos ? 1e5 : 0.8e5;
  const DSUB = 0.56;
  const ETA0 = metrics?.DIBL ? metrics.DIBL / 1000 * 0.5 : 0.05;
  const ETAB = -0.07;
  const PCLM = 1.3;  // Channel length modulation
  const PDIBLC1 = 0.39;
  const PDIBLC2 = 0.0086;

  return `
.MODEL ${modelName} ${type} (LEVEL=49 VERSION=3.3
* Threshold voltage parameters
+ VTH0=${VTH0.toFixed(4)}      $ Threshold voltage (V)
+ K1=${K1.toFixed(3)}          $ Body effect coefficient (V^0.5)
+ K2=${K2.toFixed(4)}          $ Body effect coefficient 2
+ K3=80                        $ Narrow width coefficient
+ DVT0=2.2                     $ Short channel Vth shift
+ DVT1=0.53                    $ Short channel Vth coefficient
+ DVT2=-0.032                  $ Body-bias Vth dependence
+ NLEV=0
+ NCH=${NCH.toExponential(3)}  $ Channel doping (/m³)
*
* Mobility parameters
+ U0=${U0.toFixed(0)}          $ Low-field mobility (cm²/Vs)
+ UA=-1.4E-9                   $ First-order mobility degradation
+ UB=2.3E-18                   $ Second-order mobility degradation
+ UC=-4.6E-11                  $ Body-bias mobility degradation
+ VSAT=${VSAT.toExponential(2)} $ Saturation velocity (m/s)
*
* Subthreshold parameters
+ VOFF=-0.1                    $ Threshold voltage offset
+ NFACTOR=1.5                  $ Subthreshold swing factor
+ CDSC=0                       $ Drain/source to channel capacitance
*
* Output conductance parameters
+ PCLM=${PCLM.toFixed(2)}      $ Channel length modulation
+ PDIBLC1=${PDIBLC1.toFixed(3)} $ DIBL coefficient 1
+ PDIBLC2=${PDIBLC2.toFixed(4)} $ DIBL coefficient 2
+ DROUT=0.56                   $ DIBL length coefficient
+ DSUB=${DSUB.toFixed(2)}      $ DIBL exponent
+ ETA0=${ETA0.toFixed(4)}      $ DIBL body-bias coefficient
+ ETAB=${ETAB.toFixed(3)}      $ Body-bias DIBL coefficient
*
* Process parameters
+ TOX=${tox.toExponential(3)}  $ Gate oxide thickness (m)
+ XJ=${xj.toExponential(3)}    $ Junction depth (m)
+ LINT=${(params.geometry.overlapLength * 0.5e-9).toExponential(3)}  $ Channel length reduction (m)
+ WINT=${(5e-9).toExponential(3)}  $ Channel width reduction (m)
*
* Capacitance parameters
+ CGSO=${(params.geometry.overlapLength * 1e-9 * 3.5e-10).toExponential(3)} $ Gate-source overlap cap (F/m)
+ CGDO=${(params.geometry.overlapLength * 1e-9 * 3.5e-10).toExponential(3)} $ Gate-drain overlap cap (F/m)
+ CJ=${(1e-3).toExponential(3)}  $ Junction capacitance (F/m²)
*
* Noise parameters
+ NOIA=${(isNmos ? 1e20 : 5e19).toExponential(2)}
+ NOIB=${(5e4).toExponential(2)}
+ NOIC=${(-1.4e-12).toExponential(2)}
+ EF=1.0
+ )
`;
}

/**
 * Generate BSIM4 model parameters (simplified)
 */
function generateBSIM4Model(
  deviceType: DeviceType,
  params: DeviceParams,
  metrics: DeviceMetrics | null,
  modelName: string
): string {
  const isNmos = deviceType === 'nmos';
  const type = isNmos ? 'NMOS' : 'PMOS';

  const tox = params.gate.tox * 1e-9;
  const toxe = tox;  // Electrical oxide thickness
  const VTH0 = metrics?.Vth ?? (isNmos ? 0.4 : -0.4);

  return `
.MODEL ${modelName} ${type} (LEVEL=54 VERSION=4.7
* Threshold voltage parameters
+ VTH0=${VTH0.toFixed(4)}      $ Long-channel Vth (V)
+ K1=0.5                       $ Body effect coefficient
+ K2=-0.1                      $ Body effect coefficient 2
+ DVT0=2.2                     $ SCE coefficient
+ DVT1=0.53
+ DVT2=-0.032
*
* Mobility parameters
+ U0=${isNmos ? 400 : 150}     $ Low-field mobility (cm²/Vs)
+ UA=-1.4E-9
+ UB=2.3E-18
+ UC=-4.6E-11
+ VSAT=${isNmos ? 1e5 : 0.8e5} $ Saturation velocity (m/s)
+ EU=1.67
*
* Subthreshold parameters
+ VOFF=-0.1
+ NFACTOR=1.5
+ CDSCD=0
*
* DIBL and CLM parameters
+ PCLM=1.3
+ PDIBL1=0.39
+ PDIBL2=0.0086
+ ETA0=${(metrics?.DIBL ? metrics.DIBL / 1000 * 0.5 : 0.05).toFixed(4)}
+ DSUB=0.56
*
* Process parameters
+ TOXE=${toxe.toExponential(3)}  $ Electrical oxide thickness (m)
+ TOXP=${(toxe * 0.95).toExponential(3)}  $ Physical oxide thickness
+ TOXM=${toxe.toExponential(3)}
+ EPSROX=${params.gate.oxideMaterial === 'HfO2' ? 25 : 3.9}
+ DTOX=0
*
* Gate tunneling parameters
+ TOXREF=3E-9
+ AIGBACC=0.43
+ BIGBACC=0.054
+ CIGBACC=0.075
*
* Noise parameters
+ NOIA=${(isNmos ? 6.25e41 : 1.25e41).toExponential(3)}
+ NOIB=${(3.125e26).toExponential(3)}
+ NOIC=${(8.75).toExponential(3)}
+ EM=4.1E7
+ EF=1.0
+ NTNOI=1.0
+ )
`;
}

/**
 * Generate testbench netlist
 */
function generateTestbench(
  deviceType: DeviceType,
  params: DeviceParams,
  bias: BiasConditions,
  modelName: string
): string {
  const L = params.gate.length * 1e-9;
  const W = params.geometry.width * 1e-9;
  const sign = deviceType === 'nmos' ? 1 : -1;

  return `
* MOSFET Testbench
* Generated by MOSFET Junction Simulator

* Voltage sources
VGS gate 0 DC ${(sign * bias.vgs).toFixed(3)}
VDS drain 0 DC ${(sign * bias.vds).toFixed(3)}
VBS bulk 0 DC ${(-sign * bias.vbs).toFixed(3)}

* Device under test
M1 drain gate 0 bulk ${modelName} L=${L.toExponential(3)} W=${W.toExponential(3)}

* DC Analysis
.DC VGS 0 ${(sign * 1.2).toFixed(1)} 0.01 VDS 0.05 ${(sign * 1.2).toFixed(1)} 0.2

* Operating point
.OP

* AC Analysis (for noise)
.AC DEC 10 1 1G

* Noise Analysis
.NOISE V(drain) VGS

.END
`;
}

/**
 * Main SPICE export function
 */
export function generateSpiceNetlist(
  deviceType: DeviceType,
  params: DeviceParams,
  bias: BiasConditions,
  metrics: DeviceMetrics | null,
  options: SpiceExportOptions
): string {
  const modelName = options.modelName ?? (deviceType === 'nmos' ? 'NMOS_SIM' : 'PMOS_SIM');

  let output = '';

  // Header
  if (options.includeComments !== false) {
    output += `* SPICE Model Card
* Generated by MOSFET Junction Simulator
* Date: ${new Date().toISOString()}
* Device: ${deviceType.toUpperCase()}
* Technology: L=${params.gate.length}nm, tox=${params.gate.tox}nm
*
`;
  }

  // Generate model based on type
  switch (options.modelType) {
    case 'level1':
      output += generateLevel1Model(deviceType, params, metrics, modelName);
      break;
    case 'level3':
      output += generateLevel3Model(deviceType, params, metrics, modelName);
      break;
    case 'bsim3':
      output += generateBSIM3Model(deviceType, params, metrics, modelName);
      break;
    case 'bsim4':
      output += generateBSIM4Model(deviceType, params, metrics, modelName);
      break;
  }

  // Add testbench if requested
  if (options.includeTestbench) {
    output += generateTestbench(deviceType, params, bias, modelName);
  }

  return output;
}

/**
 * Download SPICE netlist file
 */
export function downloadSpiceNetlist(
  deviceType: DeviceType,
  params: DeviceParams,
  bias: BiasConditions,
  metrics: DeviceMetrics | null,
  options: SpiceExportOptions
): void {
  const content = generateSpiceNetlist(deviceType, params, bias, metrics, options);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${deviceType}_${options.modelType}.sp`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
