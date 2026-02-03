import { useDeviceStore } from '../../store';
import { BiasControls } from '../params/BiasControls';
import { DeviceParams } from '../params/DeviceParams';
import { LevelCControls } from '../params/LevelCControls';
import { AdvancedPhysicsPanel } from '../params/AdvancedPhysicsPanel';
import { ComparisonPanel } from '../params/ComparisonPanel';
import { ExportPanel } from '../params/ExportPanel';
import styles from './LeftSidebar.module.css';

export function LeftSidebar() {
  const { mode, level } = useDeviceStore();

  return (
    <div className={styles.sidebar}>
      <BiasControls />
      {mode === 'device' && <DeviceParams />}
      {mode === 'process' && (
        <div className={styles.placeholder}>Process Mode (Coming Soon)</div>
      )}
      <AdvancedPhysicsPanel />
      {level === 'C' && <LevelCControls />}
      <ComparisonPanel />
      <ExportPanel />
    </div>
  );
}
