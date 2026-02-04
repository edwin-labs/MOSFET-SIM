import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore } from '../../store';
import { OXIDES } from '../../physics/materials';
import styles from './Plots.module.css';

export function CVPlot() {
  const { cv } = useSimulationStore();
  const { theme } = useViewStore();
  const { deviceParams } = useDeviceStore();

  if (!cv) {
    return <div className={styles.placeholder}>No data</div>;
  }

  const isDark = theme === 'dark';

  const layoutBase = {
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    font: { color: isDark ? '#e0e0e0' : '#1f2937', size: 10 },
    margin: { t: 10, r: 10, b: 50, l: 60 },
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

  // Calculate Cox for reference line
  const oxideProps = OXIDES[deviceParams.gate.oxideMaterial];
  const tox_cm = deviceParams.gate.tox * 1e-7;
  const Cox = (8.854e-14 * oxideProps.eps_r) / tox_cm; // F/cm^2

  // Normalize to Cox
  const cNormalized = cv.highFreq.c.map((c) => c / Cox);

  const traces = [
    {
      x: cv.highFreq.vg,
      y: cNormalized,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'High Freq',
      line: { color: '#4a9eff', width: 2 },
    },
    {
      x: cv.highFreq.vg,
      y: cv.highFreq.vg.map(() => 1),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Cox',
      line: { color: '#666666', width: 1, dash: 'dash' as const },
    },
  ];

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>C-V Characteristics</div>
      <div className={styles.plotWrapperFull}>
        <Plot
          data={traces}
          layout={{
            ...layoutBase,
            xaxis: {
              ...layoutBase.xaxis,
              title: { text: 'Vg (V)', font: { size: 10 } },
            },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: 'C/Cox', font: { size: 10 } },
              range: [0, 1.1],
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
