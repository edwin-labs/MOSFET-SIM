/**
 * Noise Analysis Plot
 *
 * Displays thermal and 1/f noise spectral density
 */

import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useSimulationStore, useViewStore, useDeviceStore } from '../../store';
import { calcNoiseSpectrum, getTypicalKf, getGammaCoeff, type NoiseResult } from '../../physics/noise';
import { NM_TO_CM } from '../../physics/constants';
import styles from './Plots.module.css';

export function NoisePlot() {
  const { metrics, operatingPoint } = useSimulationStore();
  const { theme } = useViewStore();
  const { deviceType, deviceParams, techNode, temperature } = useDeviceStore();

  const isDark = theme === 'dark';

  // Calculate noise spectrum
  const noiseData = useMemo<NoiseResult | null>(() => {
    if (!metrics || !operatingPoint) return null;

    const gm = metrics.gmMax ?? 1e-6;
    const gds = metrics.rout ? 1 / metrics.rout : 1e-6;
    const Id = Math.abs(operatingPoint.id);

    if (Id < 1e-15 || gm < 1e-12) return null;

    // Get device dimensions in cm
    const W = deviceParams.geometry.width * NM_TO_CM;
    const L = deviceParams.gate.length * NM_TO_CM;

    // Oxide capacitance (F/cm²)
    const tox_cm = deviceParams.gate.tox * NM_TO_CM;
    const epsOx = deviceParams.gate.oxideMaterial === 'HfO2' ? 25 : 3.9;
    const eps0 = 8.854e-14;  // F/cm
    const Cox = epsOx * eps0 / tox_cm;

    // Get noise model parameters
    const Kf = getTypicalKf(techNode, deviceType);
    const vov = operatingPoint.vgs - (metrics.Vth ?? 0.4);
    const gamma = getGammaCoeff(vov, operatingPoint.vds, deviceParams.gate.length);

    return calcNoiseSpectrum({
      gm,
      gds,
      Id,
      Cox,
      W,
      L,
      T: temperature,
      gamma,
      Kf,
      Af: 1,
      Ef: 1,
    }, 1, 1e9, 10);
  }, [metrics, operatingPoint, deviceParams, techNode, deviceType, temperature]);

  if (!noiseData) {
    return (
      <div className={styles.placeholder}>
        Run simulation to see noise analysis
      </div>
    );
  }

  const layoutBase = {
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    font: { color: isDark ? '#e0e0e0' : '#1f2937', size: 10 },
    margin: { t: 30, r: 10, b: 50, l: 60 },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0.5,
      xanchor: 'center' as const,
      y: -0.2,
      yanchor: 'top' as const,
      font: { size: 9 },
      bgcolor: isDark ? 'rgba(26,26,46,0.8)' : 'rgba(255,255,255,0.8)',
    },
    xaxis: {
      title: { text: 'Frequency (Hz)', font: { size: 10 } },
      type: 'log' as const,
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
      zerolinecolor: isDark ? '#3a3a5a' : '#d1d5db',
    },
    yaxis: {
      title: { text: 'Sid (A²/Hz)', font: { size: 10 } },
      type: 'log' as const,
      exponentformat: 'e' as const,
      gridcolor: isDark ? '#2a2a4a' : '#e5e7eb',
      zerolinecolor: isDark ? '#3a3a5a' : '#d1d5db',
    },
  };

  const traces = [
    {
      x: noiseData.freq,
      y: noiseData.Sid_total,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Total',
      line: { color: '#4a9eff', width: 2 },
    },
    {
      x: noiseData.freq,
      y: noiseData.Sid_thermal,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Thermal',
      line: { color: '#4ade80', width: 1.5, dash: 'dash' },
    },
    {
      x: noiseData.freq,
      y: noiseData.Sid_flicker,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: '1/f',
      line: { color: '#f472b6', width: 1.5, dash: 'dot' },
    },
  ];

  // Input-referred noise traces
  const svgTraces = [
    {
      x: noiseData.freq,
      y: noiseData.Svg_input,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Input-referred',
      line: { color: '#fbbf24', width: 2 },
    },
  ];

  // Format corner frequency
  const formatFreq = (f: number): string => {
    if (f >= 1e9) return `${(f / 1e9).toFixed(1)} GHz`;
    if (f >= 1e6) return `${(f / 1e6).toFixed(1)} MHz`;
    if (f >= 1e3) return `${(f / 1e3).toFixed(1)} kHz`;
    return `${f.toFixed(1)} Hz`;
  };

  return (
    <div className={styles.plotContainer}>
      <div className={styles.noiseInfo}>
        <span>
          <span className={styles.label}>1/f corner:</span>
          <span className={styles.value}>{formatFreq(noiseData.cornerFreq)}</span>
        </span>
      </div>

      <div className={styles.plotTitle}>Drain Current Noise (Sid)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={traces}
          layout={layoutBase}
          config={{
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
            displaylogo: false,
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className={styles.plotTitle}>Input-Referred Noise (Svg)</div>
      <div className={styles.plotWrapper}>
        <Plot
          data={svgTraces}
          layout={{
            ...layoutBase,
            yaxis: {
              ...layoutBase.yaxis,
              title: { text: 'Svg (V²/Hz)', font: { size: 10 } },
            },
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
            displaylogo: false,
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
