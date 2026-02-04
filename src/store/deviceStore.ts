import { create } from 'zustand';
import type {
  DeviceType,
  ModelType,
  InputMode,
  DeviceParams,
  ProcessParams,
  BiasConditions,
  AdvancedPhysicsOptions,
  CompactModelEffects,
} from '../types/device';
import { type TechnologyNode, getPresetForNode } from '../presets/technologyNodes';
import { DEFAULT_EFFECTS } from '../physics/compactEngine';

interface DeviceStore {
  deviceType: DeviceType;
  modelType: ModelType;
  compactEffects: CompactModelEffects;
  mode: InputMode;
  temperature: number;
  techNode: TechnologyNode;
  deviceParams: DeviceParams;
  processParams: ProcessParams;
  bias: BiasConditions;
  advancedPhysics: AdvancedPhysicsOptions;

  setDeviceType: (type: DeviceType) => void;
  setModelType: (modelType: ModelType) => void;
  setCompactEffect: (key: keyof CompactModelEffects, value: boolean) => void;
  setAllCompactEffects: (effects: CompactModelEffects) => void;
  setMode: (mode: InputMode) => void;
  setTemperature: (T: number) => void;
  setTechNode: (node: TechnologyNode) => void;
  updateDeviceParam: <K extends keyof DeviceParams>(
    group: K,
    key: keyof DeviceParams[K],
    value: DeviceParams[K][keyof DeviceParams[K]]
  ) => void;
  updateProcessParam: <K extends keyof ProcessParams>(
    group: K,
    key: keyof ProcessParams[K],
    value: ProcessParams[K][keyof ProcessParams[K]]
  ) => void;
  updateBias: (key: keyof BiasConditions, value: number) => void;
  updateAdvancedPhysics: (key: keyof AdvancedPhysicsOptions, value: boolean) => void;
  resetAll: () => void;
}

const DEFAULT_ADVANCED_PHYSICS: AdvancedPhysicsOptions = {
  gateLeakage: false,
  impactIonization: false,
  hotCarrier: false,
  gidl: false,
  selfHeating: false,
  quantumEffects: false,
  polyDepletion: false,
};

const DEFAULT_NMOS_DEVICE_PARAMS: DeviceParams = {
  gate: {
    oxideMaterial: 'SiO2',
    tox: 2,              // nm
    gateMaterial: 'poly-n',
    workFunction: 4.15,  // eV
    length: 90,          // nm
  },
  channel: {
    doping: 5e17,        // cm^-3
    profileType: 'uniform',
  },
  sourceDrain: {
    doping: 1e20,        // cm^-3
    junctionDepth: 50,   // nm
    lddDoping: 5e18,     // cm^-3
    lddLength: 20,       // nm
  },
  substrate: {
    type: 'p-type',
    doping: 1e17,        // cm^-3
  },
  geometry: {
    width: 1000,         // nm
    overlapLength: 5,    // nm
  },
  advanced: {
    fixedCharge: 0,
    interfaceTrapDensity: 0,
    seriesResistanceS: 0,
    seriesResistanceD: 0,
  },
};

const DEFAULT_PMOS_DEVICE_PARAMS: DeviceParams = {
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
    interfaceTrapDensity: 0,
    seriesResistanceS: 0,
    seriesResistanceD: 0,
  },
};

const DEFAULT_PROCESS_PARAMS: ProcessParams = {
  gateStack: {
    oxideMaterial: 'SiO2',
    oxideThickness: 2,
    gateMaterial: 'poly-n',
    gateLength: 90,
    polyDepletion: false,
  },
  well: {
    doping: 1e17,
    depth: 500,
    retrograde: false,
    retrogradePeak: 100,
  },
  vtAdjust: {
    species: 'B',
    dose: 3e12,
    energy: 20,
    profileType: 'gaussian',
  },
  halo: {
    enabled: false,
    species: 'B',
    dose: 5e13,
    energy: 30,
    tiltAngle: 30,
  },
  sdMain: {
    species: 'As',
    dose: 5e15,
    energy: 30,
    depth: 50,
  },
  ldd: {
    species: 'P',
    dose: 1e14,
    energy: 10,
  },
  spacer: {
    width: 30,
    material: 'Si3N4',
  },
  silicide: {
    enabled: true,
    material: 'NiSi',
    thickness: 15,
  },
  anneal: {
    type: 'RTA',
    temperature: 1000,
    time: 10,
    activationRatio: 0.5,
  },
  isolation: {
    type: 'STI',
    stiDepth: 300,
    stiWidth: 100,
    activeWidth: 1000,
  },
};

const DEFAULT_NMOS_BIAS: BiasConditions = {
  vgs: 0.6,
  vds: 0.5,
  vbs: 0,
};

const DEFAULT_PMOS_BIAS: BiasConditions = {
  vgs: -0.6,
  vds: -0.5,
  vbs: 0,
};

export const useDeviceStore = create<DeviceStore>((set) => ({
  deviceType: 'nmos',
  modelType: 'compact',
  compactEffects: DEFAULT_EFFECTS,
  mode: 'device',
  temperature: 300,
  techNode: '90nm',
  deviceParams: DEFAULT_NMOS_DEVICE_PARAMS,
  processParams: DEFAULT_PROCESS_PARAMS,
  bias: DEFAULT_NMOS_BIAS,
  advancedPhysics: DEFAULT_ADVANCED_PHYSICS,

  setDeviceType: (type) =>
    set((state) => {
      if (state.techNode !== 'custom') {
        const preset = getPresetForNode(state.techNode, type);
        return {
          deviceType: type,
          deviceParams: preset.params,
          bias: preset.bias,
          processParams: {
            ...state.processParams,
            gateStack: {
              ...state.processParams.gateStack,
              gateMaterial: type === 'nmos' ? 'poly-n' : 'poly-p',
            },
            vtAdjust: {
              ...state.processParams.vtAdjust,
              species: type === 'nmos' ? 'B' : 'As',
            },
            sdMain: {
              ...state.processParams.sdMain,
              species: type === 'nmos' ? 'As' : 'B',
            },
            ldd: {
              ...state.processParams.ldd,
              species: type === 'nmos' ? 'P' : 'BF2',
            },
          },
        };
      }
      return {
        deviceType: type,
        deviceParams:
          type === 'nmos' ? DEFAULT_NMOS_DEVICE_PARAMS : DEFAULT_PMOS_DEVICE_PARAMS,
        bias: type === 'nmos' ? DEFAULT_NMOS_BIAS : DEFAULT_PMOS_BIAS,
        processParams: {
          ...state.processParams,
          gateStack: {
            ...state.processParams.gateStack,
            gateMaterial: type === 'nmos' ? 'poly-n' : 'poly-p',
          },
          vtAdjust: {
            ...state.processParams.vtAdjust,
            species: type === 'nmos' ? 'B' : 'As',
          },
          sdMain: {
            ...state.processParams.sdMain,
            species: type === 'nmos' ? 'As' : 'B',
          },
          ldd: {
            ...state.processParams.ldd,
            species: type === 'nmos' ? 'P' : 'BF2',
          },
        },
      };
    }),

  setModelType: (modelType) => set({ modelType }),

  setCompactEffect: (key, value) =>
    set((state) => ({
      compactEffects: {
        ...state.compactEffects,
        [key]: value,
      },
    })),

  setAllCompactEffects: (effects) => set({ compactEffects: effects }),

  setMode: (mode) => set({ mode }),

  setTemperature: (temperature) => set({ temperature }),

  setTechNode: (node) =>
    set((state) => {
      if (node === 'custom') {
        return { techNode: node };
      }
      const preset = getPresetForNode(node, state.deviceType);
      return {
        techNode: node,
        deviceParams: preset.params,
        bias: preset.bias,
      };
    }),

  updateDeviceParam: (group, key, value) =>
    set((state) => ({
      techNode: 'custom',
      deviceParams: {
        ...state.deviceParams,
        [group]: {
          ...state.deviceParams[group],
          [key]: value,
        },
      },
    })),

  updateProcessParam: (group, key, value) =>
    set((state) => ({
      processParams: {
        ...state.processParams,
        [group]: {
          ...state.processParams[group],
          [key]: value,
        },
      },
    })),

  updateBias: (key, value) =>
    set((state) => ({
      bias: {
        ...state.bias,
        [key]: value,
      },
    })),

  updateAdvancedPhysics: (key, value) =>
    set((state) => ({
      advancedPhysics: {
        ...state.advancedPhysics,
        [key]: value,
      },
    })),

  resetAll: () =>
    set((state) => ({
      deviceParams:
        state.deviceType === 'nmos'
          ? DEFAULT_NMOS_DEVICE_PARAMS
          : DEFAULT_PMOS_DEVICE_PARAMS,
      bias:
        state.deviceType === 'nmos' ? DEFAULT_NMOS_BIAS : DEFAULT_PMOS_BIAS,
      processParams: DEFAULT_PROCESS_PARAMS,
      temperature: 300,
      advancedPhysics: DEFAULT_ADVANCED_PHYSICS,
    })),
}));
