/**
 * GPU Benchmark Component
 *
 * Tests and compares CPU vs GPU solver performance
 */

import { useState } from 'react';
import { getGPUInfo } from '../../physics/gpu';
import { CSRBuilder, biCGSTAB, solve } from '../../physics/levelC/sparseSolver';

interface BenchmarkResult {
  name: string;
  time: number;
  iterations: number;
  converged: boolean;
  residual: number;
}

interface GPUInfo {
  available: boolean;
  adapter?: string;
  device?: string;
  maxBufferSize?: number;
}

/**
 * Generate a test sparse matrix (Laplacian-like)
 */
function generateTestMatrix(n: number): { A: ReturnType<CSRBuilder['build']>; b: Float64Array } {
  const builder = new CSRBuilder(n * n);
  const b = new Float64Array(n * n);

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const idx = j * n + i;

      // 5-point stencil Laplacian
      let diag = 4;

      if (i > 0) {
        builder.set(idx, idx - 1, -1);
      } else {
        diag -= 1;
      }

      if (i < n - 1) {
        builder.set(idx, idx + 1, -1);
      } else {
        diag -= 1;
      }

      if (j > 0) {
        builder.set(idx, idx - n, -1);
      } else {
        diag -= 1;
      }

      if (j < n - 1) {
        builder.set(idx, idx + n, -1);
      } else {
        diag -= 1;
      }

      builder.set(idx, idx, diag);

      // RHS: simple pattern
      b[idx] = Math.sin((i + 1) * Math.PI / (n + 1)) * Math.sin((j + 1) * Math.PI / (n + 1));
    }
  }

  return { A: builder.build(), b };
}

export function GPUBenchmark() {
  const [gpuInfo, setGpuInfo] = useState<GPUInfo | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [matrixSize, setMatrixSize] = useState(50);
  const [progress, setProgress] = useState('');

  const checkGPU = async () => {
    setProgress('Checking GPU...');
    const info = await getGPUInfo();
    setGpuInfo(info);
    setProgress(info.available ? 'GPU available' : 'GPU not available');
  };

  const runBenchmark = async () => {
    setRunning(true);
    setResults([]);
    const newResults: BenchmarkResult[] = [];

    try {
      // Generate test matrix
      setProgress(`Generating ${matrixSize}x${matrixSize} test matrix...`);
      const { A, b } = generateTestMatrix(matrixSize);
      const totalSize = matrixSize * matrixSize;

      setProgress(`Matrix size: ${totalSize} unknowns, ${A.nnz} non-zeros`);

      // CPU benchmark
      setProgress('Running CPU solver...');
      const cpuStart = performance.now();
      const cpuResult = biCGSTAB(A, b, null, { maxIter: 1000, tolerance: 1e-8 });
      const cpuTime = performance.now() - cpuStart;

      newResults.push({
        name: 'CPU (BiCGSTAB)',
        time: cpuTime,
        iterations: cpuResult.iterations,
        converged: cpuResult.converged,
        residual: cpuResult.residual,
      });
      setResults([...newResults]);

      // GPU benchmark
      setProgress('Running GPU solver...');
      const gpuStart = performance.now();
      const gpuResult = await solve(A, b, null, { maxIter: 1000, tolerance: 1e-8, useGPU: true });
      const gpuTime = performance.now() - gpuStart;

      newResults.push({
        name: 'GPU (WebGPU BiCGSTAB)',
        time: gpuTime,
        iterations: gpuResult.iterations,
        converged: gpuResult.converged,
        residual: gpuResult.residual,
      });
      setResults([...newResults]);

      // Calculate speedup
      const speedup = cpuTime / gpuTime;
      setProgress(`Complete! GPU speedup: ${speedup.toFixed(2)}x`);

    } catch (error) {
      setProgress(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setRunning(false);
  };

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div style={{
      padding: '1rem',
      background: isDark ? '#1a1a2e' : '#fff',
      color: isDark ? '#e0e0e0' : '#1a1a2e',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>GPU Solver Benchmark</h3>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={checkGPU}
          disabled={running}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            cursor: running ? 'not-allowed' : 'pointer',
            background: isDark ? '#2d2d44' : '#e0e0e0',
            color: isDark ? '#e0e0e0' : '#1a1a2e',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Check GPU
        </button>

        <label style={{ marginRight: '0.5rem' }}>
          Grid size:
          <input
            type="number"
            value={matrixSize}
            onChange={(e) => setMatrixSize(Math.max(10, Math.min(200, parseInt(e.target.value) || 50)))}
            disabled={running}
            style={{
              width: '60px',
              marginLeft: '0.5rem',
              padding: '0.25rem',
              background: isDark ? '#2d2d44' : '#fff',
              color: isDark ? '#e0e0e0' : '#1a1a2e',
              border: `1px solid ${isDark ? '#444' : '#ccc'}`,
              borderRadius: '4px',
            }}
          />
        </label>

        <button
          onClick={runBenchmark}
          disabled={running}
          style={{
            padding: '0.5rem 1rem',
            cursor: running ? 'not-allowed' : 'pointer',
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {running ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {gpuInfo && (
        <div style={{
          padding: '0.5rem',
          marginBottom: '1rem',
          background: isDark ? '#2d2d44' : '#f0f0f0',
          borderRadius: '4px',
        }}>
          <div>GPU Available: {gpuInfo.available ? 'Yes' : 'No'}</div>
          {gpuInfo.available && (
            <>
              <div>Adapter: {gpuInfo.adapter}</div>
              <div>Device: {gpuInfo.device}</div>
              <div>Max Buffer: {((gpuInfo.maxBufferSize || 0) / 1024 / 1024).toFixed(0)} MB</div>
            </>
          )}
        </div>
      )}

      {progress && (
        <div style={{
          padding: '0.5rem',
          marginBottom: '1rem',
          background: isDark ? '#1e3a5f' : '#e3f2fd',
          borderRadius: '4px',
        }}>
          {progress}
        </div>
      )}

      {results.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${isDark ? '#444' : '#ccc'}` }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Solver</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Time (ms)</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Iterations</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Residual</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Converged</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${isDark ? '#333' : '#eee'}` }}>
                <td style={{ padding: '0.5rem' }}>{r.name}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.time.toFixed(1)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.iterations}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{r.residual.toExponential(2)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{r.converged ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
        <p>Note: First GPU run includes shader compilation overhead.</p>
        <p>Matrix: 2D Laplacian (5-point stencil), size = grid^2</p>
      </div>
    </div>
  );
}
