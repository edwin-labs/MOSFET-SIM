import { useSimulationStore, useDeviceStore } from '../../store';
import { formatVoltage, formatCurrent } from '../../utils/format';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const { status, calcTime, metrics, error } = useSimulationStore();
  const { deviceType, level } = useDeviceStore();

  return (
    <div className={styles.statusBar}>
      <div className={styles.item}>
        <span className={`${styles.statusDot} ${styles[status]}`} />
        <span className={styles.label}>Status:</span>
        <span
          className={`${styles.value} ${status === 'computing' ? styles.computing : ''} ${status === 'error' ? styles.error : ''}`}
        >
          {status === 'computing' ? 'Computing...' : status}
        </span>
      </div>

      <div className={styles.item}>
        <span className={styles.label}>Level:</span>
        <span className={styles.value}>{level}</span>
      </div>

      <div className={styles.item}>
        <span className={styles.label}>Device:</span>
        <span
          className={`${styles.value} ${deviceType === 'nmos' ? styles.nmos : styles.pmos}`}
        >
          {deviceType.toUpperCase()}
        </span>
      </div>

      {calcTime > 0 && (
        <div className={styles.item}>
          <span className={styles.label}>Calc Time:</span>
          <span className={styles.value}>{calcTime.toFixed(1)} ms</span>
        </div>
      )}

      {metrics && (
        <>
          <div className={styles.item}>
            <span className={styles.label}>Vth:</span>
            <span className={styles.value}>{formatVoltage(metrics.Vth)}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>SS:</span>
            <span className={styles.value}>{metrics.SS.toFixed(1)} mV/dec</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>Ion:</span>
            <span className={styles.value}>{formatCurrent(metrics.Ion)}</span>
          </div>
        </>
      )}

      {error && (
        <div className={styles.item}>
          <span className={`${styles.value} ${styles.error}`}>{error}</span>
        </div>
      )}
    </div>
  );
}
