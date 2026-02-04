/**
 * WebGPU Compute Shaders for MOSFET Simulation
 *
 * WGSL shaders for GPU-accelerated numerical computation
 */

/** Sparse Matrix-Vector Multiplication (CSR format) */
export const spmvShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> values: array<f32>;
@group(0) @binding(1) var<storage, read> colIndex: array<u32>;
@group(0) @binding(2) var<storage, read> rowPtr: array<u32>;
@group(0) @binding(3) var<storage, read> x: array<f32>;
@group(0) @binding(4) var<storage, read_write> y: array<f32>;
@group(0) @binding(5) var<uniform> size: u32;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let row = gid.x;
    if (row >= size) { return; }

    var sum: f32 = 0.0;
    let start = rowPtr[row];
    let end = rowPtr[row + 1u];

    for (var k = start; k < end; k = k + 1u) {
        sum += values[k] * x[colIndex[k]];
    }

    y[row] = sum;
}
`;

/** AXPY: y = alpha * x + y */
export const axpyShader = /* wgsl */ `
struct Params {
    alpha: f32,
    size: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> x: array<f32>;
@group(0) @binding(2) var<storage, read_write> y: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= params.size) { return; }
    y[i] = params.alpha * x[i] + y[i];
}
`;

/** Dot product - Phase 1: Partial sums per workgroup */
export const dotPhase1Shader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> partialSums: array<f32>;
@group(0) @binding(3) var<uniform> size: u32;

var<workgroup> shared: array<f32, 256>;

@compute @workgroup_size(256)
fn main(
    @builtin(global_invocation_id) gid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
    @builtin(workgroup_id) wid: vec3<u32>
) {
    let i = gid.x;
    let localId = lid.x;

    // Load and multiply
    if (i < size) {
        shared[localId] = a[i] * b[i];
    } else {
        shared[localId] = 0.0;
    }

    workgroupBarrier();

    // Parallel reduction in shared memory
    for (var stride = 128u; stride > 0u; stride = stride >> 1u) {
        if (localId < stride) {
            shared[localId] += shared[localId + stride];
        }
        workgroupBarrier();
    }

    // Write partial sum from first thread in workgroup
    if (localId == 0u) {
        partialSums[wid.x] = shared[0];
    }
}
`;

/** Dot product - Phase 2: Final reduction */
export const dotPhase2Shader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> partialSums: array<f32>;
@group(0) @binding(1) var<storage, read_write> result: array<f32>;
@group(0) @binding(2) var<uniform> numPartials: u32;

var<workgroup> shared: array<f32, 256>;

@compute @workgroup_size(256)
fn main(
    @builtin(local_invocation_id) lid: vec3<u32>
) {
    let localId = lid.x;

    // Load partial sums
    if (localId < numPartials) {
        shared[localId] = partialSums[localId];
    } else {
        shared[localId] = 0.0;
    }

    workgroupBarrier();

    // Final reduction
    for (var stride = 128u; stride > 0u; stride = stride >> 1u) {
        if (localId < stride && localId + stride < numPartials) {
            shared[localId] += shared[localId + stride];
        }
        workgroupBarrier();
    }

    if (localId == 0u) {
        result[0] = shared[0];
    }
}
`;

/** Vector copy: y = x */
export const copyShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> x: array<f32>;
@group(0) @binding(1) var<storage, read_write> y: array<f32>;
@group(0) @binding(2) var<uniform> size: u32;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= size) { return; }
    y[i] = x[i];
}
`;

/** Vector subtraction: r = b - y (for residual calculation) */
export const subtractShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> b: array<f32>;
@group(0) @binding(1) var<storage, read> y: array<f32>;
@group(0) @binding(2) var<storage, read_write> r: array<f32>;
@group(0) @binding(3) var<uniform> size: u32;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= size) { return; }
    r[i] = b[i] - y[i];
}
`;

/** BiCGSTAB p update: p = r + beta * (p - omega * v) */
export const bicgstabPUpdateShader = /* wgsl */ `
struct Params {
    beta: f32,
    omega: f32,
    size: u32,
    _pad: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> r: array<f32>;
@group(0) @binding(2) var<storage, read> v: array<f32>;
@group(0) @binding(3) var<storage, read_write> p: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= params.size) { return; }
    p[i] = r[i] + params.beta * (p[i] - params.omega * v[i]);
}
`;

/** BiCGSTAB s calculation: s = r - alpha * v */
export const bicgstabSUpdateShader = /* wgsl */ `
struct Params {
    alpha: f32,
    size: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> r: array<f32>;
@group(0) @binding(2) var<storage, read> v: array<f32>;
@group(0) @binding(3) var<storage, read_write> s: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= params.size) { return; }
    s[i] = r[i] - params.alpha * v[i];
}
`;

/** Carrier concentration calculation */
export const carriersShader = /* wgsl */ `
struct Params {
    ni: f32,
    Vt: f32,
    minCarrier: f32,
    maxCarrier: f32,
    size: u32,
    _pad1: u32,
    _pad2: u32,
    _pad3: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> psi: array<f32>;
@group(0) @binding(2) var<storage, read> region: array<i32>;
@group(0) @binding(3) var<storage, read_write> n: array<f32>;
@group(0) @binding(4) var<storage, read_write> p: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= params.size) { return; }

    // Skip non-silicon regions (region < 2)
    if (region[i] < 2) {
        n[i] = 0.0;
        p[i] = 0.0;
        return;
    }

    let psiNorm = clamp(psi[i] / params.Vt, -40.0, 40.0);
    n[i] = clamp(params.ni * exp(psiNorm), params.minCarrier, params.maxCarrier);
    p[i] = clamp(params.ni * exp(-psiNorm), params.minCarrier, params.maxCarrier);
}
`;

/** Jacobi preconditioner: y = x / diag */
export const jacobiPrecondShader = /* wgsl */ `
@group(0) @binding(0) var<storage, read> x: array<f32>;
@group(0) @binding(1) var<storage, read> diag: array<f32>;
@group(0) @binding(2) var<storage, read_write> y: array<f32>;
@group(0) @binding(3) var<uniform> size: u32;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= size) { return; }
    y[i] = x[i] / diag[i];
}
`;
