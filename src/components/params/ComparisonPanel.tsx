/**
 * Comparison Panel
 *
 * UI for managing parameter snapshots and comparison mode
 */

import { useDeviceStore, useSimulationStore } from '../../store';
import { useComparisonStore } from '../../store/comparisonStore';
import styles from './ComparisonPanel.module.css';

export function ComparisonPanel() {
  const {
    deviceType,
    deviceParams,
    bias,
    temperature,
  } = useDeviceStore();

  const { iv, cv, metrics } = useSimulationStore();

  const {
    snapshots,
    compareMode,
    selectedIds,
    maxSnapshots,
    addSnapshot,
    removeSnapshot,
    toggleCompareMode,
    toggleSelected,
    clearSnapshots,
  } = useComparisonStore();

  const handleSaveSnapshot = () => {
    const name = `Snapshot ${snapshots.length + 1}`;
    addSnapshot({
      name,
      deviceType,
      deviceParams,
      bias,
      temperature,
      iv,
      cv,
      metrics,
    });
  };

  const canSave = snapshots.length < maxSnapshots && iv !== null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Comparison</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={compareMode}
            onChange={toggleCompareMode}
            disabled={snapshots.length === 0}
          />
          Compare
        </label>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          onClick={handleSaveSnapshot}
          disabled={!canSave}
          title={!canSave ? (snapshots.length >= maxSnapshots ? 'Max snapshots reached' : 'Run simulation first') : 'Save current state'}
        >
          + Save Snapshot
        </button>
        {snapshots.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={clearSnapshots}
            title="Clear all snapshots"
          >
            Clear All
          </button>
        )}
      </div>

      {snapshots.length === 0 ? (
        <div className={styles.empty}>
          No snapshots saved.
          <br />
          Save snapshots to compare different parameter sets.
        </div>
      ) : (
        <div className={styles.snapshotList}>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className={styles.snapshotItem}>
              <label className={styles.snapshotLabel}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(snapshot.id)}
                  onChange={() => toggleSelected(snapshot.id)}
                />
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: snapshot.color }}
                />
                <span className={styles.snapshotName}>{snapshot.name}</span>
              </label>
              <div className={styles.snapshotInfo}>
                <span>{snapshot.deviceType.toUpperCase()}</span>
                <span>L={snapshot.deviceParams.gate.length}nm</span>
                <span>Vth={snapshot.metrics?.Vth?.toFixed(3) || '-'}V</span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => removeSnapshot(snapshot.id)}
                title="Remove snapshot"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {compareMode && selectedIds.length > 0 && (
        <div className={styles.compareInfo}>
          Comparing {selectedIds.length} snapshot(s) - check I-V plot
        </div>
      )}
    </div>
  );
}
