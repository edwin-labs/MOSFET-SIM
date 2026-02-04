/**
 * Export Panel
 *
 * UI for exporting simulation data and state
 */

import { useRef } from 'react';
import { useDeviceStore, useSimulationStore } from '../../store';
import {
  downloadIVCSV,
  downloadCVCSV,
  downloadStateJSON,
  readFileAsText,
  parseImportedState,
  type ExportState,
} from '../../utils/export';
import styles from './ExportPanel.module.css';

export function ExportPanel() {
  const {
    deviceType,
    modelType,
    compactEffects,
    techNode,
    temperature,
    deviceParams,
    bias,
    setDeviceType,
    setModelType,
    setAllCompactEffects,
    setTechNode,
    setTemperature,
    updateDeviceParam,
    updateBias,
  } = useDeviceStore();

  const { iv, cv } = useSimulationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportIV = () => {
    if (iv) {
      downloadIVCSV(iv, deviceType);
    }
  };

  const handleExportCV = () => {
    if (cv) {
      downloadCVCSV(cv, deviceType);
    }
  };

  const handleExportState = () => {
    const state: ExportState = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      deviceType,
      modelType,
      compactEffects,
      techNode,
      temperature,
      deviceParams,
      bias,
    };
    downloadStateJSON(state);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const state = parseImportedState(content);

      if (state) {
        setDeviceType(state.deviceType);
        setModelType(state.modelType);
        if (state.compactEffects) {
          setAllCompactEffects(state.compactEffects);
        }
        setTechNode(state.techNode);
        setTemperature(state.temperature);

        // Update all device params
        for (const group of Object.keys(state.deviceParams) as (keyof typeof state.deviceParams)[]) {
          const groupParams = state.deviceParams[group];
          for (const key of Object.keys(groupParams) as (keyof typeof groupParams)[]) {
            updateDeviceParam(group, key, groupParams[key]);
          }
        }

        // Update bias
        updateBias('vgs', state.bias.vgs);
        updateBias('vds', state.bias.vds);
        updateBias('vbs', state.bias.vbs);

        // After loading, set techNode to custom since we manually set params
        setTechNode('custom');
      }
    } catch (err) {
      console.error('Failed to import state:', err);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Export / Import</div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Export Data</div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.exportBtn}
            onClick={handleExportIV}
            disabled={!iv}
            title={!iv ? 'No I-V data available' : 'Export I-V data to CSV'}
          >
            I-V CSV
          </button>
          <button
            className={styles.exportBtn}
            onClick={handleExportCV}
            disabled={!cv}
            title={!cv ? 'No C-V data available' : 'Export C-V data to CSV'}
          >
            C-V CSV
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Save / Load State</div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.exportBtn}
            onClick={handleExportState}
            title="Save current parameters to JSON"
          >
            Save JSON
          </button>
          <button
            className={styles.importBtn}
            onClick={handleImportClick}
            title="Load parameters from JSON"
          >
            Load JSON
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.info}>
        <p>CSV files can be opened in Excel or other spreadsheet software.</p>
        <p>JSON files preserve all device parameters for later use.</p>
      </div>
    </div>
  );
}
