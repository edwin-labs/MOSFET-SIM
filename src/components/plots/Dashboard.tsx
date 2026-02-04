import { useSimulationStore, useDeviceStore } from '../../store';
import { formatCurrent, formatVoltage, formatRatio } from '../../utils/format';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { metrics, calcTime, status } = useSimulationStore();
  const { deviceType, modelType } = useDeviceStore();

  if (!metrics) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.placeholder}>
          {status === 'computing' ? 'Computing...' : 'No data available'}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Threshold Voltage',
      symbol: 'Vth',
      value: formatVoltage(metrics.Vth),
      description: 'Constant current method',
    },
    {
      label: 'Subthreshold Swing',
      symbol: 'SS',
      value: `${metrics.SS.toFixed(1)} mV/dec`,
      description: 'Minimum slope',
    },
    {
      label: 'On-State Current',
      symbol: 'Ion',
      value: formatCurrent(metrics.Ion),
      description: `Vgs=Vds=${deviceType === 'nmos' ? '1V' : '-1V'}`,
    },
    {
      label: 'Off-State Current',
      symbol: 'Ioff',
      value: formatCurrent(metrics.Ioff),
      description: `Vgs=0, Vds=${deviceType === 'nmos' ? '1V' : '-1V'}`,
    },
    {
      label: 'On/Off Ratio',
      symbol: 'Ion/Ioff',
      value: formatRatio(metrics.IonIoffRatio),
      description: 'Current ratio',
    },
  ];

  if (metrics.DIBL !== undefined) {
    cards.push({
      label: 'DIBL',
      symbol: 'DIBL',
      value: `${metrics.DIBL.toFixed(1)} mV/V`,
      description: 'Drain-induced barrier lowering',
    });
  }

  if (metrics.gmMax !== undefined) {
    cards.push({
      label: 'Peak Transconductance',
      symbol: 'gm,max',
      value: `${(metrics.gmMax * 1e6).toFixed(2)} uS`,
      description: 'Maximum gm',
    });
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <span className={styles.info}>
          {modelType === 'compact' ? 'Compact' : 'Numerical'} | {calcTime.toFixed(1)} ms
        </span>
      </div>

      <div className={styles.cards}>
        {cards.map((card) => (
          <div key={card.symbol} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>{card.label}</span>
              <span className={styles.cardSymbol}>{card.symbol}</span>
            </div>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardDescription}>{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
