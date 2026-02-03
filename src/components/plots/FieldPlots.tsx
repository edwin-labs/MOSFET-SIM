/**
 * Field Plots for Level C Results
 *
 * Displays 2D heatmaps for:
 * - Electrostatic potential
 * - Electric field magnitude
 * - Electron concentration
 * - Hole concentration
 */

import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore } from '../../store';
import styles from './Plots.module.css';

type FieldType = 'potential' | 'efield' | 'electron' | 'hole';

interface FieldPlotsProps {
  fieldType?: FieldType;
}

export function FieldPlots({ fieldType = 'potential' }: FieldPlotsProps) {
  const { numerical2d } = useSimulationStore();
  const { theme } = useViewStore();

  const isDark = theme === 'dark';

  const plotData = useMemo(() => {
    if (!numerical2d) return null;

    const { x, z, nx, nz, psi, n, p, Ex, Ez } = numerical2d;

    let values: number[][] = [];
    let title = '';
    let colorscale: string = 'Viridis';
    let zmin: number | undefined;
    let zmax: number | undefined;

    switch (fieldType) {
      case 'potential':
        title = 'Electrostatic Potential (V)';
        colorscale = 'RdBu';
        for (let j = 0; j < nz; j++) {
          const row: number[] = [];
          for (let i = 0; i < nx; i++) {
            row.push(psi[j * nx + i]);
          }
          values.push(row);
        }
        break;

      case 'efield':
        title = 'Electric Field Magnitude (V/cm)';
        colorscale = 'Hot';
        for (let j = 0; j < nz; j++) {
          const row: number[] = [];
          for (let i = 0; i < nx; i++) {
            const idx = j * nx + i;
            const E = Math.sqrt(Ex[idx] * Ex[idx] + Ez[idx] * Ez[idx]);
            row.push(Math.log10(E + 1));
          }
          values.push(row);
        }
        break;

      case 'electron':
        title = 'Electron Concentration (cm⁻³)';
        colorscale = 'Reds';
        for (let j = 0; j < nz; j++) {
          const row: number[] = [];
          for (let i = 0; i < nx; i++) {
            row.push(Math.log10(n[j * nx + i] + 1));
          }
          values.push(row);
        }
        zmin = 10;
        zmax = 21;
        break;

      case 'hole':
        title = 'Hole Concentration (cm⁻³)';
        colorscale = 'Blues';
        for (let j = 0; j < nz; j++) {
          const row: number[] = [];
          for (let i = 0; i < nx; i++) {
            row.push(Math.log10(p[j * nx + i] + 1));
          }
          values.push(row);
        }
        zmin = 10;
        zmax = 21;
        break;
    }

    return { x, z, values, title, colorscale, zmin, zmax };
  }, [numerical2d, fieldType]);

  if (!plotData) {
    return (
      <div className={styles.placeholder}>
        No Level C data available. Run a simulation first.
      </div>
    );
  }

  const layout = {
    title: {
      text: plotData.title,
      font: { size: 12, color: isDark ? '#e0e0e0' : '#1f2937' },
    },
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    font: { color: isDark ? '#e0e0e0' : '#1f2937', size: 10 },
    margin: { t: 40, r: 80, b: 50, l: 60 },
    xaxis: {
      title: { text: 'X (nm)', font: { size: 10 } },
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
    },
    yaxis: {
      title: { text: 'Depth (nm)', font: { size: 10 } },
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
      autorange: 'reversed' as const,
    },
  };

  return (
    <div className={styles.plotWrapper}>
      <Plot
        data={[
          {
            type: 'heatmap',
            x: plotData.x,
            y: plotData.z,
            z: plotData.values,
            colorscale: plotData.colorscale,
            zmin: plotData.zmin,
            zmax: plotData.zmax,
            colorbar: {
              title: { text: '', font: { size: 9 } },
              tickfont: { size: 9 },
            },
          },
        ]}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

/**
 * Combined field view with selector
 */
export function FieldPlotsPanel() {
  const { numerical2d } = useSimulationStore();

  if (!numerical2d) {
    return (
      <div className={styles.plotContainer}>
        <div className={styles.placeholder}>
          Level C data not available.
          <br />
          Select Level C and run a simulation.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.plotContainer}>
      <div className={styles.plotTitle}>Potential Distribution</div>
      <FieldPlots fieldType="potential" />

      <div className={styles.plotTitle}>Electron Concentration (log₁₀)</div>
      <FieldPlots fieldType="electron" />

      <div className={styles.plotTitle}>Hole Concentration (log₁₀)</div>
      <FieldPlots fieldType="hole" />
    </div>
  );
}
