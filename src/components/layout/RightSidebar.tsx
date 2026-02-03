import { useViewStore } from '../../store';
import { IVPlot } from '../plots/IVPlot';
import { CVPlot } from '../plots/CVPlot';
import { BandDiagram } from '../plots/BandDiagram';
import { GmGdsPlot } from '../plots/GmGdsPlot';
import { DopingProfile } from '../plots/DopingProfile';
import { Dashboard } from '../plots/Dashboard';
import { FieldPlotsPanel } from '../plots/FieldPlots';
import styles from './RightSidebar.module.css';

const TABS = [
  { id: 'iv' as const, label: 'I-V' },
  { id: 'cv' as const, label: 'C-V' },
  { id: 'band' as const, label: 'Band' },
  { id: 'gmgds' as const, label: 'gm/gds' },
  { id: 'profile' as const, label: 'Doping' },
  { id: 'fields' as const, label: 'Fields' },
  { id: 'dashboard' as const, label: 'Metrics' },
];

export function RightSidebar() {
  const { plotTab, setPlotTab } = useViewStore();

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${plotTab === tab.id ? styles.active : ''}`}
            onClick={() => setPlotTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {plotTab === 'iv' && <IVPlot />}
        {plotTab === 'cv' && <CVPlot />}
        {plotTab === 'band' && <BandDiagram />}
        {plotTab === 'gmgds' && <GmGdsPlot />}
        {plotTab === 'profile' && <DopingProfile />}
        {plotTab === 'fields' && <FieldPlotsPanel />}
        {plotTab === 'dashboard' && <Dashboard />}
      </div>
    </div>
  );
}
