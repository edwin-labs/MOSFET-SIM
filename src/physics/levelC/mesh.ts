/**
 * 2D Mesh Generator for Drift-Diffusion Simulation
 *
 * Creates a non-uniform structured rectangular mesh with:
 * - Finer spacing near junctions and interfaces
 * - Region identification for different materials
 */

import type { DeviceParams } from '../../types/device';

export interface Mesh2D {
  x: Float64Array;      // x-coordinates (nm)
  z: Float64Array;      // z-coordinates (nm, depth from surface)
  nx: number;           // number of x points
  nz: number;           // number of z points
  dx: Float64Array;     // spacing between x points
  dz: Float64Array;     // spacing between z points
  region: Int32Array;   // region ID at each grid point [nx * nz]
}

export enum RegionType {
  OXIDE = 0,
  CHANNEL = 1,
  SOURCE = 2,
  DRAIN = 3,
  SUBSTRATE = 4,
  LDD_SOURCE = 5,
  LDD_DRAIN = 6,
  GATE = 7,
}

interface MeshOptions {
  minSpacing: number;   // minimum grid spacing (nm), default 0.5
  maxSpacing: number;   // maximum grid spacing (nm), default 5
  growthRatio: number;  // max ratio between adjacent spacings, default 1.3
  xExtent: number;      // total x extent beyond S/D (nm)
  zExtent: number;      // total depth (nm)
}

const DEFAULT_OPTIONS: MeshOptions = {
  minSpacing: 0.5,
  maxSpacing: 5,
  growthRatio: 1.3,
  xExtent: 50,
  zExtent: 150,
};

/**
 * Generate non-uniform 1D mesh with refinement near specified points
 */
function generate1DMesh(
  start: number,
  end: number,
  refinePoints: number[],
  options: MeshOptions
): { coords: number[]; spacing: number[] } {
  const { minSpacing, maxSpacing, growthRatio } = options;
  const coords: number[] = [];
  const spacing: number[] = [];

  // Sort refine points
  const sortedRefine = [...refinePoints].filter(p => p > start && p < end).sort((a, b) => a - b);

  // Function to compute desired spacing at a point
  const desiredSpacing = (x: number): number => {
    let minDist = Math.min(Math.abs(x - start), Math.abs(x - end));
    for (const rp of sortedRefine) {
      minDist = Math.min(minDist, Math.abs(x - rp));
    }
    // Spacing grows with distance from refinement points
    const s = minSpacing + (maxSpacing - minSpacing) * Math.min(1, minDist / 20);
    return Math.max(minSpacing, Math.min(maxSpacing, s));
  };

  // Generate mesh from start to end
  let x = start;
  coords.push(x);

  while (x < end - minSpacing / 2) {
    const ds = desiredSpacing(x);
    // Ensure we don't skip over refinement points
    let nextX = x + ds;

    // Check if we would skip a refinement point
    for (const rp of sortedRefine) {
      if (x < rp && nextX > rp) {
        // Add point at refinement location
        if (rp - x > minSpacing / 2) {
          nextX = rp;
        }
        break;
      }
    }

    // Don't overshoot end
    if (nextX > end) {
      nextX = end;
    }

    // Limit growth ratio
    if (spacing.length > 0) {
      const prevSpacing = spacing[spacing.length - 1];
      const actualSpacing = nextX - x;
      if (actualSpacing > prevSpacing * growthRatio) {
        nextX = x + prevSpacing * growthRatio;
      }
    }

    if (nextX - x < minSpacing / 2 && nextX < end) {
      nextX = x + minSpacing;
    }

    spacing.push(nextX - x);
    x = nextX;
    coords.push(x);
  }

  // Ensure we end exactly at 'end'
  if (Math.abs(coords[coords.length - 1] - end) > 1e-6) {
    coords[coords.length - 1] = end;
    spacing[spacing.length - 1] = end - coords[coords.length - 2];
  }

  return { coords, spacing };
}

/**
 * Generate 2D mesh for MOSFET simulation
 */
export function generateMesh(
  params: DeviceParams,
  options: Partial<MeshOptions> = {}
): Mesh2D {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const L = params.gate.length;
  const tox = params.gate.tox;
  const xj = params.sourceDrain.junctionDepth;
  const lddLen = params.sourceDrain.lddLength;
  const sdLen = 60; // S/D contact length

  // X-direction: center at gate, extend to S/D
  const xMin = -L / 2 - lddLen - sdLen - opts.xExtent;
  const xMax = L / 2 + lddLen + sdLen + opts.xExtent;

  // Refinement points in X (edges of regions)
  const xRefine = [
    -L / 2 - lddLen - sdLen,  // S/D edge
    -L / 2 - lddLen,          // LDD edge
    -L / 2,                    // Gate edge (source side)
    0,                         // Channel center
    L / 2,                     // Gate edge (drain side)
    L / 2 + lddLen,           // LDD edge
    L / 2 + lddLen + sdLen,   // S/D edge
  ];

  // Z-direction: from oxide surface to bulk
  const zMin = -tox;  // Top of oxide (gate contact)
  const zMax = opts.zExtent;

  // Refinement points in Z
  const zRefine = [
    0,              // Si surface (oxide-Si interface)
    xj * 0.3,       // Channel implant peak
    xj * 0.7,       // Near junction
    xj,             // Junction depth
    xj * 1.5,       // Below junction
  ];

  // Generate 1D meshes
  const xMesh = generate1DMesh(xMin, xMax, xRefine, opts);
  const zMesh = generate1DMesh(zMin, zMax, zRefine, opts);

  const nx = xMesh.coords.length;
  const nz = zMesh.coords.length;

  // Convert to typed arrays
  const x = new Float64Array(xMesh.coords);
  const z = new Float64Array(zMesh.coords);
  const dx = new Float64Array(xMesh.spacing);
  const dz = new Float64Array(zMesh.spacing);

  // Assign regions
  const region = new Int32Array(nx * nz);

  const gateEdge = L / 2;
  const lddEdge = gateEdge + lddLen;
  const sdEdge = lddEdge + sdLen;

  for (let j = 0; j < nz; j++) {
    const zVal = z[j];

    for (let i = 0; i < nx; i++) {
      const xVal = x[i];
      const absX = Math.abs(xVal);
      const idx = j * nx + i;

      // Oxide region (above Si surface)
      if (zVal < 0) {
        if (absX <= gateEdge) {
          region[idx] = RegionType.GATE;
        } else {
          region[idx] = RegionType.OXIDE;
        }
        continue;
      }

      // Silicon regions
      if (absX <= gateEdge) {
        // Under gate - channel or substrate
        region[idx] = zVal < xj ? RegionType.CHANNEL : RegionType.SUBSTRATE;
      } else if (absX <= lddEdge) {
        // LDD region
        if (zVal < xj * 0.7) {
          region[idx] = xVal < 0 ? RegionType.LDD_SOURCE : RegionType.LDD_DRAIN;
        } else {
          region[idx] = RegionType.SUBSTRATE;
        }
      } else if (absX <= sdEdge) {
        // S/D region
        if (zVal < xj) {
          region[idx] = xVal < 0 ? RegionType.SOURCE : RegionType.DRAIN;
        } else {
          region[idx] = RegionType.SUBSTRATE;
        }
      } else {
        // Beyond S/D - substrate
        region[idx] = RegionType.SUBSTRATE;
      }
    }
  }

  return { x, z, nx, nz, dx, dz, region };
}

/**
 * Get the index in the flattened array for (i, j) coordinates
 */
export function meshIndex(i: number, j: number, nx: number): number {
  return j * nx + i;
}

/**
 * Check if a point is in the silicon region (not oxide/gate)
 */
export function isInSilicon(region: RegionType): boolean {
  return region !== RegionType.OXIDE && region !== RegionType.GATE;
}

/**
 * Check if a point is in an N-type region (for nMOS)
 */
export function isNType(region: RegionType, isNMOS: boolean): boolean {
  if (isNMOS) {
    return region === RegionType.SOURCE ||
           region === RegionType.DRAIN ||
           region === RegionType.LDD_SOURCE ||
           region === RegionType.LDD_DRAIN;
  } else {
    return region === RegionType.CHANNEL || region === RegionType.SUBSTRATE;
  }
}

/**
 * Get doping concentration at a mesh point
 */
export function getDoping(
  region: RegionType,
  params: DeviceParams,
  isNMOS: boolean,
  z: number
): { Nd: number; Na: number } {
  const Nsub = params.substrate.doping;
  const Nsd = params.sourceDrain.doping;
  const Nldd = params.sourceDrain.lddDoping;
  const Nch = params.channel.doping;
  const xj = params.sourceDrain.junctionDepth;

  // Depth factor for junction profile
  const depthFactor = z < xj ? Math.exp(-Math.pow(z / xj, 2) * 2) : Math.exp(-z / xj);

  let Nd = 0;
  let Na = 0;

  switch (region) {
    case RegionType.SUBSTRATE:
      if (isNMOS) {
        Na = Nsub;
      } else {
        Nd = Nsub;
      }
      break;

    case RegionType.CHANNEL:
      if (isNMOS) {
        Na = Nsub + Nch * Math.exp(-Math.pow((z - xj * 0.3) / (xj * 0.2), 2));
      } else {
        Nd = Nsub + Nch * Math.exp(-Math.pow((z - xj * 0.3) / (xj * 0.2), 2));
      }
      break;

    case RegionType.SOURCE:
    case RegionType.DRAIN:
      if (isNMOS) {
        Nd = Nsd * depthFactor;
        Na = Nsub;
      } else {
        Na = Nsd * depthFactor;
        Nd = Nsub;
      }
      break;

    case RegionType.LDD_SOURCE:
    case RegionType.LDD_DRAIN:
      if (isNMOS) {
        Nd = Nldd * depthFactor;
        Na = Nsub;
      } else {
        Na = Nldd * depthFactor;
        Nd = Nsub;
      }
      break;

    default:
      // Oxide/Gate - no doping
      break;
  }

  return { Nd, Na };
}
