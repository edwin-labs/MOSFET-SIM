import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore } from '../../store';
import styles from './Plots.module.css';

export function BandDiagram() {
  const { band } = useSimulationStore();
  const { theme } = useViewStore();

  if (!band) {
    return <div className={styles.placeholder}>No data</div>;
  }

  const isDark = theme === 'dark';

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
      y: -0.2,
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

  const { depth, Ec, Ev, Ef, Ei } = band.vertical;

  const traces = [
    {
      x: depth,
      y: Ec,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Ec',
      line: { color: '#f87171', width: 2 },
    },
    {
      x: depth,
      y: Ev,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Ev',
      line: { color: '#4a9eff', width: 2 },
    },
    {
      x: depth,
      y: Ei,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Ei',
      line: { color: '#4ade80', width: 1, dash: 'dot' as const },
    },
    {
      x: [depth[0], depth[depth.length - 1]],
      y: [Ef, Ef],
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Ef',
      line: { color: '#fbbf24', width: 1.5, dash: 'dash' as const },
    },
  ];

  // Find oxide-Si interface (where depth equals tox approximately)
  const toxIndex = depth.findIndex((d, i) => i > 0 && d > depth[0] && Ec[i] < Ec[i - 1] - 0.5);

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>Energy Band Diagram (Vertical)</div>
      <div className={styles.plotWrapperFull}>
        <Plot
          data={traces}
          layout={{
            ...layoutBase,
            xaxis: {
              ...layoutBase.xaxis,
              title: { text: 'Depth (nm)', font: { size: 10 } },
            },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: 'Energy (eV)', font: { size: 10 } },
              autorange: 'reversed',
            },
            shapes: toxIndex > 0 ? [
              {
                type: 'line',
                x0: depth[toxIndex],
                x1: depth[toxIndex],
                y0: Math.min(...Ev) - 0.5,
                y1: Math.max(...Ec) + 0.5,
                line: { color: isDark ? '#666' : '#999', width: 1, dash: 'dot' },
              },
            ] : [],
            annotations: toxIndex > 0 ? [
              {
                x: depth[toxIndex],
                y: Math.max(...Ec) + 0.3,
                text: 'Oxide|Si',
                showarrow: false,
                font: { size: 9, color: isDark ? '#888' : '#666' },
              },
            ] : [],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
