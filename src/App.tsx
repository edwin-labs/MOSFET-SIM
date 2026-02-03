import { useEffect } from 'react';
import { Toolbar } from './components/layout/Toolbar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { MainView } from './components/layout/MainView';
import { RightSidebar } from './components/layout/RightSidebar';
import { StatusBar } from './components/layout/StatusBar';
import { useSimulation } from './hooks/useSimulation';
import { useViewStore } from './store';
import styles from './App.module.css';

function App() {
  const { theme } = useViewStore();

  // Initialize simulation
  useSimulation();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <Toolbar />
      </div>
      <div className={styles.leftSidebar}>
        <LeftSidebar />
      </div>
      <div className={styles.mainView}>
        <MainView />
      </div>
      <div className={styles.rightSidebar}>
        <RightSidebar />
      </div>
      <div className={styles.statusBar}>
        <StatusBar />
      </div>
    </div>
  );
}

export default App;
