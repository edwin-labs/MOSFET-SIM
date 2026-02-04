import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore, useComparisonStore } from '../../store';
import styles from './Plots.module.css';

export function IVPlot() {
  const { iv, operatingPoint } = useSimulationStore();
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
    margin: { t: 10, r: 10, b: 50, l: 50 },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0.5,
      xanchor: 'center' as const,
      y: -0.25,
      yanchor: 'top' as const,
      font: { size: 8 },
      bgcolor: isDark ? 'rgba(26,26,46,0.8)' : 'rgba(255,255,255,0.8)',
    },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputTraces: any[] = iv.output.map((curve, i) => ({
    x: curve.x,
    y: curve.y.map((v) => Math.abs(v) * 1e6), // Convert to uA
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.label,
    line: { color: colors[i % colors.length], width: 1.5 },
  }));

  // Add operating point marker on output plot
  if (operatingPoint) {
    outputTraces.push({
      x: [operatingPoint.vds],
      y: [Math.abs(operatingPoint.id) * 1e6],
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Bias',
      marker: { color: '#ff4444', size: 10, symbol: 'circle' },
      showlegend: true,
    });
  }

  // Transfer characteristics (Id vs Vgs, log scale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transferLogTraces: any[] = iv.transferLog.map((curve, i) => ({
    x: curve.x,
    y: curve.y,
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.label,
    line: { color: colors[i % colors.length], width: 1.5 },
  }));

  // Add operating point marker on transfer plot
  if (operatingPoint) {
    const absId = Math.abs(operatingPoint.id);
    transferLogTraces.push({
      x: [operatingPoint.vgs],
      y: [absId > 1e-18 ? absId : 1e-18],
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Bias',
      marker: { color: '#ff4444', size: 10, symbol: 'circle' },
      showlegend: true,
    });
  }

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
        });
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
