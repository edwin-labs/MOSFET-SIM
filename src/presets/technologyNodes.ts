/**
 * Technology Node Presets
 *
 * Typical device parameters for common technology nodes:
 * 180nm, 90nm, 45nm, 28nm
 */

import type { DeviceParams, BiasConditions } from '../types/device';

export type TechnologyNode = '180nm' | '90nm' | '45nm' | '28nm' | 'custom';

export interface TechNodePreset {
  name: string;
  description: string;
  vdd: number;
  nmos: DeviceParams;
  pmos: DeviceParams;
  nmosBias: BiasConditions;
  pmosBias: BiasConditions;
}

export const TECHNOLOGY_PRESETS: Record<Exclude<TechnologyNode, 'custom'>, TechNodePreset> = {
  '180nm': {
    name: '180nm',
    description: '0.18um (1999) - 1.8V VDD',
    vdd: 1.8,
    nmos: {
      gate: {
        oxideMaterial: 'SiO2',
        tox: 4,
        gateMaterial: 'poly-n',
        workFunction: 4.15,
        length: 180,
      },
      channel: {
        doping: 2e17,
        profileType: 'uniform',
      },
      sourceDrain: {
        doping: 5e19,
        junctionDepth: 80,
        lddDoping: 2e18,
        lddLength: 40,
      },
      substrate: {
        type: 'p-type',
        doping: 5e16,
      },
      geometry: {
        width: 1000,
        overlapLength: 10,
      },
      advanced: {
        fixedCharge: 0,
        interfaceTrapDensity: 1e10,
        seriesResistanceS: 50,
        seriesResistanceD: 50,
      },
    },
    pmos: {
      gate: {
        oxideMaterial: 'SiO2',
        tox: 4,
        gateMaterial: 'poly-p',
        workFunction: 5.25,
        length: 180,
      },
      channel: {
        doping: 2e17,
        profileType: 'uniform',
      },
      sourceDrain: {
        doping: 5e19,
        junctionDepth: 80,
        lddDoping: 2e18,
        lddLength: 40,
      },
      substrate: {
        type: 'n-type',
        doping: 5e16,
      },
      geometry: {
        width: 1000,
        overlapLength: 10,
      },
      advanced: {
        fixedCharge: 0,
        interfaceTrapDensity: 1e10,
        seriesResistanceS: 50,
        seriesResistanceD: 50,
      },
    },
    nmosBias: { vgs: 0.9, vds: 0.9, vbs: 0 },
    pmosBias: { vgs: -0.9, vds: -0.9, vbs: 0 },
  },

  '90nm': {
    name: '90nm',
    description: '90nm (2004) - 1.2V VDD',
    vdd: 1.2,
    nmos: {
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
        interfaceTrapDensity: 5e10,
        seriesResistanceS: 100,
        seriesResistanceD: 100,
      },
    },
    pmos: {
      gate: {
        oxideMaterial: 'SiO2',
        tox: 2,
        gateMaterial: 'poly-p',
        workFunction: 5.25,
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
        type: 'n-type',
        doping: 1e17,
      },
      geometry: {
        width: 1000,
        overlapLength: 5,
      },
      advanced: {
        fixedCharge: 0,
        interfaceTrapDensity: 5e10,
        seriesResistanceS: 100,
        seriesResistanceD: 100,
      },
    },
    nmosBias: { vgs: 0.6, vds: 0.6, vbs: 0 },
    pmosBias: { vgs: -0.6, vds: -0.6, vbs: 0 },
  },

  '45nm': {
    name: '45nm',
    description: '45nm (2007) - 1.0V VDD, High-k/Metal Gate',
    vdd: 1.0,
    nmos: {
      gate: {
        oxideMaterial: 'HfO2',
        tox: 1.5,
        gateMaterial: 'TiN',
        workFunction: 4.5,
        length: 45,
      },
      channel: {
        doping: 1e18,
        profileType: 'retrograde',
      },
      sourceDrain: {
        doping: 2e20,
        junctionDepth: 30,
        lddDoping: 1e19,
        lddLength: 15,
      },
      substrate: {
        type: 'p-type',
        doping: 2e17,
      },
      geometry: {
        width: 1000,
        overlapLength: 3,
      },
      advanced: {
        fixedCharge: 1e11,
        interfaceTrapDensity: 1e11,
        seriesResistanceS: 150,
        seriesResistanceD: 150,
      },
    },
    pmos: {
      gate: {
        oxideMaterial: 'HfO2',
        tox: 1.5,
        gateMaterial: 'TaN',
        workFunction: 4.9,
        length: 45,
      },
      channel: {
        doping: 1e18,
        profileType: 'retrograde',
      },
      sourceDrain: {
        doping: 2e20,
        junctionDepth: 30,
        lddDoping: 1e19,
        lddLength: 15,
      },
      substrate: {
        type: 'n-type',
        doping: 2e17,
      },
      geometry: {
        width: 1000,
        overlapLength: 3,
      },
      advanced: {
        fixedCharge: 1e11,
        interfaceTrapDensity: 1e11,
        seriesResistanceS: 150,
        seriesResistanceD: 150,
      },
    },
    nmosBias: { vgs: 0.5, vds: 0.5, vbs: 0 },
    pmosBias: { vgs: -0.5, vds: -0.5, vbs: 0 },
  },

  '28nm': {
    name: '28nm',
    description: '28nm (2011) - 0.9V VDD, High-k/Metal Gate',
    vdd: 0.9,
    nmos: {
      gate: {
        oxideMaterial: 'HfO2',
        tox: 1.2,
        gateMaterial: 'TiN',
        workFunction: 4.4,
        length: 28,
      },
      channel: {
        doping: 2e18,
        profileType: 'retrograde',
      },
      sourceDrain: {
        doping: 5e20,
        junctionDepth: 20,
        lddDoping: 2e19,
        lddLength: 10,
      },
      substrate: {
        type: 'p-type',
        doping: 5e17,
      },
      geometry: {
        width: 1000,
        overlapLength: 2,
      },
      advanced: {
        fixedCharge: 2e11,
        interfaceTrapDensity: 2e11,
        seriesResistanceS: 200,
        seriesResistanceD: 200,
      },
    },
    pmos: {
      gate: {
        oxideMaterial: 'HfO2',
        tox: 1.2,
        gateMaterial: 'TaN',
        workFunction: 4.85,
        length: 28,
      },
      channel: {
        doping: 2e18,
        profileType: 'retrograde',
      },
      sourceDrain: {
        doping: 5e20,
        junctionDepth: 20,
        lddDoping: 2e19,
        lddLength: 10,
      },
      substrate: {
        type: 'n-type',
        doping: 5e17,
      },
      geometry: {
        width: 1000,
        overlapLength: 2,
      },
      advanced: {
        fixedCharge: 2e11,
        interfaceTrapDensity: 2e11,
        seriesResistanceS: 200,
        seriesResistanceD: 200,
      },
    },
    nmosBias: { vgs: 0.45, vds: 0.45, vbs: 0 },
    pmosBias: { vgs: -0.45, vds: -0.45, vbs: 0 },
  },
};

export function getPresetForNode(
  node: Exclude<TechnologyNode, 'custom'>,
  deviceType: 'nmos' | 'pmos'
): { params: DeviceParams; bias: BiasConditions } {
  const preset = TECHNOLOGY_PRESETS[node];
  return {
    params: deviceType === 'nmos' ? preset.nmos : preset.pmos,
    bias: deviceType === 'nmos' ? preset.nmosBias : preset.pmosBias,
  };
}
