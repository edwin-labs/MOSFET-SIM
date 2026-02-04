import { useDeviceStore } from '../../store';
import { BASIC_EFFECTS, DEFAULT_EFFECTS } from '../../physics/compactEngine';
import type { CompactModelEffects } from '../../types/device';
import styles from './CompactEffectsPanel.module.css';

const EFFECT_LABELS: Record<keyof CompactModelEffects, { label: string; description: string }> = {
  velocitySaturation: {
    label: 'Velocity Saturation',
    description: 'Reduces current at high lateral fields (short channels)',
  },
  dibl: {
    label: 'DIBL',
    description: 'Drain-Induced Barrier Lowering - Vth reduction with Vds',
  },
  clm: {
    label: 'CLM',
    description: 'Channel Length Modulation - finite output resistance in saturation',
  },
  bodyEffect: {
    label: 'Body Effect',
    description: 'Vth dependence on body-source voltage (Vbs)',
  },
  mobilityDegradation: {
    label: 'Mobility Degradation',
    description: 'Vertical field reduces carrier mobility',
  },
  subthresholdSlope: {
    label: 'SS Degradation',
    description: 'Non-ideal subthreshold slope due to interface traps',
  },
  shortChannel: {
    label: 'Short Channel',
    description: 'Vth roll-off due to charge sharing in short channels',
  },
  seriesResistance: {
    label: 'Series Resistance',
    description: 'Source/Drain contact and extension resistance',
  },
};

const EFFECT_ORDER: (keyof CompactModelEffects)[] = [
  'bodyEffect',
  'velocitySaturation',
  'mobilityDegradation',
  'clm',
  'dibl',
  'shortChannel',
  'subthresholdSlope',
  'seriesResistance',
];

export function CompactEffectsPanel() {
  const { compactEffects, setCompactEffect, setAllCompactEffects } = useDeviceStore();

  const enabledCount = Object.values(compactEffects).filter(Boolean).length;
  const totalCount = Object.keys(compactEffects).length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Physical Effects</h3>
        <span className={styles.count}>{enabledCount}/{totalCount}</span>
      </div>

      <div className={styles.presets}>
        <button
          className={styles.presetBtn}
          onClick={() => setAllCompactEffects(BASIC_EFFECTS)}
          title="Basic model with minimal effects"
        >
          Basic
        </button>
        <button
          className={styles.presetBtn}
          onClick={() => setAllCompactEffects(DEFAULT_EFFECTS)}
          title="Full model with all effects enabled"
        >
          Full
        </button>
      </div>

      <div className={styles.effects}>
        {EFFECT_ORDER.map((key) => {
          const { label, description } = EFFECT_LABELS[key];
          return (
            <label key={key} className={styles.effect} title={description}>
              <input
                type="checkbox"
                checked={compactEffects[key]}
                onChange={(e) => setCompactEffect(key, e.target.checked)}
              />
              <span className={styles.effectLabel}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
