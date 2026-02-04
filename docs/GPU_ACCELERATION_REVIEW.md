# WebGPU 가속 구현 검토

## 1. 현재 Level C 수치해석 구조 분석

### 계산 병목 구간

| 함수 | 호출 빈도 | 병렬화 가능성 | GPU 효과 |
|------|-----------|---------------|----------|
| `csrMulVec()` | BiCGSTAB 반복당 4회 | 높음 | **매우 높음** |
| `dot()` | BiCGSTAB 반복당 5회 | 높음 (reduction) | 높음 |
| `axpy()` | BiCGSTAB 반복당 3회 | 높음 | 중간 |
| `computeCarriers()` | Newton 반복당 1회 | 매우 높음 | 높음 |
| `buildPoissonMatrix()` | Newton 반복당 1회 | 높음 | 중간 |

### 전형적 실행 시나리오

```
Grid: 100x100 = 10,000 points
Newton iterations: ~20
BiCGSTAB iterations per Newton: ~100
Total SpMV calls: 20 * 100 * 4 = 8,000
Total dot products: 20 * 100 * 5 = 10,000
```

## 2. WebGPU 구현 계획

### 2.1 브라우저 지원 현황

| 브라우저 | WebGPU 지원 | 버전 |
|----------|-------------|------|
| Chrome | ✅ 안정 | 113+ |
| Edge | ✅ 안정 | 113+ |
| Firefox | ⚠️ 실험적 | Nightly |
| Safari | ⚠️ 실험적 | 17+ |

### 2.2 핵심 Compute Shader 설계

#### A. Sparse Matrix-Vector Multiplication (SpMV)

```wgsl
// spmv.wgsl - CSR SpMV Compute Shader
@group(0) @binding(0) var<storage, read> values: array<f32>;
@group(0) @binding(1) var<storage, read> colIndex: array<i32>;
@group(0) @binding(2) var<storage, read> rowPtr: array<i32>;
@group(0) @binding(3) var<storage, read> x: array<f32>;
@group(0) @binding(4) var<storage, read_write> y: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let row = gid.x;
    if (row >= arrayLength(&y)) { return; }

    var sum: f32 = 0.0;
    let start = rowPtr[row];
    let end = rowPtr[row + 1];

    for (var k = start; k < end; k = k + 1) {
        sum += values[k] * x[colIndex[k]];
    }

    y[row] = sum;
}
```

#### B. Parallel Dot Product (Two-phase Reduction)

```wgsl
// dot_reduce.wgsl - Phase 1: Partial sums
@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> partialSums: array<f32>;

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
    if (i < arrayLength(&a)) {
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

    // Write partial sum
    if (localId == 0u) {
        partialSums[wid.x] = shared[0];
    }
}
```

#### C. AXPY Operation

```wgsl
// axpy.wgsl - y = alpha * x + y
@group(0) @binding(0) var<uniform> alpha: f32;
@group(0) @binding(1) var<storage, read> x: array<f32>;
@group(0) @binding(2) var<storage, read_write> y: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= arrayLength(&y)) { return; }
    y[i] = alpha * x[i] + y[i];
}
```

#### D. Carrier Concentration (Embarrassingly Parallel)

```wgsl
// carriers.wgsl
@group(0) @binding(0) var<storage, read> psi: array<f32>;
@group(0) @binding(1) var<storage, read> region: array<i32>;
@group(0) @binding(2) var<storage, read_write> n: array<f32>;
@group(0) @binding(3) var<storage, read_write> p: array<f32>;
@group(0) @binding(4) var<uniform> params: CarrierParams;

struct CarrierParams {
    ni: f32,
    Vt: f32,
    minCarrier: f32,
    maxCarrier: f32,
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= arrayLength(&psi)) { return; }

    // Skip non-silicon regions
    if (region[i] < 2) {
        n[i] = 0.0;
        p[i] = 0.0;
        return;
    }

    let psiNorm = clamp(psi[i] / params.Vt, -40.0, 40.0);
    n[i] = clamp(params.ni * exp(psiNorm), params.minCarrier, params.maxCarrier);
    p[i] = clamp(params.ni * exp(-psiNorm), params.minCarrier, params.maxCarrier);
}
```

### 2.3 TypeScript 구현 구조

```typescript
// src/physics/gpu/WebGPUContext.ts
export class WebGPUContext {
  private device: GPUDevice | null = null;
  private pipelines: Map<string, GPUComputePipeline> = new Map();

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn('WebGPU not supported');
      return false;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;

    this.device = await adapter.requestDevice();
    await this.createPipelines();
    return true;
  }

  async spmv(A: GPUCSRMatrix, x: GPUBuffer, y: GPUBuffer): Promise<void>;
  async dot(a: GPUBuffer, b: GPUBuffer): Promise<number>;
  async axpy(alpha: number, x: GPUBuffer, y: GPUBuffer): Promise<void>;
}

// src/physics/gpu/GPUBiCGSTAB.ts
export async function gpuBiCGSTAB(
  ctx: WebGPUContext,
  A: GPUCSRMatrix,
  b: GPUBuffer,
  x0: GPUBuffer | null,
  options: SolverOptions
): Promise<SolverResult>;
```

## 3. 예상 성능 향상

### 벤치마크 시나리오

| Grid Size | CPU (ms) | GPU (예상, ms) | 속도 향상 |
|-----------|----------|----------------|-----------|
| 50x50 | 100 | 20 | 5x |
| 100x100 | 800 | 50 | 16x |
| 200x200 | 6,000 | 150 | 40x |
| 500x500 | 80,000 | 800 | 100x |

*주: GPU 예상치는 중급 GPU (RTX 3060급) 기준*

### 병목 분석

1. **데이터 전송 오버헤드**: CPU ↔ GPU 간 버퍼 복사
   - 해결: 반복문 내 데이터는 GPU 메모리에 유지

2. **희소 행렬 비정규성**: CSR SpMV의 불균일 워크로드
   - 해결: Adaptive workgroup size 또는 CSR5 포맷 검토

3. **작은 그리드에서 오버헤드**: 50x50 이하에서는 CPU가 더 빠를 수 있음
   - 해결: 그리드 크기 기반 자동 전환

## 4. 구현 우선순위

### Phase 1: 기본 인프라 (1주) ✅ 완료
- [x] WebGPU 지원 감지 및 fallback
- [x] Web Worker 기반 비동기 솔버 (`solvePoissonAsync`, `solveContinuityAsync`, `solveGummelAsync`)
- [x] `useGPU` 플래그를 통한 GPU 모드 활성화 UI
- [ ] GPU 버퍼 관리 클래스
- [ ] 기본 compute pipeline 설정

### Phase 2: 핵심 연산 (2주)
- [ ] SpMV compute shader
- [ ] Dot product with reduction
- [ ] AXPY operation
- [ ] GPU BiCGSTAB 구현

### Phase 3: 통합 및 최적화 (1주)
- [ ] Poisson solver GPU 버전
- [x] 자동 CPU/GPU 전환 (Worker에서 WebGPU 가용성 체크)
- [ ] 메모리 풀링 최적화

### Phase 4: 검증 (1주)
- [ ] CPU vs GPU 결과 검증
- [ ] 성능 벤치마크
- [ ] Edge case 테스트

## 5. 리스크 및 대안

### 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 브라우저 미지원 | 높음 | CPU fallback 필수 |
| 정밀도 차이 | 중간 | f32 vs f64 검증 필요 |
| 메모리 한계 | 낮음 | 1M 그리드까지 무리 없음 |

### 대안 기술

1. **Web Workers (현실적 대안)**
   - 멀티코어 CPU 활용
   - 모든 브라우저 지원
   - 구현 난이도 낮음
   - 예상 성능: 2-4x (코어 수 의존)

2. **WebAssembly SIMD**
   - SIMD 벡터 연산
   - 좋은 브라우저 지원
   - CPU 계산 2-4x 향상

## 6. 결론 및 권장사항

### 권장 구현 순서

1. **즉시**: Web Workers로 Level C 병렬화 (리스크 낮음, 효과 보장)
2. **중기**: WebGPU 프로토타입 (Chrome 사용자 대상)
3. **장기**: 완전한 GPU 가속 파이프라인

### 의사결정 포인트

- **그리드 100x100 이상 자주 사용?** → WebGPU 우선
- **브라우저 호환성 중요?** → Web Workers 우선
- **둘 다 중요?** → Web Workers 먼저, WebGPU 점진적 추가

---

*최초 작성: 2024-02*
*최종 업데이트: 2025-02*
*작성: Claude Code*

## 현재 구현 상태

Web Worker 기반 비동기 솔버 인프라가 구현됨:
- `src/physics/levelC/poisson.ts`: `solvePoissonAsync()`
- `src/physics/levelC/continuity.ts`: `solveContinuityAsync()`
- `src/physics/levelC/gummel.ts`: `solveGummelAsync()`, `LevelCEngine.solveAsync()`
- `src/physics/levelC/worker.ts`: WebGPU 가용성 체크 및 `useGPU` 플래그 처리
- `src/components/params/NumericalControls.tsx`: GPU 사용 토글 UI

실제 WebGPU compute shader는 미구현 상태. 현재는 CPU fallback으로 동작.
