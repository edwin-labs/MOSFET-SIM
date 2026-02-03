import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore } from '../../store';
import styles from './Plots.module.css';

export function GmGdsPlot() {
  const { gm, gds, iv } = useSimulationStore();
  const { theme } = useViewStore();
  const { level } = useDeviceStore();

  const isDark = theme === 'dark';

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

  if (level !== 'B') {
    return (
      <div className={styles.plotContainer}>
        <div className={styles.placeholder}>
          gm/gds plots require Level B. Switch to Level B in the toolbar.
        </div>
      </div>
    );
  }

  if (!gm || !gds) {
    return (
      <div className={styles.plotContainer}>
        <div className={styles.placeholder}>No gm/gds data available</div>
      </div>
    );
  }

  const gmTraces = [
    {
      x: gm.x,
      y: gm.y.map((v) => v * 1e6), // Convert to uS
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: gm.label,
      line: { color: '#4a9eff', width: 2 },
    },
  ];

  const gdsTraces = [
    {
      x: gds.x,
      y: gds.y.map((v) => v * 1e6), // Convert to uS
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: gds.label,
      line: { color: '#f472b6', width: 2 },
    },
  ];

  // Also show gm/Id if we have the data
  let gmIdTraces: typeof gmTraces = [];
  if (iv && iv.transfer.length > 0) {
    const transferCurve = iv.transfer[iv.transfer.length - 1];
    const gmIdX: number[] = [];
    const gmIdY: number[] = [];

    for (let i = 0; i < Math.min(gm.x.length, transferCurve.x.length); i++) {
      const Id = transferCurve.y[i];
      if (Id > 1e-12) {
        gmIdX.push(gm.x[i]);
        gmIdY.push(gm.y[i] / Id);
      }
    }

    gmIdTraces = [
      {
        x: gmIdX,
        y: gmIdY,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'gm/Id',
        line: { color: '#4ade80', width: 2 },
      },
    ];
  }

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>Transconductance (gm vs Vgs)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={gmTraces}
          layout={{
            ...layoutBase,
            xaxis: { ...layoutBase.xaxis, title: { text: 'Vgs (V)', font: { size: 10 } } },
            yaxis: { ...layoutBase.yaxis, title: { text: 'gm (uS)', font: { size: 10 } } },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className={styles.plotTitle}>Output Conductance (gds vs Vds)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={gdsTraces}
          layout={{
            ...layoutBase,
            xaxis: { ...layoutBase.xaxis, title: { text: 'Vds (V)', font: { size: 10 } } },
            yaxis: { ...layoutBase.yaxis, title: { text: 'gds (uS)', font: { size: 10 } } },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {gmIdTraces.length > 0 && (
        <>
          <div className={styles.plotTitle}>Transconductance Efficiency (gm/Id)</div>
          <div className={styles.plotWrapper}>
            <Plot
              data={gmIdTraces}
              layout={{
                ...layoutBase,
                xaxis: { ...layoutBase.xaxis, title: { text: 'Vgs (V)', font: { size: 10 } } },
                yaxis: { ...layoutBase.yaxis, title: { text: 'gm/Id (1/V)', font: { size: 10 } } },
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </>
      )}
    </div>
  );
}
