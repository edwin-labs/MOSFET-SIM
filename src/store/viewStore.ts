import { create } from 'zustand';

export type ColormapType =
  | 'structure'
  | 'doping'
  | 'netType'
  | 'potential'
  | 'efield'
  | 'electron'
  | 'hole'
  | 'current'
  | 'recombination';

export type PlotTab = 'iv' | 'cv' | 'band' | 'gmgds' | 'profile' | 'fields' | 'dashboard';

export type Theme = 'dark' | 'light';

interface ViewStore {
  colormap: ColormapType;
  plotTab: PlotTab;
  theme: Theme;
  showDepletion: boolean;
  showWireframe: boolean;
  showCurrentFlow: boolean;
  clipPlaneEnabled: boolean;
  clipPlanePosition: number;
  autoSimulate: boolean;

  setColormap: (colormap: ColormapType) => void;
  setPlotTab: (tab: PlotTab) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleDepletion: () => void;
  toggleWireframe: () => void;
  toggleCurrentFlow: () => void;
  toggleClipPlane: () => void;
  setClipPlanePosition: (position: number) => void;
  setAutoSimulate: (auto: boolean) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  colormap: 'structure',
  plotTab: 'iv',
  theme: 'dark',
  showDepletion: true,
  showWireframe: false,
  showCurrentFlow: false,
  clipPlaneEnabled: false,
  clipPlanePosition: 0.5,
  autoSimulate: true,

  setColormap: (colormap) => set({ colormap }),

  setPlotTab: (plotTab) => set({ plotTab }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),

  setTheme: (theme) => set({ theme }),

  toggleDepletion: () =>
    set((state) => ({
      showDepletion: !state.showDepletion,
    })),

  toggleWireframe: () =>
    set((state) => ({
      showWireframe: !state.showWireframe,
    })),

  toggleCurrentFlow: () =>
    set((state) => ({
      showCurrentFlow: !state.showCurrentFlow,
    })),

  toggleClipPlane: () =>
    set((state) => ({
      clipPlaneEnabled: !state.clipPlaneEnabled,
    })),

  setClipPlanePosition: (clipPlanePosition) => set({ clipPlanePosition }),

  setAutoSimulate: (autoSimulate) => set({ autoSimulate }),
}));
