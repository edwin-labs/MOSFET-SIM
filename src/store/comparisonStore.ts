/**
 * Comparison Store
 *
 * Manages saved parameter snapshots for comparison
 */

import { create } from 'zustand';
import type { DeviceParams, BiasConditions, DeviceType } from '../types/device';
import type { IVResult, CVResult, DeviceMetrics } from '../types/simulation';

export interface ComparisonSnapshot {
  id: string;
  name: string;
  timestamp: number;
  deviceType: DeviceType;
  deviceParams: DeviceParams;
  bias: BiasConditions;
  temperature: number;
  iv: IVResult | null;
  cv: CVResult | null;
  metrics: DeviceMetrics | null;
  color: string;
}

interface ComparisonStore {
  snapshots: ComparisonSnapshot[];
  compareMode: boolean;
  selectedIds: string[];
  maxSnapshots: number;

  addSnapshot: (snapshot: Omit<ComparisonSnapshot, 'id' | 'timestamp' | 'color'>) => void;
  removeSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  toggleCompareMode: () => void;
  toggleSelected: (id: string) => void;
  clearSnapshots: () => void;
}

const COMPARISON_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

let colorIndex = 0;

function getNextColor(): string {
  const color = COMPARISON_COLORS[colorIndex % COMPARISON_COLORS.length];
  colorIndex++;
  return color;
}

function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useComparisonStore = create<ComparisonStore>((set) => ({
  snapshots: [],
  compareMode: false,
  selectedIds: [],
  maxSnapshots: 8,

  addSnapshot: (snapshot) =>
    set((state) => {
      if (state.snapshots.length >= state.maxSnapshots) {
        return state; // Don't add if max reached
      }
      const newSnapshot: ComparisonSnapshot = {
        ...snapshot,
        id: generateId(),
        timestamp: Date.now(),
        color: getNextColor(),
      };
      return {
        snapshots: [...state.snapshots, newSnapshot],
        selectedIds: [...state.selectedIds, newSnapshot.id],
      };
    }),

  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  renameSnapshot: (id, name) =>
    set((state) => ({
      snapshots: state.snapshots.map((s) => (s.id === id ? { ...s, name } : s)),
    })),

  toggleCompareMode: () =>
    set((state) => ({
      compareMode: !state.compareMode,
    })),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  clearSnapshots: () =>
    set({
      snapshots: [],
      selectedIds: [],
      compareMode: false,
    }),
}));
