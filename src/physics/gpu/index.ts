/**
 * GPU-Accelerated Physics Module
 *
 * Provides WebGPU-based acceleration for numerical computations.
 * Falls back to CPU when WebGPU is not available.
 */

export { WebGPUContext, getGPUContext, isGPUAvailable } from './WebGPUContext';
export type { GPUCSRMatrix, GPUSolverResult } from './WebGPUContext';
export { gpuBiCGSTAB } from './GPUBiCGSTAB';
export type { GPUSolverOptions } from './GPUBiCGSTAB';

import { getGPUContext, WebGPUContext } from './WebGPUContext';
import { gpuBiCGSTAB, GPUSolverOptions } from './GPUBiCGSTAB';
import { biCGSTAB, CSRMatrix, SolverResult, SolverOptions } from '../levelC/sparseSolver';

/**
 * Hybrid solver that uses GPU when available, falls back to CPU
 */
export async function hybridBiCGSTAB(
  A: CSRMatrix,
  b: Float64Array,
  x0: Float64Array | null = null,
  options: Partial<SolverOptions> = {}
): Promise<SolverResult> {
  // Try GPU first
  const gpuCtx = await getGPUContext();

  if (gpuCtx) {
    try {
      // Convert Float64 to Float32 for GPU
      const A32 = {
        values: new Float32Array(A.values),
        colIndex: new Uint32Array(A.colIndex),
        rowPtr: new Uint32Array(A.rowPtr),
      };
      const b32 = new Float32Array(b);
      const x032 = x0 ? new Float32Array(x0) : null;

      // Upload matrix to GPU
      const gpuMatrix = gpuCtx.uploadCSRMatrix(
        A32.values,
        A32.colIndex,
        A32.rowPtr,
        A.n
      );

      const gpuOptions: Partial<GPUSolverOptions> = {
        maxIter: options.maxIter,
        tolerance: options.tolerance,
        verbose: options.verbose,
      };

      const gpuResult = await gpuBiCGSTAB(gpuCtx, gpuMatrix, b32, x032, gpuOptions);

      // Convert result back to Float64
      return {
        x: new Float64Array(gpuResult.x),
        converged: gpuResult.converged,
        iterations: gpuResult.iterations,
        residual: gpuResult.residual,
      };
    } catch (error) {
      console.warn('GPU solver failed, falling back to CPU:', error);
    }
  }

  // Fall back to CPU
  return biCGSTAB(A, b, x0, options);
}

/**
 * Check GPU capabilities and return info
 */
export async function getGPUInfo(): Promise<{
  available: boolean;
  adapter?: string;
  device?: string;
  maxBufferSize?: number;
}> {
  if (!WebGPUContext.isSupported()) {
    return { available: false };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { available: false };
    }

    // Note: requestAdapterInfo may not be available in all browsers
    // Use adapter.info if available (newer API)
    const info = (adapter as GPUAdapter & { info?: GPUAdapterInfo }).info;
    const device = await adapter.requestDevice();
    const limits = device.limits;

    device.destroy();

    return {
      available: true,
      adapter: info?.vendor || 'Unknown',
      device: info?.device || info?.description || 'Unknown',
      maxBufferSize: limits.maxBufferSize,
    };
  } catch {
    return { available: false };
  }
}
