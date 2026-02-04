/**
 * Web Worker for Level C Numerical Simulation
 *
 * Runs the computationally intensive Gummel iteration
 * in a background thread to keep the UI responsive.
 * Supports WebGPU acceleration when available in worker context.
 */

import { LevelCEngine, GummelProgress, toNumericalResult2D } from './gummel';
import type { DeviceParams, DeviceType } from '../../types/device';
import type { NumericalResult2D } from '../../types/simulation';

// Check if WebGPU is available in this worker context
const isWebGPUAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator;

// Worker message types
export type WorkerMessageType =
  | 'solve'
  | 'sweep'
  | 'cancel'
  | 'progress'
  | 'result'
  | 'error'
  | 'point'
  | 'gpuStatus';

export interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  payload?: unknown;
}

export interface SolveRequest {
  params: DeviceParams;
  deviceType: DeviceType;
  bias: { Vgs: number; Vds: number; Vbs: number };
  temperature: number;
  useGPU?: boolean;
}

export interface SweepRequest {
  params: DeviceParams;
  deviceType: DeviceType;
  sweepType: 'transfer' | 'output';
  fixedV: number;
  sweepRange: { start: number; end: number; points: number };
  temperature: number;
  useGPU?: boolean;
}

export interface SolveResult {
  numerical2d: NumericalResult2D;
  Id: number;
  converged: boolean;
  iterations: number;
}

export interface SweepResult {
  V: number[];
  Id: number[];
}

export interface ProgressUpdate {
  iteration: number;
  maxIter: number;
  residual: number;
  phase: string;
}

export interface PointUpdate {
  index: number;
  total: number;
  V: number;
  Id: number;
}

// Worker state
let engine: LevelCEngine | null = null;
let cancelled = false;

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  switch (type) {
    case 'solve':
      await handleSolve(id, payload as SolveRequest);
      break;

    case 'sweep':
      await handleSweep(id, payload as SweepRequest);
      break;

    case 'cancel':
      handleCancel();
      break;

    case 'gpuStatus':
      // Report GPU availability in worker
      self.postMessage({
        type: 'gpuStatus',
        id,
        payload: { available: isWebGPUAvailable },
      });
      break;

    default:
      postError(id, `Unknown message type: ${type}`);
  }
};

/**
 * Handle single-point solve request
 */
async function handleSolve(id: string, request: SolveRequest): Promise<void> {
  void id; // Track request (unused for now)
  cancelled = false;

  if (!engine) {
    engine = new LevelCEngine();
  }

  // Enable GPU if requested and available
  const useGPU = Boolean(request.useGPU) && isWebGPUAvailable;
  engine.setUseGPU(useGPU);

  try {
    // Use async version when GPU is enabled (GPU ops are async)
    const result = useGPU
      ? await engine.solveAsync(
          request.params,
          request.deviceType,
          request.bias,
          request.temperature,
          {
            maxIter: 50,
            tolerance: 1e-5,
            progressCallback: (progress: GummelProgress) => {
              if (cancelled) return;
              postProgress(id, {
                iteration: progress.iteration,
                maxIter: progress.maxIter,
                residual: progress.residual,
                phase: progress.phase,
              });
            },
          }
        )
      : engine.solve(
          request.params,
          request.deviceType,
          request.bias,
          request.temperature,
          {
            maxIter: 50,
            tolerance: 1e-5,
            progressCallback: (progress: GummelProgress) => {
              if (cancelled) return;
              postProgress(id, {
                iteration: progress.iteration,
                maxIter: progress.maxIter,
                residual: progress.residual,
                phase: progress.phase,
              });
            },
          }
        );

    if (cancelled) return;

    const response: SolveResult = {
      numerical2d: toNumericalResult2D(result),
      Id: result.Id,
      converged: result.converged,
      iterations: result.iterations,
    };

    postResult(id, response);
  } catch (err) {
    postError(id, err instanceof Error ? err.message : String(err));
  } finally {
      }
}

/**
 * Handle I-V sweep request
 */
async function handleSweep(id: string, request: SweepRequest): Promise<void> {
  void id; // Track request (unused for now)
  cancelled = false;

  if (!engine) {
    engine = new LevelCEngine();
  }

  // Reset engine for fresh sweep
  engine.reset();

  // Enable GPU if requested and available
  const useGPU = Boolean(request.useGPU) && isWebGPUAvailable;
  engine.setUseGPU(useGPU);

  try {
    // Use async version when GPU is enabled
    const result = useGPU
      ? await engine.sweepIVAsync(
          request.params,
          request.deviceType,
          request.sweepType,
          request.fixedV,
          request.sweepRange,
          request.temperature,
          {
            maxIter: 30,
            tolerance: 1e-4,
          },
          (index: number, total: number, V: number, Id: number) => {
            if (cancelled) return;
            postPoint(id, { index, total, V, Id });
          }
        )
      : engine.sweepIV(
          request.params,
          request.deviceType,
          request.sweepType,
          request.fixedV,
          request.sweepRange,
          request.temperature,
          {
            maxIter: 30,
            tolerance: 1e-4,
          },
          (index: number, total: number, V: number, Id: number) => {
            if (cancelled) return;
            postPoint(id, { index, total, V, Id });
          }
        );

    if (cancelled) return;

    const response: SweepResult = {
      V: result.V,
      Id: result.Id,
    };

    postResult(id, response);
  } catch (err) {
    postError(id, err instanceof Error ? err.message : String(err));
  } finally {
      }
}

/**
 * Handle cancel request
 */
function handleCancel(): void {
  cancelled = true;
  if (engine) {
    engine.reset();
  }
}

/**
 * Post progress update to main thread
 */
function postProgress(id: string, progress: ProgressUpdate): void {
  self.postMessage({
    type: 'progress',
    id,
    payload: progress,
  } as WorkerMessage);
}

/**
 * Post single point result (during sweep)
 */
function postPoint(id: string, point: PointUpdate): void {
  self.postMessage({
    type: 'point',
    id,
    payload: point,
  } as WorkerMessage);
}

/**
 * Post final result to main thread
 */
function postResult(id: string, result: SolveResult | SweepResult): void {
  self.postMessage({
    type: 'result',
    id,
    payload: result,
  } as WorkerMessage);
}

/**
 * Post error to main thread
 */
function postError(id: string, error: string): void {
  self.postMessage({
    type: 'error',
    id,
    payload: error,
  } as WorkerMessage);
}
