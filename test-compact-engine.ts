/**
 * Test the new unified CompactEngine with toggleable effects
 */

import { CompactEngine, DEFAULT_EFFECTS, BASIC_EFFECTS } from './src/physics/compactEngine';
import type { DeviceParams, BiasConditions, CompactModelEffects } from './src/types/device';

const testParams: DeviceParams = {
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

const T = 300; // Temperature in Kelvin

console.log('=== Compact Engine Test with Toggleable Effects ===\n');

// Test with BASIC effects (minimal)
console.log('--- BASIC Effects (minimal model) ---');
const basicEngine = new CompactEngine(BASIC_EFFECTS);
const basicId = basicEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
const basicVth = basicEngine.Vth(testParams, T, 'nmos', 0, 1.0);
console.log(`Vth: ${basicVth.toFixed(4)} V`);
console.log(`Id(Vgs=0.8V, Vds=1.0V): ${basicId.toExponential(3)} A`);
console.log(`Effects: ${JSON.stringify(basicEngine.getEffects(), null, 2)}`);

// Test with DEFAULT effects (full model)
console.log('\n--- DEFAULT Effects (full model) ---');
const fullEngine = new CompactEngine(DEFAULT_EFFECTS);
const fullId = fullEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
const fullVth = fullEngine.Vth(testParams, T, 'nmos', 0, 1.0);
console.log(`Vth: ${fullVth.toFixed(4)} V`);
console.log(`Id(Vgs=0.8V, Vds=1.0V): ${fullId.toExponential(3)} A`);
console.log(`Effects: ${JSON.stringify(fullEngine.getEffects(), null, 2)}`);

// Test individual effect toggles
console.log('\n--- Individual Effect Impact ---');

const effectsToTest: (keyof CompactModelEffects)[] = [
  'velocitySaturation',
  'dibl',
  'clm',
  'mobilityDegradation',
  'shortChannel',
];

// Baseline: all effects OFF except body effect
const baseline: CompactModelEffects = {
  velocitySaturation: false,
  dibl: false,
  clm: false,
  bodyEffect: true,
  mobilityDegradation: false,
  subthresholdSlope: false,
  shortChannel: false,
  seriesResistance: false,
};

const baselineEngine = new CompactEngine(baseline);
const baselineId = baselineEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
console.log(`Baseline Id: ${baselineId.toExponential(3)} A`);

for (const effect of effectsToTest) {
  const testEffects = { ...baseline, [effect]: true };
  const testEngine = new CompactEngine(testEffects);
  const testId = testEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
  const ratio = testId / baselineId;
  console.log(`+${effect}: ${testId.toExponential(3)} A (${(ratio * 100).toFixed(1)}% of baseline)`);
}

// Output characteristics comparison
console.log('\n--- Output Characteristics Comparison ---');
console.log('Vds(V)\tBasic(A)\tFull(A)\t\tRatio');
console.log('-'.repeat(60));

const vdsValues = [0.1, 0.3, 0.5, 0.7, 1.0, 1.5];
for (const vds of vdsValues) {
  const basic = basicEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds, vbs: 0 }, T);
  const full = fullEngine.drainCurrent('nmos', testParams, { vgs: 0.8, vds, vbs: 0 }, T);
  const ratio = full / basic;
  console.log(`${vds.toFixed(1)}\t${basic.toExponential(3)}\t${full.toExponential(3)}\t${ratio.toFixed(3)}`);
}

// Effect of DIBL on Vth
console.log('\n--- DIBL Effect on Vth ---');
const noDiblEffects = { ...DEFAULT_EFFECTS, dibl: false };
const noDiblEngine = new CompactEngine(noDiblEffects);

const VthLowVds_noDibl = noDiblEngine.Vth(testParams, T, 'nmos', 0, 0.05);
const VthHighVds_noDibl = noDiblEngine.Vth(testParams, T, 'nmos', 0, 1.0);
const VthLowVds_dibl = fullEngine.Vth(testParams, T, 'nmos', 0, 0.05);
const VthHighVds_dibl = fullEngine.Vth(testParams, T, 'nmos', 0, 1.0);

console.log(`Without DIBL: Vth(Vds=0.05V)=${VthLowVds_noDibl.toFixed(4)}V, Vth(Vds=1.0V)=${VthHighVds_noDibl.toFixed(4)}V`);
console.log(`With DIBL:    Vth(Vds=0.05V)=${VthLowVds_dibl.toFixed(4)}V, Vth(Vds=1.0V)=${VthHighVds_dibl.toFixed(4)}V`);
console.log(`DIBL = ${((VthLowVds_dibl - VthHighVds_dibl) / 0.95 * 1000).toFixed(1)} mV/V`);

// Effect of CLM on output resistance
console.log('\n--- CLM Effect on Output Resistance ---');
const noClmEffects = { ...DEFAULT_EFFECTS, clm: false };
const noClmEngine = new CompactEngine(noClmEffects);

const gds_noCLM = noClmEngine.outputConductance('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
const gds_CLM = fullEngine.outputConductance('nmos', testParams, { vgs: 0.8, vds: 1.0, vbs: 0 }, T);
console.log(`Without CLM: gds=${(gds_noCLM * 1e6).toFixed(2)} uS, ro=${(1/gds_noCLM/1000).toFixed(1)} kOhm`);
console.log(`With CLM:    gds=${(gds_CLM * 1e6).toFixed(2)} uS, ro=${(1/gds_CLM/1000).toFixed(1)} kOhm`);

console.log('\n=== Test Complete ===');
