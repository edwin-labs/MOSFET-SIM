/**
 * Level C Simulation Controls
 *
 * Provides UI for running Level C numerical simulations:
 * - Single point solve
 * - I-V sweep with real-time progress
 * - Cancel button
 */

import { useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { useLevelC } from '../../hooks/useLevelC';
import styles from './LevelCControls.module.css';

export function LevelCControls() {
  const { level } = useDeviceStore();
  const { state, runSinglePoint, runSweep, cancel } = useLevelC();

  const [sweepType, setSweepType] = useState<'transfer' | 'output'>('transfer');
  const [fixedV, setFixedV] = useState(1.0);
  const [startV, setStartV] = useState(0);
  const [endV, setEndV] = useState(1.2);
  const [points, setPoints] = useState(25);

  if (level !== 'C') {
    return null;
  }

  const handleRunSingle = async () => {
    await runSinglePoint();
  };

  const handleRunSweep = async () => {
    await runSweep(sweepType, fixedV, { start: startV, end: endV, points });
  };

  const progress = state.workerState.progress;
  const progressPercent = progress
    ? Math.round((progress.iteration / progress.maxIter) * 100)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Level C Simulation</span>
        <span className={styles.status}>
          {state.workerState.status === 'running' ? 'Running...' : 'Ready'}
        </span>
      </div>

      {state.isRunning && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {progress?.phase || 'Initializing'} - {progressPercent}%
          </div>
          {state.sweepPoints.length > 0 && (
            <div className={styles.pointCount}>
              Points: {state.sweepPoints.length} / {points}
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Single Point</div>
        <button
          className={styles.runButton}
          onClick={handleRunSingle}
          disabled={state.isRunning}
        >
          Run Single Solve
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>I-V Sweep</div>

        <div className={styles.inputGroup}>
          <label>Sweep Type:</label>
          <select
            value={sweepType}
            onChange={(e) => setSweepType(e.target.value as 'transfer' | 'output')}
            disabled={state.isRunning}
          >
            <option value="transfer">Transfer (Id vs Vgs)</option>
            <option value="output">Output (Id vs Vds)</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>{sweepType === 'transfer' ? 'Vds:' : 'Vgs:'}</label>
          <input
            type="number"
            value={fixedV}
            onChange={(e) => setFixedV(Number(e.target.value))}
            step={0.1}
            disabled={state.isRunning}
          />
          <span className={styles.unit}>V</span>
        </div>

        <div className={styles.inputGroup}>
          <label>Start V:</label>
          <input
            type="number"
            value={startV}
            onChange={(e) => setStartV(Number(e.target.value))}
            step={0.1}
            disabled={state.isRunning}
          />
          <span className={styles.unit}>V</span>
        </div>

        <div className={styles.inputGroup}>
          <label>End V:</label>
          <input
            type="number"
            value={endV}
            onChange={(e) => setEndV(Number(e.target.value))}
            step={0.1}
            disabled={state.isRunning}
          />
          <span className={styles.unit}>V</span>
        </div>

        <div className={styles.inputGroup}>
          <label>Points:</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Math.max(5, Math.min(100, Number(e.target.value))))}
            min={5}
            max={100}
            disabled={state.isRunning}
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.runButton}
            onClick={handleRunSweep}
            disabled={state.isRunning}
          >
            Run Sweep
          </button>
          {state.isRunning && (
            <button className={styles.cancelButton} onClick={cancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {state.workerState.error && (
        <div className={styles.error}>{state.workerState.error}</div>
      )}

      <div className={styles.info}>
        <p>Level C uses numerical Poisson-DD solver.</p>
        <p>Mesh: ~100x100, BiCGSTAB linear solver.</p>
        <p>Sweep time: ~30-60s for 25 points.</p>
      </div>
    </div>
  );
}
