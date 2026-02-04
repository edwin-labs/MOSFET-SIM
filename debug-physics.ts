/**
 * Debug script to check intermediate values in Level B
 */

import { Q, EPS0, thermalVoltage, NM_TO_CM } from './src/physics/constants';
import { mobilityElectron, vsatElectron, OXIDES } from './src/physics/materials';
import { LevelBEngine } from './src/physics/levelB';
import type { DeviceParams } from './src/types/device';

const params: DeviceParams = {
  gate: { oxideMaterial: 'SiO2', tox: 2, gateMaterial: 'poly-n', workFunction: 4.15, length: 90 },
  channel: { doping: 5e17, profileType: 'uniform' },
  sourceDrain: { doping: 1e20, junctionDepth: 50, lddDoping: 5e18, lddLength: 20 },
  substrate: { type: 'p-type', doping: 1e17 },
  geometry: { width: 1000, overlapLength: 5 },
  advanced: { fixedCharge: 0, interfaceTrapDensity: 0, seriesResistanceS: 0, seriesResistanceD: 0 },
};

const T = 300;
const Vt = thermalVoltage(T);
const levelB = new LevelBEngine();

console.log('=== Debug Level B Drain Current ===\n');

// Manual calculation for Vgs=0.8V, Vds=1.0V
const Vgs = 0.8;
const Vds = 1.0;

const W_nm = params.geometry.width;
const L_nm = params.gate.length;
const W = W_nm * NM_TO_CM;
const L = L_nm * NM_TO_CM;

console.log(`W = ${W} cm, L = ${L} cm, W/L = ${W/L}`);

const oxideProps = OXIDES[params.gate.oxideMaterial as keyof typeof OXIDES];
const tox_cm = params.gate.tox * NM_TO_CM;
const Cox = (EPS0 * oxideProps.eps_r * 1e-2) / tox_cm;
console.log(`Cox = ${Cox.toExponential(3)} F/cm²`);

const mu0 = mobilityElectron(params.channel.doping, T);
const vsat = vsatElectron(T);
console.log(`mu0 = ${mu0.toFixed(1)} cm²/V·s, vsat = ${vsat.toExponential(2)} cm/s`);

const Vth = levelB.Vth(params, T, 'nmos', 0, Vds);
console.log(`Vth = ${Vth.toFixed(4)} V`);

const Vov = Vgs - Vth;
console.log(`Vov = Vgs - Vth = ${Vov.toFixed(4)} V`);

const SS = levelB.subthresholdSwing(params, T);
const n = SS / (Vt * Math.log(10) * 1000);
console.log(`SS = ${SS.toFixed(1)} mV/dec, n = ${n.toFixed(3)}`);

// Subthreshold current
const I0 = (W / L) * mu0 * Cox * (n - 1) * Vt * Vt;
console.log(`I0 = ${I0.toExponential(3)} A`);

const expTerm = Vov / (n * Vt);
console.log(`Vov / (n * Vt) = ${expTerm.toFixed(2)}`);
console.log(`exp(Vov / (n * Vt)) = ${Math.exp(expTerm).toExponential(3)}`);

const Isub = I0 * Math.exp(expTerm) * (1 - Math.exp(-Vds / Vt));
console.log(`Isub = ${Isub.toExponential(3)} A  <-- THIS IS THE PROBLEM IF VERY LARGE`);

// Smooth overdrive
const Vov_smooth = n * Vt * Math.log(1 + Math.exp(Vov / (n * Vt)));
console.log(`Vov_smooth = ${Vov_smooth.toFixed(4)} V`);

// Mobility degradation
const theta = 0.1;
const mu_eff = mu0 / (1 + theta * Vov_smooth);
console.log(`mu_eff = ${mu_eff.toFixed(1)} cm²/V·s`);

// Saturation voltage
const Esat = 2 * vsat / mu_eff;
const Vdsat = (Vov_smooth * Esat * L) / (Esat * L + Vov_smooth + 1e-9);
console.log(`Esat = ${Esat.toExponential(2)} V/cm, Vdsat = ${Vdsat.toFixed(4)} V`);

// Current calculation
const k = (W / L) * mu_eff * Cox;
console.log(`k = ${k.toExponential(3)} A/V²`);

const Vds_lin = Math.min(Vds, Vdsat);
const Id_lin = k * (Vov_smooth * Vds_lin - Vds_lin * Vds_lin / 2);
console.log(`Vds_lin = ${Vds_lin.toFixed(4)} V`);
console.log(`Id_lin = ${Id_lin.toExponential(3)} A`);

const lambda = levelB.clmParameter(L_nm, params.substrate.doping);
const Id_sat_base = k * (Vov_smooth * Vdsat - Vdsat * Vdsat / 2);
const Id_sat = Id_sat_base * (1 + lambda * Math.max(0, Vds - Vdsat));
console.log(`lambda = ${lambda.toFixed(4)}, Id_sat_base = ${Id_sat_base.toExponential(3)} A`);
console.log(`Id_sat = ${Id_sat.toExponential(3)} A`);

// Blend
const transitionWidth = Math.max(0.05 * Vdsat, 0.01);
const satFactor = 0.5 * (1 + Math.tanh((Vds - Vdsat) / transitionWidth));
console.log(`satFactor = ${satFactor.toFixed(4)}`);

const Id_strong = (1 - satFactor) * Id_lin + satFactor * Id_sat;
console.log(`Id_strong = ${Id_strong.toExponential(3)} A`);

const blendFactor = 1 / (1 + Math.exp(-Vov / (2 * Vt)));
console.log(`blendFactor = ${blendFactor.toFixed(6)}`);
console.log(`1 - blendFactor = ${(1-blendFactor).toExponential(3)}`);

const Id = blendFactor * Id_strong + (1 - blendFactor) * Isub;
console.log(`\nFinal Id = ${Id.toExponential(3)} A`);
console.log(`  = ${blendFactor.toFixed(6)} * ${Id_strong.toExponential(3)} + ${(1-blendFactor).toExponential(3)} * ${Isub.toExponential(3)}`);

// Compare with actual function
const Id_actual = levelB.drainCurrent('nmos', params, { vgs: Vgs, vds: Vds, vbs: 0 }, T);
console.log(`\nActual drainCurrent() result: ${Id_actual.toExponential(3)} A`);
