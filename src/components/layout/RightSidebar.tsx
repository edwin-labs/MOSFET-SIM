import { useState } from 'react';
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
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FoldableSection({ title, defaultOpen = false, children }: FoldableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button
        className={`${styles.sectionHeader} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
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
      <FoldableSection title="Device Metrics" defaultOpen={true}>
        <Dashboard />
      </FoldableSection>

      <FoldableSection title="I-V Characteristics" defaultOpen={true}>
        <IVPlot />
      </FoldableSection>

      <FoldableSection title="C-V Characteristics">
        <CVPlot />
      </FoldableSection>

      <FoldableSection title="Band Diagram">
        <BandDiagram />
      </FoldableSection>

      <FoldableSection title="Transconductance (gm/gds)">
        <GmGdsPlot />
      </FoldableSection>

      <FoldableSection title="Doping Profile">
        <DopingProfile />
      </FoldableSection>

      <FoldableSection title="2D Fields (Level C)">
        <FieldPlotsPanel />
      </FoldableSection>
    </div>
  );
}
