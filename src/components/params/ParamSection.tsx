import { useState, ReactNode } from 'react';
import styles from './ParamSection.module.css';

interface ParamSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ParamSection({ title, children, defaultOpen = true }: ParamSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.header} onClick={() => setIsOpen(!isOpen)}>
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
