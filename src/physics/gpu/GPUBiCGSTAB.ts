/**
 * GPU-Accelerated BiCGSTAB Solver
 *
 * Implements BiCGSTAB (Bi-Conjugate Gradient Stabilized) algorithm
 * using WebGPU for sparse matrix operations.
 */

import { WebGPUContext, GPUCSRMatrix, GPUSolverResult } from './WebGPUContext';

export interface GPUSolverOptions {
  maxIter: number;
  tolerance: number;
  verbose: boolean;
}

const DEFAULT_OPTIONS: GPUSolverOptions = {
  maxIter: 1000,
  tolerance: 1e-8,
  verbose: false,
};

/**
 * GPU-accelerated BiCGSTAB solver
 *
 * Solves A * x = b using WebGPU compute shaders
 */
export async function gpuBiCGSTAB(
  ctx: WebGPUContext,
  matrix: GPUCSRMatrix,
  b: Float32Array,
  x0: Float32Array | null = null,
  options: Partial<GPUSolverOptions> = {}
): Promise<GPUSolverResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const n = matrix.n;

  // Create GPU buffers for all vectors
  const buffers = {
    x: ctx.createBuffer(
      x0 ?? new Float32Array(n),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    ),
    b: ctx.createBuffer(b, GPUBufferUsage.STORAGE),
    r: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    r0: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    p: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    v: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    s: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    t: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    phat: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    shat: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
    temp: ctx.createEmptyBuffer(n * 4, GPUBufferUsage.STORAGE),
  };

  // Extract diagonal for Jacobi preconditioner
  // For now, we'll compute this on CPU and upload
  const diag = await extractDiagonalGPU(ctx, matrix);
  const diagBuffer = ctx.createBuffer(diag, GPUBufferUsage.STORAGE);

  try {
    // r = b - A*x
    await ctx.spmv(matrix, buffers.x, buffers.temp);
    await subtractVectors(ctx, buffers.b, buffers.temp, buffers.r, n);

    // r0 = r (shadow residual)
    await copyVector(ctx, buffers.r, buffers.r0, n);

    // Initialize scalars
    let rho = 1;
    let alpha = 1;
    let omega = 1;

    // Initialize p and v to zero (already zeroed)

    // Compute ||b||
    const normB = Math.sqrt(await ctx.dot(buffers.b, buffers.b, n));
    if (normB < 1e-30) {
      const x = await ctx.readBuffer(buffers.x, n * 4);
      return { x, converged: true, iterations: 0, residual: 0 };
    }

    let iter = 0;
    let residual = Math.sqrt(await ctx.dot(buffers.r, buffers.r, n)) / normB;

    while (iter < opts.maxIter && residual > opts.tolerance) {
      // rho_new = (r0, r)
      const rhoNew = await ctx.dot(buffers.r0, buffers.r, n);

      if (Math.abs(rhoNew) < 1e-30) {
        if (opts.verbose) console.log('BiCGSTAB: breakdown (rho)');
        break;
      }

      const beta = (rhoNew / rho) * (alpha / omega);
      rho = rhoNew;

      // p = r + beta * (p - omega * v)
      await bicgstabPUpdate(ctx, buffers.r, buffers.p, buffers.v, beta, omega, n);

      // phat = M^{-1} * p (Jacobi preconditioner)
      await applyJacobiPrecond(ctx, buffers.p, diagBuffer, buffers.phat, n);

      // v = A * phat
      await ctx.spmv(matrix, buffers.phat, buffers.v);

      // alpha = rho / (r0, v)
      const r0v = await ctx.dot(buffers.r0, buffers.v, n);
      if (Math.abs(r0v) < 1e-30) {
        if (opts.verbose) console.log('BiCGSTAB: breakdown (r0v)');
        break;
      }
      alpha = rho / r0v;

      // s = r - alpha * v
      await bicgstabSUpdate(ctx, buffers.r, buffers.v, buffers.s, alpha, n);

      // Check for early convergence
      const normS = Math.sqrt(await ctx.dot(buffers.s, buffers.s, n));
      if (normS / normB < opts.tolerance) {
        // x = x + alpha * phat
        await ctx.axpy(alpha, buffers.phat, buffers.x, n);
        residual = normS / normB;
        break;
      }

      // shat = M^{-1} * s
      await applyJacobiPrecond(ctx, buffers.s, diagBuffer, buffers.shat, n);

      // t = A * shat
      await ctx.spmv(matrix, buffers.shat, buffers.t);

      // omega = (t, s) / (t, t)
      const tt = await ctx.dot(buffers.t, buffers.t, n);
      if (Math.abs(tt) < 1e-30) {
        if (opts.verbose) console.log('BiCGSTAB: breakdown (tt)');
        break;
      }
      const ts = await ctx.dot(buffers.t, buffers.s, n);
      omega = ts / tt;

      // x = x + alpha * phat + omega * shat
      await ctx.axpy(alpha, buffers.phat, buffers.x, n);
      await ctx.axpy(omega, buffers.shat, buffers.x, n);

      // r = s - omega * t
      await bicgstabRUpdate(ctx, buffers.s, buffers.t, buffers.r, omega, n);

      residual = Math.sqrt(await ctx.dot(buffers.r, buffers.r, n)) / normB;
      iter++;

      if (opts.verbose && iter % 100 === 0) {
        console.log(`GPU BiCGSTAB iter ${iter}: residual = ${residual.toExponential(3)}`);
      }
    }

    // Read result back to CPU
    const x = await ctx.readBuffer(buffers.x, n * 4);

    return {
      x,
      converged: residual <= opts.tolerance,
      iterations: iter,
      residual,
    };
  } finally {
    // Cleanup all buffers
    Object.values(buffers).forEach((buf) => buf.destroy());
    diagBuffer.destroy();
  }
}

/** Extract diagonal elements from CSR matrix (CPU implementation) */
async function extractDiagonalGPU(
  ctx: WebGPUContext,
  matrix: GPUCSRMatrix
): Promise<Float32Array> {
  // For now, read back and compute on CPU
  // TODO: Implement GPU kernel for diagonal extraction
  const device = ctx.getDevice();

  const valuesRead = device.createBuffer({
    size: matrix.nnz * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const colIndexRead = device.createBuffer({
    size: matrix.nnz * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const rowPtrRead = device.createBuffer({
    size: (matrix.n + 1) * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(matrix.valuesBuffer, 0, valuesRead, 0, matrix.nnz * 4);
  encoder.copyBufferToBuffer(matrix.colIndexBuffer, 0, colIndexRead, 0, matrix.nnz * 4);
  encoder.copyBufferToBuffer(matrix.rowPtrBuffer, 0, rowPtrRead, 0, (matrix.n + 1) * 4);
  device.queue.submit([encoder.finish()]);

  await valuesRead.mapAsync(GPUMapMode.READ);
  await colIndexRead.mapAsync(GPUMapMode.READ);
  await rowPtrRead.mapAsync(GPUMapMode.READ);

  const values = new Float32Array(valuesRead.getMappedRange().slice(0));
  const colIndex = new Uint32Array(colIndexRead.getMappedRange().slice(0));
  const rowPtr = new Uint32Array(rowPtrRead.getMappedRange().slice(0));

  valuesRead.unmap();
  colIndexRead.unmap();
  rowPtrRead.unmap();

  valuesRead.destroy();
  colIndexRead.destroy();
  rowPtrRead.destroy();

  // Extract diagonal
  const diag = new Float32Array(matrix.n);
  for (let i = 0; i < matrix.n; i++) {
    for (let k = rowPtr[i]; k < rowPtr[i + 1]; k++) {
      if (colIndex[k] === i) {
        diag[i] = values[k];
        break;
      }
    }
    if (Math.abs(diag[i]) < 1e-30) {
      diag[i] = 1;
    }
  }

  return diag;
}

/** Vector subtraction: r = a - b */
async function subtractVectors(
  ctx: WebGPUContext,
  a: GPUBuffer,
  b: GPUBuffer,
  r: GPUBuffer,
  n: number
): Promise<void> {
  // Use axpy: r = a + (-1) * b
  // First copy a to r, then axpy(-1, b, r)
  await copyVector(ctx, a, r, n);
  await ctx.axpy(-1, b, r, n);
}

/** Vector copy using GPU */
async function copyVector(
  ctx: WebGPUContext,
  src: GPUBuffer,
  dst: GPUBuffer,
  n: number
): Promise<void> {
  const device = ctx.getDevice();
  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(src, 0, dst, 0, n * 4);
  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone();
}

/** BiCGSTAB p update: p = r + beta * (p - omega * v) */
async function bicgstabPUpdate(
  ctx: WebGPUContext,
  r: GPUBuffer,
  p: GPUBuffer,
  v: GPUBuffer,
  beta: number,
  omega: number,
  n: number
): Promise<void> {
  // Implement as: p = r + beta*p - beta*omega*v
  // Step 1: p = beta * p
  // Step 2: p = p + r  (via axpy: p = 1*r + p)
  // Step 3: p = p - beta*omega*v (via axpy: p = -beta*omega*v + p)

  // For simplicity, we'll read/write for now
  // TODO: Create dedicated kernel for this
  const pData = await ctx.readBuffer(p, n * 4);
  const rData = await ctx.readBuffer(r, n * 4);
  const vData = await ctx.readBuffer(v, n * 4);

  for (let i = 0; i < n; i++) {
    pData[i] = rData[i] + beta * (pData[i] - omega * vData[i]);
  }

  ctx.writeBuffer(p, pData);
}

/** BiCGSTAB s update: s = r - alpha * v */
async function bicgstabSUpdate(
  ctx: WebGPUContext,
  r: GPUBuffer,
  v: GPUBuffer,
  s: GPUBuffer,
  alpha: number,
  n: number
): Promise<void> {
  await copyVector(ctx, r, s, n);
  await ctx.axpy(-alpha, v, s, n);
}

/** BiCGSTAB r update: r = s - omega * t */
async function bicgstabRUpdate(
  ctx: WebGPUContext,
  s: GPUBuffer,
  t: GPUBuffer,
  r: GPUBuffer,
  omega: number,
  n: number
): Promise<void> {
  await copyVector(ctx, s, r, n);
  await ctx.axpy(-omega, t, r, n);
}

/** Apply Jacobi preconditioner: y = x / diag */
async function applyJacobiPrecond(
  ctx: WebGPUContext,
  x: GPUBuffer,
  diag: GPUBuffer,
  y: GPUBuffer,
  n: number
): Promise<void> {
  // For simplicity, read/compute/write
  // TODO: Use jacobiPrecond shader
  const xData = await ctx.readBuffer(x, n * 4);
  const diagData = await ctx.readBuffer(diag, n * 4);

  const yData = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    yData[i] = xData[i] / diagData[i];
  }

  ctx.writeBuffer(y, yData);
}
