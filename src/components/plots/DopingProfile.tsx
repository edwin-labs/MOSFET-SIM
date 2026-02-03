import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore } from '../../store';
import styles from './Plots.module.css';

export function DopingProfile() {
  const { doping1d, dopingLateral1d } = useSimulationStore();
  const { theme } = useViewStore();
  const { deviceType } = useDeviceStore();

  const isDark = theme === 'dark';
  const isNMOS = deviceType === 'nmos';

  const layoutBase = {
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    font: { color: isDark ? '#e0e0e0' : '#1f2937', size: 10 },
    margin: { t: 30, r: 10, b: 40, l: 60 },
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

  if (!doping1d) {
    return (
      <div className={styles.plotContainer}>
        <div className={styles.placeholder}>No doping data available</div>
      </div>
    );
  }

  // Vertical profile traces
  const verticalTraces = [
    {
      x: doping1d.position,
      y: doping1d.Nd.map((v) => Math.max(v, 1e10)),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Nd (donors)',
      line: { color: '#f44336', width: 2 },
    },
    {
      x: doping1d.position,
      y: doping1d.Na.map((v) => Math.max(v, 1e10)),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Na (acceptors)',
      line: { color: '#2196f3', width: 2 },
    },
  ];

  // Net doping trace
  const netTraces = [
    {
      x: doping1d.position,
      y: doping1d.Nnet.map((v) => Math.abs(v) > 1e10 ? Math.abs(v) : 1e10),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: '|Nnet|',
      line: { color: '#4ade80', width: 2 },
    },
  ];

  // Lateral profile traces
  let lateralTraces: typeof verticalTraces = [];
  if (dopingLateral1d) {
    lateralTraces = [
      {
        x: dopingLateral1d.position,
        y: dopingLateral1d.Nd.map((v) => Math.max(v, 1e10)),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Nd',
        line: { color: '#f44336', width: 2 },
      },
      {
        x: dopingLateral1d.position,
        y: dopingLateral1d.Na.map((v) => Math.max(v, 1e10)),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Na',
        line: { color: '#2196f3', width: 2 },
      },
    ];
  }

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>Vertical Doping Profile (at channel center)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={verticalTraces}
          layout={{
            ...layoutBase,
            xaxis: { ...layoutBase.xaxis, title: { text: 'Depth (nm)', font: { size: 10 } } },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: 'Concentration (cm^-3)', font: { size: 10 } },
              type: 'log',
              exponentformat: 'e',
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className={styles.plotTitle}>Net Doping (Nd - Na)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={netTraces}
          layout={{
            ...layoutBase,
            xaxis: { ...layoutBase.xaxis, title: { text: 'Depth (nm)', font: { size: 10 } } },
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: '|Net Doping| (cm^-3)', font: { size: 10 } },
              type: 'log',
              exponentformat: 'e',
            },
            annotations: [
              {
                x: 0.02,
                y: 0.98,
                xref: 'paper',
                yref: 'paper',
                text: isNMOS ? 'p-type substrate' : 'n-type substrate',
                showarrow: false,
                font: { size: 10, color: isDark ? '#888' : '#666' },
              },
            ],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {lateralTraces.length > 0 && (
        <>
          <div className={styles.plotTitle}>Lateral Doping Profile (near surface)</div>
          <div className={styles.plotWrapper}>
            <Plot
              data={lateralTraces}
              layout={{
                ...layoutBase,
                xaxis: { ...layoutBase.xaxis, title: { text: 'Position (nm)', font: { size: 10 } } },
                yaxis: {
                  ...layoutBase.yaxis,
                  title: { text: 'Concentration (cm^-3)', font: { size: 10 } },
                  type: 'log',
                  exponentformat: 'e',
                },
                shapes: [
                  {
                    type: 'rect',
                    xref: 'x',
                    yref: 'paper',
                    x0: -45,
                    x1: 45,
                    y0: 0,
                    y1: 1,
                    fillcolor: isDark ? 'rgba(158, 158, 158, 0.1)' : 'rgba(158, 158, 158, 0.2)',
                    line: { width: 0 },
                  },
                ],
                annotations: [
                  {
                    x: 0,
                    y: 1.02,
                    xref: 'x',
                    yref: 'paper',
                    text: 'Gate',
                    showarrow: false,
                    font: { size: 9, color: isDark ? '#888' : '#666' },
                  },
                ],
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
