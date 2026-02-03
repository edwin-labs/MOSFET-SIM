/**
 * Web Worker Hook for Level C Simulation
 *
 * Manages the lifecycle of the worker thread and provides
 * a clean interface for sending requests and receiving results.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { DeviceParams, DeviceType } from '../types/device';

// Import types from worker
import type {
  WorkerMessage,
  SolveRequest,
  SweepRequest,
  SolveResult,
  SweepResult,
  ProgressUpdate,
  PointUpdate,
} from '../physics/levelC/worker';

export interface WorkerState {
  status: 'idle' | 'running' | 'error';
  progress: ProgressUpdate | null;
  error: string | null;
}

export interface UseWorkerReturn {
  state: WorkerState;
  solve: (
    params: DeviceParams,
    deviceType: DeviceType,
    bias: { Vgs: number; Vds: number; Vbs: number },
    temperature: number
  ) => Promise<SolveResult>;
  sweep: (
    params: DeviceParams,
    deviceType: DeviceType,
    sweepType: 'transfer' | 'output',
    fixedV: number,
    sweepRange: { start: number; end: number; points: number },
    temperature: number,
    onPoint?: (point: PointUpdate) => void
  ) => Promise<SweepResult>;
  cancel: () => void;
}

/**
 * Generate unique request ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for managing Level C Web Worker
 */
export function useWorker(): UseWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    onPoint?: (point: PointUpdate) => void;
  }>>(new Map());

  const [state, setState] = useState<WorkerState>({
    status: 'idle',
    progress: null,
    error: null,
  });

  // Initialize worker
  useEffect(() => {
    // Create worker using Vite's worker import pattern
    const worker = new Worker(
      new URL('../physics/levelC/worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, id, payload } = event.data;

      const pending = pendingRequestsRef.current.get(id);

      switch (type) {
        case 'progress':
          setState(prev => ({
            ...prev,
            progress: payload as ProgressUpdate,
          }));
          break;

        case 'point':
          if (pending?.onPoint) {
            pending.onPoint(payload as PointUpdate);
          }
          break;

        case 'result':
          if (pending) {
            pending.resolve(payload);
            pendingRequestsRef.current.delete(id);
            setState({
              status: 'idle',
              progress: null,
              error: null,
            });
          }
          break;

        case 'error':
          if (pending) {
            pending.reject(new Error(payload as string));
            pendingRequestsRef.current.delete(id);
          }
          setState({
            status: 'error',
            progress: null,
            error: payload as string,
          });
          break;
      }
    };

    worker.onerror = (event) => {
      console.error('Worker error:', event);
      setState({
        status: 'error',
        progress: null,
        error: event.message || 'Worker error',
      });

      // Reject all pending requests
      for (const [id, pending] of pendingRequestsRef.current) {
        pending.reject(new Error('Worker error'));
        pendingRequestsRef.current.delete(id);
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Send solve request to worker
   */
  const solve = useCallback(async (
    params: DeviceParams,
    deviceType: DeviceType,
    bias: { Vgs: number; Vds: number; Vbs: number },
    temperature: number
  ): Promise<SolveResult> => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error('Worker not initialized');
    }

    const id = generateId();
    const request: SolveRequest = {
      params,
      deviceType,
      bias,
      temperature,
    };

    return new Promise((resolve, reject) => {
      pendingRequestsRef.current.set(id, { resolve: resolve as (value: unknown) => void, reject });

      setState({
        status: 'running',
        progress: null,
        error: null,
      });

      worker.postMessage({
        type: 'solve',
        id,
        payload: request,
      } as WorkerMessage);
    });
  }, []);

  /**
   * Send sweep request to worker
   */
  const sweep = useCallback(async (
    params: DeviceParams,
    deviceType: DeviceType,
    sweepType: 'transfer' | 'output',
    fixedV: number,
    sweepRange: { start: number; end: number; points: number },
    temperature: number,
    onPoint?: (point: PointUpdate) => void
  ): Promise<SweepResult> => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error('Worker not initialized');
    }

    const id = generateId();
    const request: SweepRequest = {
      params,
      deviceType,
      sweepType,
      fixedV,
      sweepRange,
      temperature,
    };

    return new Promise((resolve, reject) => {
      pendingRequestsRef.current.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onPoint,
      });

      setState({
        status: 'running',
        progress: null,
        error: null,
      });

      worker.postMessage({
        type: 'sweep',
        id,
        payload: request,
      } as WorkerMessage);
    });
  }, []);

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    worker.postMessage({
      type: 'cancel',
      id: '',
    } as WorkerMessage);

    // Reject all pending requests
    for (const [id, pending] of pendingRequestsRef.current) {
      pending.reject(new Error('Cancelled'));
      pendingRequestsRef.current.delete(id);
    }

    setState({
      status: 'idle',
      progress: null,
      error: null,
    });
  }, []);

  return {
    state,
    solve,
    sweep,
    cancel,
  };
}
