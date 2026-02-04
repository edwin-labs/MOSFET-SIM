/**
 * Test script to compare Level A and Level B physics engines
 */

import { LevelAEngine } from './src/physics/levelA';
import { LevelBEngine } from './src/physics/levelB';
import type { DeviceParams, BiasConditions } from './src/types/device';

// Default 90nm NMOS parameters
const params: DeviceParams = {
  gate: {
    oxideMaterial: 'SiO2',
    tox: 2,
    gateMaterial: 'poly-n',
    workFunction: 4.15,
    length: 90,
  },
  channel: {
    doping: 5e17,
    profileType: 'uniform',
  },
  sourceDrain: {
    doping: 1e20,
    junctionDepth: 50,
    lddDoping: 5e18,
    lddLength: 20,
  },
  substrate: {
    type: 'p-type',
    doping: 1e17,
  },
  geometry: {
    width: 1000,
    overlapLength: 5,
  },
  advanced: {
    fixedCharge: 0,
    interfaceTrapDensity: 0,
    seriesResistanceS: 0,
    seriesResistanceD: 0,
  },
};

const T = 300; // Kelvin

const levelA = new LevelAEngine();
const levelB = new LevelBEngine();

console.log('=== Level A vs Level B Comparison ===\n');

// 1. Threshold Voltage
console.log('--- Threshold Voltage ---');
const VthA = levelA.Vth(params, T, 'nmos', 0);
const VthB_lowVds = levelB.Vth(params, T, 'nmos', 0, 0.05);
const VthB_highVds = levelB.Vth(params, T, 'nmos', 0, 1.0);
console.log(`Level A Vth: ${VthA.toFixed(4)} V`);
console.log(`Level B Vth (Vds=0.05V): ${VthB_lowVds.toFixed(4)} V`);
console.log(`Level B Vth (Vds=1.0V): ${VthB_highVds.toFixed(4)} V`);
console.log(`DIBL effect: ${((VthB_lowVds - VthB_highVds) / 0.95 * 1000).toFixed(1)} mV/V\n`);

// 2. Drain Current at specific bias points
console.log('--- Drain Current Comparison ---');
const biasPoints: BiasConditions[] = [
  { vgs: 0.0, vds: 1.0, vbs: 0 },  // Off state
  { vgs: 0.3, vds: 1.0, vbs: 0 },  // Subthreshold
  { vgs: 0.5, vds: 1.0, vbs: 0 },  // Near threshold
  { vgs: 0.6, vds: 0.1, vbs: 0 },  // Linear region
  { vgs: 0.6, vds: 1.0, vbs: 0 },  // Saturation
  { vgs: 1.0, vds: 0.1, vbs: 0 },  // Strong inversion, linear
  { vgs: 1.0, vds: 1.0, vbs: 0 },  // Strong inversion, saturation
];

console.log('Vgs(V)\tVds(V)\tId_A(A)\t\tId_B(A)\t\tRatio(B/A)');
console.log('-'.repeat(70));

for (const bias of biasPoints) {
  const IdA = levelA.drainCurrent('nmos', params, bias, T);
  const IdB = levelB.drainCurrent('nmos', params, bias, T);
  const ratio = IdA !== 0 ? IdB / IdA : 0;
  console.log(`${bias.vgs.toFixed(1)}\t${bias.vds.toFixed(1)}\t${IdA.toExponential(3)}\t${IdB.toExponential(3)}\t${ratio.toFixed(3)}`);
}

// 3. Transfer characteristics (Id vs Vgs)
console.log('\n--- Transfer Characteristics (Vds=1.0V) ---');
console.log('Vgs(V)\tId_A(A)\t\tId_B(A)\t\tRatio');
console.log('-'.repeat(60));

for (let vgs = -0.2; vgs <= 1.2; vgs += 0.1) {
  const bias: BiasConditions = { vgs, vds: 1.0, vbs: 0 };
  const IdA = levelA.drainCurrent('nmos', params, bias, T);
  const IdB = levelB.drainCurrent('nmos', params, bias, T);
  const ratio = IdA > 1e-15 ? IdB / IdA : 0;
  console.log(`${vgs.toFixed(1)}\t${IdA.toExponential(3)}\t${IdB.toExponential(3)}\t${ratio.toFixed(3)}`);
}

// 4. Output characteristics (Id vs Vds at Vgs=0.8V)
console.log('\n--- Output Characteristics (Vgs=0.8V) ---');
console.log('Vds(V)\tId_A(A)\t\tId_B(A)\t\tRatio');
console.log('-'.repeat(60));

for (let vds = 0.0; vds <= 1.8; vds += 0.1) {
  const bias: BiasConditions = { vgs: 0.8, vds, vbs: 0 };
  const IdA = levelA.drainCurrent('nmos', params, bias, T);
  const IdB = levelB.drainCurrent('nmos', params, bias, T);
  const ratio = IdA > 1e-15 ? IdB / IdA : 0;
  console.log(`${vds.toFixed(1)}\t${IdA.toExponential(3)}\t${IdB.toExponential(3)}\t${ratio.toFixed(3)}`);
}

// 5. Extract metrics
console.log('\n--- Device Metrics ---');
const ivA = levelA.sweepIdVgs('nmos', params, T);
const ivB = levelB.sweepIdVgs('nmos', params, T);
const metricsA = levelA.extractMetrics('nmos', params, T, ivA);
const metricsB = levelB.extractMetrics('nmos', params, T, ivB);

console.log('Metric\t\tLevel A\t\tLevel B');
console.log('-'.repeat(50));
console.log(`Vth (V)\t\t${metricsA.Vth.toFixed(4)}\t\t${metricsB.Vth.toFixed(4)}`);
console.log(`SS (mV/dec)\t${metricsA.SS.toFixed(1)}\t\t${metricsB.SS.toFixed(1)}`);
console.log(`Ion (A)\t\t${metricsA.Ion.toExponential(3)}\t${metricsB.Ion.toExponential(3)}`);
console.log(`Ioff (A)\t${metricsA.Ioff.toExponential(3)}\t${metricsB.Ioff.toExponential(3)}`);
console.log(`Ion/Ioff\t${metricsA.IonIoffRatio.toExponential(2)}\t${metricsB.IonIoffRatio.toExponential(2)}`);
if (metricsB.DIBL) console.log(`DIBL (mV/V)\t-\t\t${metricsB.DIBL.toFixed(1)}`);
if (metricsB.gmMax) console.log(`gm_max (S)\t-\t\t${metricsB.gmMax.toExponential(3)}`);
if (metricsB.Vdsat) console.log(`Vdsat (V)\t-\t\t${metricsB.Vdsat.toFixed(4)}`);
