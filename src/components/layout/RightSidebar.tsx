import { useCallback } from 'react';
import { useViewStore } from '../../store/viewStore';
import { IVPlot } from '../plots/IVPlot';
import { CVPlot } from '../plots/CVPlot';
import { BandDiagram } from '../plots/BandDiagram';
import { GmGdsPlot } from '../plots/GmGdsPlot';
import { DopingProfile } from '../plots/DopingProfile';
import { Dashboard } from '../plots/Dashboard';
import { FieldPlotsPanel } from '../plots/FieldPlots';
import styles from './RightSidebar.module.css';

interface FoldableSectionProps {
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FoldableSection({ title, storageKey, defaultOpen = false, children }: FoldableSectionProps) {
  const { foldStates, setFoldState } = useViewStore();
  const isOpen = foldStates[storageKey] ?? defaultOpen;

  const toggle = useCallback(() => {
    setFoldState(storageKey, !isOpen);
  }, [storageKey, isOpen, setFoldState]);

  return (
    <div className={styles.section}>
      <button
        className={`${styles.sectionHeader} ${isOpen ? styles.open : ''}`}
        onClick={toggle}
      >
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.chevron}>{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

export function RightSidebar() {
  return (
    <div className={styles.sidebar}>
      <FoldableSection title="Device Metrics" storageKey="right-metrics" defaultOpen={true}>
        <Dashboard />
      </FoldableSection>

      <FoldableSection title="I-V Characteristics" storageKey="right-iv" defaultOpen={true}>
        <IVPlot />
      </FoldableSection>

      <FoldableSection title="C-V Characteristics" storageKey="right-cv">
        <CVPlot />
      </FoldableSection>

      <FoldableSection title="Band Diagram" storageKey="right-band">
        <BandDiagram />
      </FoldableSection>

      <FoldableSection title="Transconductance (gm/gds)" storageKey="right-gmgds">
        <GmGdsPlot />
      </FoldableSection>

      <FoldableSection title="Doping Profile" storageKey="right-doping">
        <DopingProfile />
      </FoldableSection>

      <FoldableSection title="2D Fields (Level C)" storageKey="right-fields">
        <FieldPlotsPanel />
      </FoldableSection>
    </div>
  );
}
