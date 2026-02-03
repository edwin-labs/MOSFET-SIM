import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore, useComparisonStore } from '../../store';
import styles from './Plots.module.css';

export function IVPlot() {
  const { iv } = useSimulationStore();
  const { theme } = useViewStore();
  const { deviceType } = useDeviceStore();
  const { snapshots, compareMode, selectedIds } = useComparisonStore();

  if (!iv) {
    return <div className={styles.placeholder}>No data</div>;
  }

  const isDark = theme === 'dark';
  const colors = [
    '#4a9eff',
    '#f472b6',
    '#4ade80',
    '#fbbf24',
    '#a78bfa',
    '#f87171',
  ];

  const layoutBase = {
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    font: { color: isDark ? '#e0e0e0' : '#1f2937', size: 10 },
    margin: { t: 30, r: 10, b: 40, l: 50 },
    showlegend: true,
    legend: { x: 1, xanchor: 'right', y: 1, font: { size: 9 } },
    xaxis: {
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
      zerolinecolor: isDark ? '#3a3a5a' : '#d1d5db',
    },
    yaxis: {
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
      zerolinecolor: isDark ? '#3a3a5a' : '#d1d5db',
    },
  };

  // Output characteristics (Id vs Vds)
  const outputTraces = iv.output.map((curve, i) => ({
    x: curve.x,
    y: curve.y.map((v) => Math.abs(v) * 1e6), // Convert to uA
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.label,
    line: { color: colors[i % colors.length], width: 1.5 },
  }));

  // Transfer characteristics (Id vs Vgs, log scale)
  const transferLogTraces = iv.transferLog.map((curve, i) => ({
    x: curve.x,
    y: curve.y,
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.label,
    line: { color: colors[i % colors.length], width: 1.5 },
  }));

  // Add comparison traces if compare mode is enabled
  if (compareMode && selectedIds.length > 0) {
    const selectedSnapshots = snapshots.filter((s) => selectedIds.includes(s.id));

    for (const snapshot of selectedSnapshots) {
      if (!snapshot.iv) continue;

      // Add transfer curve from snapshot (use first curve if multiple)
      if (snapshot.iv.transferLog.length > 0) {
        const curve = snapshot.iv.transferLog[0];
        transferLogTraces.push({
          x: curve.x,
          y: curve.y,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: `${snapshot.name}`,
          line: { color: snapshot.color, width: 2 },
          opacity: 0.7,
        } as typeof transferLogTraces[0]);
      }
    }
  }

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>Output Characteristics</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={outputTraces}
          layout={{
            ...layoutBase,
            xaxis: {
              ...layoutBase.xaxis,
              title: { text: deviceType === 'nmos' ? 'Vds (V)' : 'Vds (V)', font: { size: 10 } },
            },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: '|Id| (uA)', font: { size: 10 } },
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className={styles.plotTitle}>Transfer Characteristics (log)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={transferLogTraces}
          layout={{
            ...layoutBase,
            xaxis: {
              ...layoutBase.xaxis,
              title: { text: 'Vgs (V)', font: { size: 10 } },
            },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: '|Id| (A)', font: { size: 10 } },
              type: 'log',
              exponentformat: 'e',
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
