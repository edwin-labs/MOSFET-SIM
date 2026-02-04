import { useDeviceStore, useViewStore } from '../../store';
import { type TechnologyNode } from '../../presets/technologyNodes';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const {
    deviceType,
    modelType,
    mode,
    temperature,
    techNode,
    setDeviceType,
    setModelType,
    setMode,
    setTemperature,
    setTechNode,
    resetAll,
  } = useDeviceStore();

  const { theme, toggleTheme, autoSimulate, setAutoSimulate, colormap, setColormap, showCurrentFlow, toggleCurrentFlow } = useViewStore();

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <span className={styles.label}>Device:</span>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${deviceType === 'nmos' ? styles.active : ''}`}
            onClick={() => setDeviceType('nmos')}
          >
            nMOS
          </button>
          <button
            className={`${styles.toggleBtn} ${deviceType === 'pmos' ? styles.active : ''}`}
            onClick={() => setDeviceType('pmos')}
          >
            pMOS
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Model:</span>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${modelType === 'compact' ? styles.active : ''}`}
            onClick={() => setModelType('compact')}
            title="Compact model with toggleable physical effects"
          >
            Compact
          </button>
          <button
            className={`${styles.toggleBtn} ${modelType === 'numerical' ? styles.active : ''}`}
            onClick={() => setModelType('numerical')}
            title="Numerical 2D Poisson + Drift-Diffusion (Gummel iteration)"
          >
            Numerical
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Mode:</span>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${mode === 'device' ? styles.active : ''}`}
            onClick={() => setMode('device')}
            title="Direct device parameter input"
          >
            Device
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'process' ? styles.active : ''}`}
            onClick={() => setMode('process')}
            title="Process-based parameter input (implant doses, anneals)"
          >
            Process
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Tech:</span>
        <select
          className={styles.select}
          value={techNode}
          onChange={(e) => setTechNode(e.target.value as TechnologyNode)}
        >
          <option value="180nm">180nm</option>
          <option value="90nm">90nm</option>
          <option value="45nm">45nm</option>
          <option value="28nm">28nm</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>T:</span>
        <input
          type="number"
          className={styles.tempInput}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          min={200}
          max={500}
          step={10}
        />
        <span className={styles.unit}>K</span>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>View:</span>
        <select
          className={styles.select}
          value={colormap}
          onChange={(e) => setColormap(e.target.value as typeof colormap)}
        >
          <option value="structure">Structure</option>
          <option value="doping">Doping</option>
          <option value="netType">Net Type</option>
          <option value="potential">Potential</option>
          <option value="efield">E-Field</option>
        </select>
      </div>

      <div className={styles.spacer} />

      <div className={styles.group}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={autoSimulate}
            onChange={(e) => setAutoSimulate(e.target.checked)}
          />
          Auto
        </label>
        <label className={styles.checkbox} title="Show current flow direction">
          <input
            type="checkbox"
            checked={showCurrentFlow}
            onChange={toggleCurrentFlow}
          />
          Flow
        </label>
      </div>

      <button className={styles.iconBtn} onClick={resetAll} title="Reset all parameters">
        Reset
      </button>

      <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
