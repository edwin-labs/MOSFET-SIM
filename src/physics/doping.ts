/**
 * Doping Profile Engine
 *
 * Generates 1D and 2D doping profiles based on:
 * - Device Mode: simple step/Gaussian junctions
 * - Process Mode: implant + anneal simulation
 */

import { getImplantRange } from './materials';
import type { DeviceParams, ProcessParams, DeviceType } from '../types/device';
import type { DopingProfile1D, DopingProfile2D } from '../types/simulation';

/**
 * Gaussian profile from implant parameters
 * N(x) = (Dose / (sqrt(2π) * dRp)) * exp(-(x - Rp)^2 / (2 * dRp^2))
 */
function gaussianProfile(
  x: number,
  Rp: number,
  dRp: number,
  dose: number
): number {
  const peakConc = dose / (Math.sqrt(2 * Math.PI) * dRp * 1e-7); // Convert nm to cm
  return peakConc * Math.exp(-Math.pow(x - Rp, 2) / (2 * dRp * dRp));
}

/**
 * Apply thermal diffusion (Gaussian broadening)
 * New profile = convolution with Gaussian of width sqrt(2*D*t)
 * Approximated by increasing dRp
 */
function thermalDiffusion(
  dRp: number,
  temperature: number,
  time: number,
  activationRatio: number
): number {
  // Simplified diffusion length
  // D ~ D0 * exp(-Ea / kT), typical values for dopants
  const D0 = 1e-3; // cm^2/s (approximation)
  const Ea = 3.5; // eV (approximation)
  const kT = 8.617e-5 * temperature; // eV

  const D = D0 * Math.exp(-Ea / kT) * activationRatio;
  const Dt = D * time;
  const diffusionLength = Math.sqrt(2 * Dt) * 1e7; // Convert to nm

  return Math.sqrt(dRp * dRp + diffusionLength * diffusionLength);
}

/**
 * Generate 1D vertical doping profile (Device Mode)
 */
export function generateVerticalProfile1D(
  params: DeviceParams,
  deviceType: DeviceType,
  options: {
    maxDepth?: number;
    nPoints?: number;
  } = {}
): DopingProfile1D {
  const { maxDepth = 300, nPoints = 200 } = options;

  const isNMOS = deviceType === 'nmos';
  const position: number[] = [];
  const Nd: number[] = [];
  const Na: number[] = [];
  const Nnet: number[] = [];

  const xj = params.sourceDrain.junctionDepth;
  const Nsub = params.substrate.doping;
  const Nsd = params.sourceDrain.doping;
  const Nch = params.channel.doping;

  for (let i = 0; i < nPoints; i++) {
    const z = (i / (nPoints - 1)) * maxDepth;
    position.push(z);

    let nd = 0;
    let na = 0;

    if (isNMOS) {
      // nMOS: p-type substrate, n+ S/D
      na = Nsub;

      // Channel doping (VT adjust)
      if (z < xj * 0.5) {
        na += Nch * Math.exp(-z / (xj * 0.3));
      }

      // S/D region (Gaussian junction)
      if (z < xj * 1.5) {
        const junctionProfile = Nsd * Math.exp(-Math.pow(z / xj, 2) * 2);
        nd = junctionProfile;
      }
    } else {
      // pMOS: n-type substrate, p+ S/D
      nd = Nsub;

      if (z < xj * 0.5) {
        nd += Nch * Math.exp(-z / (xj * 0.3));
      }

      if (z < xj * 1.5) {
        const junctionProfile = Nsd * Math.exp(-Math.pow(z / xj, 2) * 2);
        na = junctionProfile;
      }
    }

    Nd.push(nd);
    Na.push(na);
    Nnet.push(nd - na);
  }

  return { position, Nd, Na, Nnet };
}

/**
 * Generate 1D lateral doping profile (along channel)
 */
export function generateLateralProfile1D(
  params: DeviceParams,
  deviceType: DeviceType,
  depth: number,
  options: {
    width?: number;
    nPoints?: number;
  } = {}
): DopingProfile1D {
  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;
  const { width = L + 2 * lddLen + 2 * sdLen + 40, nPoints = 200 } = options;

  const isNMOS = deviceType === 'nmos';
  const position: number[] = [];
  const Nd: number[] = [];
  const Na: number[] = [];
  const Nnet: number[] = [];

  const Nsub = params.substrate.doping;
  const Nsd = params.sourceDrain.doping;
  const Nldd = params.sourceDrain.lddDoping;
  const xj = params.sourceDrain.junctionDepth;

  const halfWidth = width / 2;
  const gateEdge = L / 2;
  const lddEdge = gateEdge + lddLen;

  for (let i = 0; i < nPoints; i++) {
    const x = -halfWidth + (i / (nPoints - 1)) * width;
    position.push(x);

    let nd = 0;
    let na = 0;
    const absX = Math.abs(x);

    // Depth factor (junction profile)
    const depthFactor = depth < xj ? Math.exp(-Math.pow(depth / xj, 2) * 2) : 0.01;

    if (isNMOS) {
      na = Nsub;

      // S/D main
      if (absX > lddEdge) {
        nd = Nsd * depthFactor;
      }
      // LDD
      else if (absX > gateEdge) {
        // Gradient from LDD to channel
        const t = (absX - gateEdge) / lddLen;
        nd = Nldd * t * depthFactor;
      }
      // Channel (under gate)
      else {
        // Small surface concentration from VT implant
        nd = 0;
      }
    } else {
      nd = Nsub;

      if (absX > lddEdge) {
        na = Nsd * depthFactor;
      } else if (absX > gateEdge) {
        const t = (absX - gateEdge) / lddLen;
        na = Nldd * t * depthFactor;
      }
    }

    Nd.push(nd);
    Na.push(na);
    Nnet.push(nd - na);
  }

  return { position, Nd, Na, Nnet };
}

/**
 * Generate 2D doping profile (Device Mode - simplified)
 */
export function generateDopingProfile2D_Device(
  params: DeviceParams,
  deviceType: DeviceType,
  options: {
    xRange?: number;
    zRange?: number;
    nx?: number;
    nz?: number;
  } = {}
): DopingProfile2D {
  const L = params.gate.length;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60;

  const {
    xRange = L + 2 * lddLen + 2 * sdLen + 40,
    zRange = 150,
    nx = 100,
    nz = 80,
  } = options;

  const x: number[] = [];
  const z: number[] = [];

  // Create coordinate arrays
  for (let i = 0; i < nx; i++) {
    x.push(-xRange / 2 + (i / (nx - 1)) * xRange);
  }
  for (let j = 0; j < nz; j++) {
    z.push((j / (nz - 1)) * zRange);
  }

  const Nd = new Float64Array(nx * nz);
  const Na = new Float64Array(nx * nz);
  const Nnet = new Float64Array(nx * nz);

  const isNMOS = deviceType === 'nmos';
  const Nsub = params.substrate.doping;
  const Nsd = params.sourceDrain.doping;
  const Nldd = params.sourceDrain.lddDoping;
  const Nch = params.channel.doping;
  const xj = params.sourceDrain.junctionDepth;

  const gateEdge = L / 2;
  const lddEdge = gateEdge + lddLen;

  for (let j = 0; j < nz; j++) {
    const zVal = z[j];
    const depthFactor = zVal < xj ? Math.exp(-Math.pow(zVal / xj, 2) * 2) : Math.exp(-zVal / xj);

    for (let i = 0; i < nx; i++) {
      const xVal = x[i];
      const absX = Math.abs(xVal);
      const idx = j * nx + i;

      let nd = 0;
      let na = 0;

      if (isNMOS) {
        na = Nsub;

        // Channel VT implant (Gaussian peak near surface)
        if (absX < gateEdge && zVal < xj * 0.8) {
          na += Nch * Math.exp(-Math.pow((zVal - xj * 0.3) / (xj * 0.2), 2));
        }

        // LDD region
        if (absX > gateEdge && absX < lddEdge) {
          const lateralFactor = (absX - gateEdge) / lddLen;
          nd = Nldd * lateralFactor * depthFactor;
        }

        // S/D main region
        if (absX >= lddEdge) {
          nd = Nsd * depthFactor;
        }
      } else {
        nd = Nsub;

        if (absX < gateEdge && zVal < xj * 0.8) {
          nd += Nch * Math.exp(-Math.pow((zVal - xj * 0.3) / (xj * 0.2), 2));
        }

        if (absX > gateEdge && absX < lddEdge) {
          const lateralFactor = (absX - gateEdge) / lddLen;
          na = Nldd * lateralFactor * depthFactor;
        }

        if (absX >= lddEdge) {
          na = Nsd * depthFactor;
        }
      }

      Nd[idx] = nd;
      Na[idx] = na;
      Nnet[idx] = nd - na;
    }
  }

  return { x, z, nx, nz, Nd, Na, Nnet };
}

/**
 * Generate 2D doping profile (Process Mode - full implant simulation)
 */
export function generateDopingProfile2D_Process(
  processParams: ProcessParams,
  deviceType: DeviceType,
  options: {
    xRange?: number;
    zRange?: number;
    nx?: number;
    nz?: number;
  } = {}
): DopingProfile2D {
  const L = processParams.gateStack.gateLength;
  const spacerWidth = processParams.spacer.width;
  const sdLen = 80;

  const {
    xRange = L + 2 * spacerWidth + 2 * sdLen + 60,
    zRange = 200,
    nx = 120,
    nz = 100,
  } = options;

  const x: number[] = [];
  const z: number[] = [];

  for (let i = 0; i < nx; i++) {
    x.push(-xRange / 2 + (i / (nx - 1)) * xRange);
  }
  for (let j = 0; j < nz; j++) {
    z.push((j / (nz - 1)) * zRange);
  }

  const Nd = new Float64Array(nx * nz);
  const Na = new Float64Array(nx * nz);
  const Nnet = new Float64Array(nx * nz);

  const isNMOS = deviceType === 'nmos';
  const gateEdge = L / 2;
  const spacerEdge = gateEdge + spacerWidth;

  // Get implant parameters
  const { anneal } = processParams;
  const annealTemp = anneal.temperature + 273; // Convert to K
  const annealTime = anneal.time;
  const activation = anneal.activationRatio;

  // Well/Substrate doping
  const Nwell = processParams.well.doping;

  // VT adjust implant
  const vtImplant = processParams.vtAdjust;
  const vtRange = getImplantRange(vtImplant.species, vtImplant.energy);
  const vtRp = vtRange.Rp;
  const vtdRp = thermalDiffusion(vtRange.dRp, annealTemp, annealTime, activation);

  // LDD implant
  const lddImplant = processParams.ldd;
  const lddRange = getImplantRange(lddImplant.species, lddImplant.energy);
  const lddRp = lddRange.Rp;
  const ldddRp = thermalDiffusion(lddRange.dRp, annealTemp, annealTime, activation);

  // S/D main implant
  const sdImplant = processParams.sdMain;
  const sdRange = getImplantRange(sdImplant.species, sdImplant.energy);
  const sdRp = sdRange.Rp;
  const sddRp = thermalDiffusion(sdRange.dRp, annealTemp, annealTime, activation);

  // Halo implant (if enabled)
  const haloEnabled = processParams.halo.enabled;
  let haloRp = 0, halodRp = 0;
  if (haloEnabled) {
    const haloImplant = processParams.halo;
    const haloRange = getImplantRange(haloImplant.species, haloImplant.energy);
    haloRp = haloRange.Rp;
    halodRp = thermalDiffusion(haloRange.dRp, annealTemp, annealTime, activation);
  }

  for (let j = 0; j < nz; j++) {
    const zVal = z[j];

    for (let i = 0; i < nx; i++) {
      const xVal = x[i];
      const absX = Math.abs(xVal);
      const idx = j * nx + i;

      let nd = 0;
      let na = 0;

      // Background well doping
      if (isNMOS) {
        na = Nwell;
      } else {
        nd = Nwell;
      }

      // VT adjust (under gate only)
      if (absX < gateEdge) {
        const vtConc = gaussianProfile(zVal, vtRp, vtdRp, vtImplant.dose);
        if (isNMOS) {
          // Boron for nMOS VT adjust
          na += vtConc * activation;
        } else {
          // Arsenic/Phosphorus for pMOS VT adjust
          nd += vtConc * activation;
        }
      }

      // Halo (pocket implant, angled - simplified as lateral extension)
      if (haloEnabled && absX > gateEdge - 10 && absX < gateEdge + 20) {
        const haloConc = gaussianProfile(zVal, haloRp, halodRp, processParams.halo.dose);
        const lateralFactor = Math.exp(-Math.pow((absX - gateEdge) / 15, 2));
        if (isNMOS) {
          na += haloConc * activation * lateralFactor;
        } else {
          nd += haloConc * activation * lateralFactor;
        }
      }

      // LDD (between gate edge and spacer edge)
      if (absX > gateEdge && absX < spacerEdge + 10) {
        const lddConc = gaussianProfile(zVal, lddRp, ldddRp, lddImplant.dose);
        const lateralFactor = absX < spacerEdge
          ? (absX - gateEdge) / spacerWidth
          : Math.exp(-Math.pow((absX - spacerEdge) / 10, 2));

        if (isNMOS) {
          nd += lddConc * activation * lateralFactor;
        } else {
          na += lddConc * activation * lateralFactor;
        }
      }

      // S/D main (outside spacer)
      if (absX > spacerEdge) {
        const sdConc = gaussianProfile(zVal, sdRp, sddRp, sdImplant.dose);
        if (isNMOS) {
          nd += sdConc * activation;
        } else {
          na += sdConc * activation;
        }
      }

      Nd[idx] = nd;
      Na[idx] = na;
      Nnet[idx] = nd - na;
    }
  }

  return { x, z, nx, nz, Nd, Na, Nnet };
}

/**
 * Main doping engine class
 */
export class DopingEngine {
  static generateVertical1D = generateVerticalProfile1D;
  static generateLateral1D = generateLateralProfile1D;
  static generate2D_Device = generateDopingProfile2D_Device;
  static generate2D_Process = generateDopingProfile2D_Process;
}
