/**
 * Level C Simulation Hook
 *
 * Provides interface for running Level C numerical simulations
 * using the Web Worker.
 */

import { useCallback, useState } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useSimulationStore } from '../store/simulationStore';
import { useWorker, WorkerState } from './useWorker';
import { DopingEngine } from '../physics/doping';
import type { PointUpdate } from '../physics/levelC/worker';

export interface LevelCState {
  workerState: WorkerState;
  sweepPoints: { V: number; Id: number }[];
  isRunning: boolean;
}

export interface UseLevelCReturn {
  state: LevelCState;
  runSinglePoint: () => Promise<void>;
  runSweep: (type: 'transfer' | 'output', fixedV: number, range: { start: number; end: number; points: number }) => Promise<void>;
  cancel: () => void;
}

export function useLevelC(): UseLevelCReturn {
  const { deviceType, deviceParams, bias, temperature, useGPU } = useDeviceStore();
  const { setResult, setStatus, setProgress } = useSimulationStore();
  const { state: workerState, gpuAvailableInWorker, solve, sweep, cancel } = useWorker();

  const [sweepPoints, setSweepPoints] = useState<{ V: number; Id: number }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSinglePoint = useCallback(async () => {
    const startTime = performance.now();
    setIsRunning(true);
    setStatus('computing');

    try {
      const biasObj = { Vgs: bias.vgs, Vds: bias.vds, Vbs: bias.vbs };
      const shouldUseGPU = useGPU && gpuAvailableInWorker;
      const result = await solve(deviceParams, deviceType, biasObj, temperature, shouldUseGPU);

      // Generate doping profiles
      const doping1d = DopingEngine.generateVertical1D(deviceParams, deviceType);
      const dopingLateral1d = DopingEngine.generateLateral1D(deviceParams, deviceType, 10);
      const doping2d = DopingEngine.generate2D_Device(deviceParams, deviceType);

      setResult({
        numerical2d: result.numerical2d,
        doping1d,
        dopingLateral1d,
        doping2d,
        metrics: {
          Vth: 0, // Would need to extract from I-V
          SS: 0,
          Ion: result.Id,
          Ioff: 0,
          IonIoffRatio: 0,
        },
        calcTime: performance.now() - startTime,
        status: 'done',
        error: null,
      });
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : String(err),
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [deviceType, deviceParams, bias, temperature, useGPU, gpuAvailableInWorker, solve, setResult, setStatus]);

  const runSweep = useCallback(async (
    type: 'transfer' | 'output',
    fixedV: number,
    range: { start: number; end: number; points: number }
  ) => {
    const startTime = performance.now();
    setIsRunning(true);
    setStatus('computing');
    setSweepPoints([]);

    const onPoint = (point: PointUpdate) => {
      setSweepPoints(prev => [...prev, { V: point.V, Id: point.Id }]);
      setProgress(point.index / point.total);
    };

    const shouldUseGPU = useGPU && gpuAvailableInWorker;

    try {
      const result = await sweep(
        deviceParams,
        deviceType,
        type,
        fixedV,
        range,
        temperature,
        onPoint,
        shouldUseGPU
      );

      // Generate doping profiles
      const doping1d = DopingEngine.generateVertical1D(deviceParams, deviceType);
      const dopingLateral1d = DopingEngine.generateLateral1D(deviceParams, deviceType, 10);
      const doping2d = DopingEngine.generate2D_Device(deviceParams, deviceType);

      // Build IV result
      const ivResult = type === 'transfer'
        ? {
            output: [],
            transfer: [{
              label: `Vds=${fixedV}V`,
              x: result.V,
              y: result.Id,
            }],
            transferLog: [{
              label: `Vds=${fixedV}V`,
              x: result.V,
              y: result.Id.map(i => Math.log10(Math.abs(i) + 1e-15)),
            }],
          }
        : {
            output: [{
              label: `Vgs=${fixedV}V`,
              x: result.V,
              y: result.Id,
            }],
            transfer: [],
            transferLog: [],
          };

      // Extract metrics from transfer sweep
      let Vth = 0;
      let SS = 60;
      let Ion = 0;
      let Ioff = 1e-12;

      if (type === 'transfer' && result.V.length > 10) {
        // Find Vth using constant current method
        const Ith = 1e-7 * (deviceParams.geometry.width / deviceParams.gate.length);
        for (let i = 0; i < result.Id.length; i++) {
          if (Math.abs(result.Id[i]) >= Ith) {
            Vth = result.V[i];
            break;
          }
        }

        // Find SS
        let minSS = Infinity;
        for (let i = 1; i < result.Id.length - 1; i++) {
          const dV = result.V[i + 1] - result.V[i - 1];
          const dLogI = Math.log10(Math.abs(result.Id[i + 1]) + 1e-15) -
                        Math.log10(Math.abs(result.Id[i - 1]) + 1e-15);
          if (dLogI > 0.1) {
            const ss = dV / dLogI * 1000; // mV/dec
            minSS = Math.min(minSS, ss);
          }
        }
        SS = minSS < Infinity ? minSS : 60;

        // Ion/Ioff
        Ion = Math.abs(result.Id[result.Id.length - 1]);
        Ioff = Math.abs(result.Id[0]) || 1e-15;
      }

      setResult({
        iv: ivResult,
        doping1d,
        dopingLateral1d,
        doping2d,
        metrics: {
          Vth,
          SS,
          Ion,
          Ioff,
          IonIoffRatio: Ion / Ioff,
        },
        calcTime: performance.now() - startTime,
        status: 'done',
        error: null,
      });
    } catch (err) {
      if ((err as Error).message !== 'Cancelled') {
        setResult({
          error: err instanceof Error ? err.message : String(err),
          status: 'error',
        });
      }
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, [deviceType, deviceParams, temperature, useGPU, gpuAvailableInWorker, sweep, setResult, setStatus, setProgress]);

  return {
    state: {
      workerState,
      sweepPoints,
      isRunning,
    },
    runSinglePoint,
    runSweep,
    cancel,
  };
}
