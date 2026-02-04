import { useEffect, useRef, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useSimulationStore } from '../store/simulationStore';
import { useViewStore } from '../store/viewStore';
import { CompactEngine } from '../physics/compactEngine';
import { DopingEngine } from '../physics/doping';

const compactEngine = new CompactEngine();

export function useSimulation() {
  const timerRef = useRef<number | null>(null);

  const { deviceType, modelType, compactEffects, deviceParams, bias, temperature } = useDeviceStore();
  const { setResult, setStatus } = useSimulationStore();
  const { autoSimulate } = useViewStore();

  const runCalculation = useCallback(() => {
    const startTime = performance.now();

    try {
      setStatus('computing');

      if (modelType === 'compact') {
        // Update engine with current effects
        compactEngine.setEffects(compactEffects);

        const result = compactEngine.fullCalculation(
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
        // Numerical model - uses Web Worker
        setStatus('idle');
        setResult({
          error: 'Numerical model not yet implemented',
          status: 'error',
        });
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : String(err),
        status: 'error',
      });
    }
  }, [deviceType, modelType, compactEffects, deviceParams, bias, temperature, setResult, setStatus]);

  // Auto-calculate on parameter changes (with debounce)
  useEffect(() => {
    if (!autoSimulate) return;
    if (modelType === 'numerical') return; // Numerical model requires manual trigger

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(runCalculation, 50);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [deviceType, modelType, compactEffects, deviceParams, bias, temperature, autoSimulate, runCalculation]);

  // Run immediately on mount
  useEffect(() => {
    runCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { runCalculation };
}
