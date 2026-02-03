/**
 * Advanced Physics Panel
 *
 * UI for toggling advanced physics effects
 */

import { useDeviceStore } from '../../store';
import type { AdvancedPhysicsOptions } from '../../types/device';
import styles from './AdvancedPhysicsPanel.module.css';

interface EffectOption {
  key: keyof AdvancedPhysicsOptions;
  label: string;
  description: string;
}

const EFFECT_OPTIONS: EffectOption[] = [
  {
    key: 'gateLeakage',
    label: 'Gate Leakage',
    description: 'Fowler-Nordheim & Direct tunneling through gate oxide',
  },
  {
    key: 'impactIonization',
    label: 'Impact Ionization',
    description: 'Avalanche multiplication near drain junction',
  },
  {
    key: 'hotCarrier',
    label: 'Hot Carrier',
    description: 'Substrate current from hot carrier injection',
  },
  {
    key: 'gidl',
    label: 'GIDL',
    description: 'Gate-induced drain leakage (band-to-band tunneling)',
  },
  {
    key: 'selfHeating',
    label: 'Self-Heating',
    description: 'Temperature rise due to power dissipation',
  },
  {
    key: 'quantumEffects',
    label: 'Quantum Effects',
    description: 'Quantum capacitance and inversion layer thickness',
  },
  {
    key: 'polyDepletion',
    label: 'Poly Depletion',
    description: 'Poly-Si gate depletion capacitance',
  },
];

export function AdvancedPhysicsPanel() {
  const { level, advancedPhysics, updateAdvancedPhysics } = useDeviceStore();

  // Only show for Level B and C
  if (level === 'A') {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Advanced Physics</div>
      <div className={styles.info}>
        Enable additional physical effects for enhanced accuracy (Level B/C only)
      </div>
      <div className={styles.effectList}>
        {EFFECT_OPTIONS.map((effect) => (
          <label key={effect.key} className={styles.effectItem} title={effect.description}>
            <input
              type="checkbox"
              checked={advancedPhysics[effect.key]}
              onChange={(e) => updateAdvancedPhysics(effect.key, e.target.checked)}
            />
            <span className={styles.effectLabel}>{effect.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
