import { create } from 'zustand';
import type { SimulationState, SimulationStatus } from '../types/simulation';

interface SimulationStore extends SimulationState {
  setResult: (partial: Partial<SimulationState>) => void;
  setStatus: (status: SimulationStatus) => void;
  setProgress: (progress: number) => void;
  clearResults: () => void;
}

const initialState: SimulationState = {
  status: 'idle',
  progress: 0,
  calcTime: 0,
  iv: null,
  cv: null,
  band: null,
  doping1d: null,
  doping2d: null,
  dopingLateral1d: null,
  numerical2d: null,
  metrics: null,
  gm: null,
  gds: null,
  error: null,
  depletionWidth: 0,
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  ...initialState,

  setResult: (partial) =>
    set((state) => ({
      ...state,
      ...partial,
    })),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress }),

  clearResults: () => set(initialState),
}));
