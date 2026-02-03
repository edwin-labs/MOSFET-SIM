/**
 * Sparse Matrix Solver
 *
 * Implements:
 * - CSR (Compressed Sparse Row) format
 * - BiCGSTAB algorithm with Jacobi preconditioner
 * - SOR (Successive Over-Relaxation) as alternative
 */

/**
 * CSR (Compressed Sparse Row) Matrix Format
 */
export interface CSRMatrix {
  n: number;            // Matrix dimension (n x n)
  nnz: number;          // Number of non-zeros
  values: Float64Array; // Non-zero values
  colIndex: Int32Array; // Column indices
  rowPtr: Int32Array;   // Row pointers (length n+1)
}

/**
 * Create an empty CSR matrix builder
 */
export class CSRBuilder {
  private n: number;
  private rows: Map<number, number>[];

  constructor(n: number) {
    this.n = n;
    this.rows = [];
    for (let i = 0; i < n; i++) {
      this.rows.push(new Map());
    }
  }

  /**
   * Set matrix element A[i,j] = value
   * If value is 0, removes the entry
   */
  set(i: number, j: number, value: number): void {
    if (i < 0 || i >= this.n || j < 0 || j >= this.n) {
      throw new Error(`Index out of bounds: (${i}, ${j}) for n=${this.n}`);
    }
    if (Math.abs(value) < 1e-30) {
      this.rows[i].delete(j);
    } else {
      this.rows[i].set(j, value);
    }
  }

  /**
   * Add to matrix element A[i,j] += value
   */
  add(i: number, j: number, value: number): void {
    const current = this.rows[i].get(j) || 0;
    this.set(i, j, current + value);
  }

  /**
   * Get matrix element A[i,j]
   */
  get(i: number, j: number): number {
    return this.rows[i].get(j) || 0;
  }

  /**
   * Build the CSR matrix
   */
  build(): CSRMatrix {
    let nnz = 0;
    for (const row of this.rows) {
      nnz += row.size;
    }

    const values = new Float64Array(nnz);
    const colIndex = new Int32Array(nnz);
    const rowPtr = new Int32Array(this.n + 1);

    let idx = 0;
    for (let i = 0; i < this.n; i++) {
      rowPtr[i] = idx;
      // Sort columns for each row
      const cols = Array.from(this.rows[i].keys()).sort((a, b) => a - b);
      for (const j of cols) {
        values[idx] = this.rows[i].get(j)!;
        colIndex[idx] = j;
        idx++;
      }
    }
    rowPtr[this.n] = nnz;

    return { n: this.n, nnz, values, colIndex, rowPtr };
  }

  /**
   * Reset all entries to zero
   */
  clear(): void {
    for (const row of this.rows) {
      row.clear();
    }
  }
}

/**
 * Sparse matrix-vector multiplication: y = A * x
 */
export function csrMulVec(A: CSRMatrix, x: Float64Array, y: Float64Array): void {
  for (let i = 0; i < A.n; i++) {
    let sum = 0;
    for (let k = A.rowPtr[i]; k < A.rowPtr[i + 1]; k++) {
      sum += A.values[k] * x[A.colIndex[k]];
    }
    y[i] = sum;
  }
}

/**
 * Vector dot product
 */
function dot(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Vector AXPY: y = a*x + y
 */
function axpy(a: number, x: Float64Array, y: Float64Array): void {
  for (let i = 0; i < x.length; i++) {
    y[i] += a * x[i];
  }
}

/**
 * Vector copy: y = x
 */
function copy(x: Float64Array, y: Float64Array): void {
  y.set(x);
}

/**
 * Vector scale: x = a * x
 */
function _scale(a: number, x: Float64Array): void {
  for (let i = 0; i < x.length; i++) {
    x[i] *= a;
  }
}
void _scale; // Prevent unused warning

/**
 * Extract diagonal for Jacobi preconditioner
 */
function extractDiagonal(A: CSRMatrix): Float64Array {
  const diag = new Float64Array(A.n);
  for (let i = 0; i < A.n; i++) {
    for (let k = A.rowPtr[i]; k < A.rowPtr[i + 1]; k++) {
      if (A.colIndex[k] === i) {
        diag[i] = A.values[k];
        break;
      }
    }
    // Prevent division by zero
    if (Math.abs(diag[i]) < 1e-30) {
      diag[i] = 1;
    }
  }
  return diag;
}

/**
 * Apply Jacobi preconditioner: y = M^{-1} * x where M = diag(A)
 */
function applyJacobiPrecond(diag: Float64Array, x: Float64Array, y: Float64Array): void {
  for (let i = 0; i < x.length; i++) {
    y[i] = x[i] / diag[i];
  }
}

export interface SolverResult {
  x: Float64Array;
  converged: boolean;
  iterations: number;
  residual: number;
}

export interface SolverOptions {
  maxIter: number;
  tolerance: number;
  verbose: boolean;
}

const DEFAULT_SOLVER_OPTIONS: SolverOptions = {
  maxIter: 1000,
  tolerance: 1e-8,
  verbose: false,
};

/**
 * BiCGSTAB solver with Jacobi preconditioner
 *
 * Solves A * x = b
 */
export function biCGSTAB(
  A: CSRMatrix,
  b: Float64Array,
  x0: Float64Array | null = null,
  options: Partial<SolverOptions> = {}
): SolverResult {
  const opts = { ...DEFAULT_SOLVER_OPTIONS, ...options };
  const n = A.n;

  // Initial guess
  const x = new Float64Array(n);
  if (x0) {
    copy(x0, x);
  }

  // Preconditioner (Jacobi)
  const diag = extractDiagonal(A);

  // Allocate work vectors
  const r = new Float64Array(n);
  const r0 = new Float64Array(n);
  const p = new Float64Array(n);
  const v = new Float64Array(n);
  const s = new Float64Array(n);
  const t = new Float64Array(n);
  const phat = new Float64Array(n);
  const shat = new Float64Array(n);

  // r = b - A*x
  csrMulVec(A, x, r);
  for (let i = 0; i < n; i++) {
    r[i] = b[i] - r[i];
  }

  // r0 = r (shadow residual)
  copy(r, r0);

  let rho = 1;
  let alpha = 1;
  let omega = 1;

  p.fill(0);
  v.fill(0);

  const normB = Math.sqrt(dot(b, b));
  if (normB < 1e-30) {
    return { x, converged: true, iterations: 0, residual: 0 };
  }

  let iter = 0;
  let residual = Math.sqrt(dot(r, r)) / normB;

  while (iter < opts.maxIter && residual > opts.tolerance) {
    const rhoNew = dot(r0, r);

    if (Math.abs(rhoNew) < 1e-30) {
      // Breakdown
      break;
    }

    const beta = (rhoNew / rho) * (alpha / omega);
    rho = rhoNew;

    // p = r + beta * (p - omega * v)
    for (let i = 0; i < n; i++) {
      p[i] = r[i] + beta * (p[i] - omega * v[i]);
    }

    // phat = M^{-1} * p
    applyJacobiPrecond(diag, p, phat);

    // v = A * phat
    csrMulVec(A, phat, v);

    // alpha = rho / (r0, v)
    const r0v = dot(r0, v);
    if (Math.abs(r0v) < 1e-30) {
      break;
    }
    alpha = rho / r0v;

    // s = r - alpha * v
    for (let i = 0; i < n; i++) {
      s[i] = r[i] - alpha * v[i];
    }

    // Check for early convergence
    const normS = Math.sqrt(dot(s, s));
    if (normS / normB < opts.tolerance) {
      // x = x + alpha * phat
      axpy(alpha, phat, x);
      residual = normS / normB;
      break;
    }

    // shat = M^{-1} * s
    applyJacobiPrecond(diag, s, shat);

    // t = A * shat
    csrMulVec(A, shat, t);

    // omega = (t, s) / (t, t)
    const tt = dot(t, t);
    if (Math.abs(tt) < 1e-30) {
      break;
    }
    omega = dot(t, s) / tt;

    // x = x + alpha * phat + omega * shat
    axpy(alpha, phat, x);
    axpy(omega, shat, x);

    // r = s - omega * t
    for (let i = 0; i < n; i++) {
      r[i] = s[i] - omega * t[i];
    }

    residual = Math.sqrt(dot(r, r)) / normB;
    iter++;

    if (opts.verbose && iter % 100 === 0) {
      console.log(`BiCGSTAB iter ${iter}: residual = ${residual.toExponential(3)}`);
    }
  }

  return {
    x,
    converged: residual <= opts.tolerance,
    iterations: iter,
    residual,
  };
}

/**
 * SOR (Successive Over-Relaxation) solver
 *
 * Simpler but potentially slower than BiCGSTAB
 */
export function sor(
  A: CSRMatrix,
  b: Float64Array,
  x0: Float64Array | null = null,
  omega: number = 1.5,
  options: Partial<SolverOptions> = {}
): SolverResult {
  const opts = { ...DEFAULT_SOLVER_OPTIONS, ...options };
  const n = A.n;

  // Initial guess
  const x = new Float64Array(n);
  if (x0) {
    copy(x0, x);
  }

  // Extract diagonal
  const diag = extractDiagonal(A);

  const normB = Math.sqrt(dot(b, b));
  if (normB < 1e-30) {
    return { x, converged: true, iterations: 0, residual: 0 };
  }

  let iter = 0;
  let residual = Infinity;
  const r = new Float64Array(n);

  while (iter < opts.maxIter && residual > opts.tolerance) {
    // Gauss-Seidel sweep with SOR
    for (let i = 0; i < n; i++) {
      let sigma = 0;
      for (let k = A.rowPtr[i]; k < A.rowPtr[i + 1]; k++) {
        const j = A.colIndex[k];
        if (j !== i) {
          sigma += A.values[k] * x[j];
        }
      }
      const xNew = (b[i] - sigma) / diag[i];
      x[i] = x[i] + omega * (xNew - x[i]);
    }

    // Compute residual every 10 iterations
    if (iter % 10 === 0) {
      csrMulVec(A, x, r);
      for (let i = 0; i < n; i++) {
        r[i] = b[i] - r[i];
      }
      residual = Math.sqrt(dot(r, r)) / normB;
    }

    iter++;
  }

  // Final residual
  csrMulVec(A, x, r);
  for (let i = 0; i < n; i++) {
    r[i] = b[i] - r[i];
  }
  residual = Math.sqrt(dot(r, r)) / normB;

  return {
    x,
    converged: residual <= opts.tolerance,
    iterations: iter,
    residual,
  };
}
