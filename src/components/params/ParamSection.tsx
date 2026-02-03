import { ReactNode, useCallback } from 'react';
import { useViewStore } from '../../store/viewStore';
import styles from './ParamSection.module.css';

interface ParamSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}

export function ParamSection({ title, children, defaultOpen = true, storageKey }: ParamSectionProps) {
  const key = storageKey || `left-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const { foldStates, setFoldState } = useViewStore();
  const isOpen = foldStates[key] ?? defaultOpen;

  const toggle = useCallback(() => {
    setFoldState(key, !isOpen);
  }, [key, isOpen, setFoldState]);

  return (
    <div className={styles.section}>
      <button className={styles.header} onClick={toggle}>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>
          <ChevronIcon />
        </span>
        <span className={styles.title}>{title}</span>
      </button>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M3 2 L7 5 L3 8 Z" />
    </svg>
  );
}
