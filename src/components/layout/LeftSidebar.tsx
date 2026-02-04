import { useDeviceStore } from '../../store';
import { BiasControls } from '../params/BiasControls';
import { DeviceParams } from '../params/DeviceParams';
import { ProcessParams } from '../params/ProcessParams';
import { CompactEffectsPanel } from '../params/CompactEffectsPanel';
import { NumericalControls } from '../params/NumericalControls';
import { AdvancedPhysicsPanel } from '../params/AdvancedPhysicsPanel';
import { ComparisonPanel } from '../params/ComparisonPanel';
import { ExportPanel } from '../params/ExportPanel';
import styles from './LeftSidebar.module.css';

export function LeftSidebar() {
  const { mode, modelType } = useDeviceStore();

  return (
    <div className={styles.sidebar}>
      <BiasControls />
      {mode === 'device' && <DeviceParams />}
      {mode === 'process' && <ProcessParams />}
      {modelType === 'compact' && <CompactEffectsPanel />}
      <AdvancedPhysicsPanel />
      {modelType === 'numerical' && <NumericalControls />}
      <ComparisonPanel />
      <ExportPanel />
    </div>
  );
}
