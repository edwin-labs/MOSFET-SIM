/**
 * WebGPU Context for MOSFET Simulation
 *
 * Manages GPU device, buffers, and compute pipelines for
 * accelerated numerical computation.
 */

import {
  spmvShader,
  axpyShader,
  dotPhase1Shader,
  dotPhase2Shader,
  copyShader,
  subtractShader,
  jacobiPrecondShader,
  carriersShader,
} from './shaders';

export interface GPUCSRMatrix {
  n: number;
  nnz: number;
  valuesBuffer: GPUBuffer;
  colIndexBuffer: GPUBuffer;
  rowPtrBuffer: GPUBuffer;
}

export interface GPUSolverResult {
  x: Float32Array;
  converged: boolean;
  iterations: number;
  residual: number;
}

type PipelineName =
  | 'spmv'
  | 'axpy'
  | 'dotPhase1'
  | 'dotPhase2'
  | 'copy'
  | 'subtract'
  | 'jacobiPrecond'
  | 'carriers';

export class WebGPUContext {
  private device: GPUDevice | null = null;
  private pipelines: Map<PipelineName, GPUComputePipeline> = new Map();
  private bindGroupLayouts: Map<PipelineName, GPUBindGroupLayout> = new Map();

  /** Check if WebGPU is available */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /** Initialize WebGPU device and pipelines */
  async initialize(): Promise<boolean> {
    if (!WebGPUContext.isSupported()) {
      console.warn('WebGPU not supported in this browser');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        console.warn('No WebGPU adapter found');
        return false;
      }

      this.device = await adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: 256 * 1024 * 1024, // 256MB
          maxBufferSize: 256 * 1024 * 1024,
        },
      });

      // Handle device loss
      this.device.lost.then((info) => {
        console.error('WebGPU device lost:', info.message);
        this.device = null;
      });

      await this.createPipelines();
      return true;
    } catch (error) {
      console.error('WebGPU initialization failed:', error);
      return false;
    }
  }

  /** Check if context is ready */
  isReady(): boolean {
    return this.device !== null;
  }

  /** Get the GPU device */
  getDevice(): GPUDevice {
    if (!this.device) {
      throw new Error('WebGPU not initialized');
    }
    return this.device;
  }

  /** Create all compute pipelines */
  private async createPipelines(): Promise<void> {
    if (!this.device) return;

    const shaderConfigs: {
      name: PipelineName;
      code: string;
      entryPoint: string;
    }[] = [
      { name: 'spmv', code: spmvShader, entryPoint: 'main' },
      { name: 'axpy', code: axpyShader, entryPoint: 'main' },
      { name: 'dotPhase1', code: dotPhase1Shader, entryPoint: 'main' },
      { name: 'dotPhase2', code: dotPhase2Shader, entryPoint: 'main' },
      { name: 'copy', code: copyShader, entryPoint: 'main' },
      { name: 'subtract', code: subtractShader, entryPoint: 'main' },
      { name: 'jacobiPrecond', code: jacobiPrecondShader, entryPoint: 'main' },
      { name: 'carriers', code: carriersShader, entryPoint: 'main' },
    ];

    for (const config of shaderConfigs) {
      const module = this.device.createShaderModule({ code: config.code });

      const pipeline = await this.device.createComputePipelineAsync({
        layout: 'auto',
        compute: {
          module,
          entryPoint: config.entryPoint,
        },
      });

      this.pipelines.set(config.name, pipeline);
      this.bindGroupLayouts.set(
        config.name,
        pipeline.getBindGroupLayout(0)
      );
    }
  }

  /** Create a GPU buffer from Float32Array */
  createBuffer(
    data: Float32Array | Uint32Array | Int32Array,
    usage: GPUBufferUsageFlags
  ): GPUBuffer {
    const device = this.getDevice();
    const buffer = device.createBuffer({
      size: data.byteLength,
      usage: usage | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    if (data instanceof Float32Array) {
      new Float32Array(buffer.getMappedRange()).set(data);
    } else if (data instanceof Uint32Array) {
      new Uint32Array(buffer.getMappedRange()).set(data);
    } else {
      new Int32Array(buffer.getMappedRange()).set(data);
    }

    buffer.unmap();
    return buffer;
  }

  /** Create an empty GPU buffer */
  createEmptyBuffer(size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    const device = this.getDevice();
    return device.createBuffer({
      size,
      usage: usage | GPUBufferUsage.COPY_DST,
    });
  }

  /** Create a uniform buffer with a single value */
  createUniformBuffer(size: number): GPUBuffer {
    const device = this.getDevice();
    return device.createBuffer({
      size: Math.max(size, 16), // Minimum 16 bytes for uniform buffers
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /** Upload CSR matrix to GPU */
  uploadCSRMatrix(
    values: Float32Array,
    colIndex: Uint32Array,
    rowPtr: Uint32Array,
    n: number
  ): GPUCSRMatrix {
    return {
      n,
      nnz: values.length,
      valuesBuffer: this.createBuffer(
        values,
        GPUBufferUsage.STORAGE
      ),
      colIndexBuffer: this.createBuffer(
        colIndex,
        GPUBufferUsage.STORAGE
      ),
      rowPtrBuffer: this.createBuffer(
        rowPtr,
        GPUBufferUsage.STORAGE
      ),
    };
  }

  /** Sparse matrix-vector multiplication: y = A * x */
  async spmv(
    matrix: GPUCSRMatrix,
    x: GPUBuffer,
    y: GPUBuffer
  ): Promise<void> {
    const device = this.getDevice();
    const pipeline = this.pipelines.get('spmv')!;
    const layout = this.bindGroupLayouts.get('spmv')!;

    // Create uniform buffer for size
    const sizeBuffer = this.createUniformBuffer(4);
    device.queue.writeBuffer(sizeBuffer, 0, new Uint32Array([matrix.n]));

    const bindGroup = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: matrix.valuesBuffer } },
        { binding: 1, resource: { buffer: matrix.colIndexBuffer } },
        { binding: 2, resource: { buffer: matrix.rowPtrBuffer } },
        { binding: 3, resource: { buffer: x } },
        { binding: 4, resource: { buffer: y } },
        { binding: 5, resource: { buffer: sizeBuffer } },
      ],
    });

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(matrix.n / 256));
    pass.end();

    device.queue.submit([commandEncoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    sizeBuffer.destroy();
  }

  /** Dot product: result = a · b */
  async dot(a: GPUBuffer, b: GPUBuffer, size: number): Promise<number> {
    const device = this.getDevice();
    const numWorkgroups = Math.ceil(size / 256);

    // Phase 1: Partial sums
    const partialSumsBuffer = this.createEmptyBuffer(
      numWorkgroups * 4,
      GPUBufferUsage.STORAGE
    );

    const sizeBuffer = this.createUniformBuffer(4);
    device.queue.writeBuffer(sizeBuffer, 0, new Uint32Array([size]));

    const phase1Pipeline = this.pipelines.get('dotPhase1')!;
    const phase1Layout = this.bindGroupLayouts.get('dotPhase1')!;

    const phase1BindGroup = device.createBindGroup({
      layout: phase1Layout,
      entries: [
        { binding: 0, resource: { buffer: a } },
        { binding: 1, resource: { buffer: b } },
        { binding: 2, resource: { buffer: partialSumsBuffer } },
        { binding: 3, resource: { buffer: sizeBuffer } },
      ],
    });

    // Phase 2: Final reduction
    const resultBuffer = this.createEmptyBuffer(
      4,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    const numPartialsBuffer = this.createUniformBuffer(4);
    device.queue.writeBuffer(
      numPartialsBuffer,
      0,
      new Uint32Array([numWorkgroups])
    );

    const phase2Pipeline = this.pipelines.get('dotPhase2')!;
    const phase2Layout = this.bindGroupLayouts.get('dotPhase2')!;

    const phase2BindGroup = device.createBindGroup({
      layout: phase2Layout,
      entries: [
        { binding: 0, resource: { buffer: partialSumsBuffer } },
        { binding: 1, resource: { buffer: resultBuffer } },
        { binding: 2, resource: { buffer: numPartialsBuffer } },
      ],
    });

    // Execute
    const commandEncoder = device.createCommandEncoder();

    const pass1 = commandEncoder.beginComputePass();
    pass1.setPipeline(phase1Pipeline);
    pass1.setBindGroup(0, phase1BindGroup);
    pass1.dispatchWorkgroups(numWorkgroups);
    pass1.end();

    const pass2 = commandEncoder.beginComputePass();
    pass2.setPipeline(phase2Pipeline);
    pass2.setBindGroup(0, phase2BindGroup);
    pass2.dispatchWorkgroups(1);
    pass2.end();

    // Read result
    const readBuffer = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    commandEncoder.copyBufferToBuffer(resultBuffer, 0, readBuffer, 0, 4);

    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuffer.getMappedRange())[0];
    readBuffer.unmap();

    // Cleanup
    partialSumsBuffer.destroy();
    sizeBuffer.destroy();
    numPartialsBuffer.destroy();
    resultBuffer.destroy();
    readBuffer.destroy();

    return result;
  }

  /** AXPY: y = alpha * x + y */
  async axpy(alpha: number, x: GPUBuffer, y: GPUBuffer, size: number): Promise<void> {
    const device = this.getDevice();
    const pipeline = this.pipelines.get('axpy')!;
    const layout = this.bindGroupLayouts.get('axpy')!;

    const paramsBuffer = this.createUniformBuffer(8);
    device.queue.writeBuffer(
      paramsBuffer,
      0,
      new Float32Array([alpha])
    );
    device.queue.writeBuffer(
      paramsBuffer,
      4,
      new Uint32Array([size])
    );

    const bindGroup = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: paramsBuffer } },
        { binding: 1, resource: { buffer: x } },
        { binding: 2, resource: { buffer: y } },
      ],
    });

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(size / 256));
    pass.end();

    device.queue.submit([commandEncoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    paramsBuffer.destroy();
  }

  /** Read buffer data back to CPU */
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Float32Array> {
    const device = this.getDevice();

    const readBuffer = device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size);
    device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();
    readBuffer.destroy();

    return result;
  }

  /** Write data to buffer */
  writeBuffer(buffer: GPUBuffer, data: Float32Array): void {
    const device = this.getDevice();
    device.queue.writeBuffer(buffer, 0, data);
  }

  /** Destroy context and release resources */
  destroy(): void {
    this.pipelines.clear();
    this.bindGroupLayouts.clear();
    this.device = null;
  }
}

/** Singleton instance */
let gpuContext: WebGPUContext | null = null;

/** Get or create the WebGPU context */
export async function getGPUContext(): Promise<WebGPUContext | null> {
  if (gpuContext?.isReady()) {
    return gpuContext;
  }

  gpuContext = new WebGPUContext();
  const success = await gpuContext.initialize();

  if (!success) {
    gpuContext = null;
    return null;
  }

  return gpuContext;
}

/** Check if GPU acceleration is available */
export function isGPUAvailable(): boolean {
  return gpuContext?.isReady() ?? false;
}
