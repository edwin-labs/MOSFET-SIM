/**
 * Export Utilities
 *
 * Functions for exporting simulation data in various formats:
 * - PNG: Plot images via Plotly
 * - CSV: I-V and C-V data
 * - JSON: Full state save/load
 */

import type { IVResult, CVResult } from '../types/simulation';
import type { DeviceParams, BiasConditions, DeviceType, PhysicsLevel } from '../types/device';
import type { TechnologyNode } from '../presets/technologyNodes';

export interface ExportState {
  version: string;
  timestamp: string;
  deviceType: DeviceType;
  level: PhysicsLevel;
  techNode: TechnologyNode;
  temperature: number;
  deviceParams: DeviceParams;
  bias: BiasConditions;
}

/**
 * Export I-V data to CSV format
 */
export function exportIVToCSV(iv: IVResult, deviceType: DeviceType): string {
  const lines: string[] = [];

  lines.push('# MOSFET Simulator - I-V Data Export');
  lines.push(`# Device Type: ${deviceType.toUpperCase()}`);
  lines.push(`# Export Time: ${new Date().toISOString()}`);
  lines.push('');

  // Output characteristics (Id vs Vds)
  if (iv.output.length > 0) {
    lines.push('# Output Characteristics (Id vs Vds)');
    lines.push('# Curves: ' + iv.output.map((c) => c.label).join(', '));
    lines.push('');

    const header = ['Vds(V)', ...iv.output.map((c) => `Id_${c.label}(A)`)];
    lines.push(header.join(','));

    const numPoints = iv.output[0].x.length;
    for (let i = 0; i < numPoints; i++) {
      const row = [iv.output[0].x[i].toExponential(6)];
      for (const curve of iv.output) {
        row.push(curve.y[i].toExponential(6));
      }
      lines.push(row.join(','));
    }
    lines.push('');
  }

  // Transfer characteristics (Id vs Vgs)
  if (iv.transfer && iv.transfer.length > 0) {
    lines.push('# Transfer Characteristics (Id vs Vgs)');
    lines.push('');
    lines.push('Vgs(V),Id(A),log10_Id');

    const transferCurve = iv.transfer[0];
    for (let i = 0; i < transferCurve.x.length; i++) {
      const id = transferCurve.y[i];
      const logId = id > 0 ? Math.log10(Math.abs(id)) : -20;
      lines.push(`${transferCurve.x[i].toExponential(6)},${id.toExponential(6)},${logId.toFixed(4)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Export C-V data to CSV format
 */
export function exportCVToCSV(cv: CVResult, deviceType: DeviceType): string {
  const lines: string[] = [];

  lines.push('# MOSFET Simulator - C-V Data Export');
  lines.push(`# Device Type: ${deviceType.toUpperCase()}`);
  lines.push(`# Export Time: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Vg(V),C(F/cm^2),C/Cox');

  const { vg, c } = cv.highFreq;
  const Cox = Math.max(...c); // Cox is the maximum capacitance
  for (let i = 0; i < vg.length; i++) {
    const ratio = c[i] / Cox;
    lines.push(`${vg[i].toExponential(6)},${c[i].toExponential(6)},${ratio.toFixed(4)}`);
  }

  return lines.join('\n');
}

/**
 * Export simulation state to JSON
 */
export function exportStateToJSON(state: ExportState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse imported JSON state
 */
export function parseImportedState(json: string): ExportState | null {
  try {
    const state = JSON.parse(json) as ExportState;
    if (!state.version || !state.deviceParams || !state.bias) {
      console.error('Invalid state format');
      return null;
    }
    return state;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return null;
  }
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a timestamp string for filenames
 */
export function getTimestampString(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Export I-V data as CSV file
 */
export function downloadIVCSV(iv: IVResult, deviceType: DeviceType): void {
  const csv = exportIVToCSV(iv, deviceType);
  const filename = `mosfet_iv_${deviceType}_${getTimestampString()}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export C-V data as CSV file
 */
export function downloadCVCSV(cv: CVResult, deviceType: DeviceType): void {
  const csv = exportCVToCSV(cv, deviceType);
  const filename = `mosfet_cv_${deviceType}_${getTimestampString()}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export state as JSON file
 */
export function downloadStateJSON(state: ExportState): void {
  const json = exportStateToJSON(state);
  const filename = `mosfet_state_${state.deviceType}_${getTimestampString()}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
