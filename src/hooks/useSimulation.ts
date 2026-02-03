import { useEffect, useRef, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useSimulationStore } from '../store/simulationStore';
import { useViewStore } from '../store/viewStore';
import { LevelAEngine } from '../physics/levelA';
import { LevelBEngine } from '../physics/levelB';
import { DopingEngine } from '../physics/doping';

const levelAEngine = new LevelAEngine();
const levelBEngine = new LevelBEngine();

export function useSimulation() {
  const timerRef = useRef<number | null>(null);

  const { deviceType, level, deviceParams, bias, temperature } = useDeviceStore();
  const { setResult, setStatus } = useSimulationStore();
  const { autoSimulate } = useViewStore();

  const runCalculation = useCallback(() => {
    const startTime = performance.now();

    try {
      setStatus('computing');

      if (level === 'A') {
        const result = levelAEngine.fullCalculation(
          deviceType,
          deviceParams,
          bias,
          temperature
        );

        // Generate doping profiles
        const doping1d = DopingEngine.generateVertical1D(deviceParams, deviceType);
        const dopingLateral1d = DopingEngine.generateLateral1D(deviceParams, deviceType, 10);
        const doping2d = DopingEngine.generate2D_Device(deviceParams, deviceType);

        setResult({
          ...result,
          doping1d,
          dopingLateral1d,
          doping2d,
          gm: null,
          gds: null,
          calcTime: performance.now() - startTime,
          status: 'done',
          error: null,
        });
      } else if (level === 'B') {
        const result = levelBEngine.fullCalculation(
          deviceType,
          deviceParams,
          bias,
          temperature
        );

        // Generate doping profiles
        const doping1d = DopingEngine.generateVertical1D(deviceParams, deviceType);
        const dopingLateral1d = DopingEngine.generateLateral1D(deviceParams, deviceType, 10);
        const doping2d = DopingEngine.generate2D_Device(deviceParams, deviceType);

        setResult({
          iv: result.iv,
          cv: result.cv,
          band: result.band,
          metrics: result.metrics,
          depletionWidth: result.depletionWidth,
          gm: result.gm,
          gds: result.gds,
          doping1d,
          dopingLateral1d,
          doping2d,
          calcTime: performance.now() - startTime,
          status: 'done',
          error: null,
        });
      } else {
        // Level C - would use Web Worker
        setStatus('idle');
        setResult({
          error: 'Level C not yet implemented',
          status: 'error',
        });
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : String(err),
        status: 'error',
      });
    }
  }, [deviceType, level, deviceParams, bias, temperature, setResult, setStatus]);

  // Auto-calculate on parameter changes (with debounce)
  useEffect(() => {
    if (!autoSimulate) return;
    if (level === 'C') return; // Level C requires manual trigger

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(runCalculation, 50);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [deviceType, level, deviceParams, bias, temperature, autoSimulate, runCalculation]);

  // Run immediately on mount
  useEffect(() => {
    runCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { runCalculation };
}
