# TRD: MOSFET Junction Simulator
## Technical Requirements Document v2.0

---

## 1. 아키텍처 개요

### 1.1 기술 스택

| 레이어 | 기술 | 용도 |
|--------|------|------|
| 빌드 | Vite 5 | HMR, Worker 지원, 빠른 빌드 |
| UI | React 18 + TypeScript | 컴포넌트 기반 UI |
| 상태 | Zustand | 경량 전역 상태, 보일러플레이트 최소 |
| 3D | three + @types/three | MOSFET 3D 구조 렌더링 |
| 3D Controls | three/examples/jsm/controls/OrbitControls | 마우스 회전/줌/패닝 |
| 2D 플롯 | react-plotly.js + plotly.js | I-V, C-V, Band diagram |
| 2D 히트맵 | Canvas 2D API | 도핑 컬러맵, 단면 뷰 |
| Worker | Vite Web Worker | Level C 비동기 계산 |
| 스타일 | CSS Modules | 스코프된 스타일링 |

### 1.2 프로젝트 구조

```
mosfet-simulator/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx                          # React 마운트
│   ├── App.tsx                           # 최상위 레이아웃
│   ├── App.module.css
│   │
│   ├── types/                            # 공유 타입 정의
│   │   ├── device.ts                     # DeviceParams, ProcessParams, BiasConditions
│   │   ├── simulation.ts                 # SimulationResult, SweepData, Metrics
│   │   └── materials.ts                  # MaterialProperties, ImplantSpecies
│   │
│   ├── physics/                          # ★ 순수 TypeScript — React 무관
│   │   ├── constants.ts                  # 물리 상수 + 단위 변환
│   │   ├── materials.ts                  # 물질 DB + 온도 의존 함수
│   │   ├── levelA.ts                     # Shockley 해석 모델
│   │   ├── levelB.ts                     # Short-channel 반경험 모델
│   │   ├── levelC/                       # 수치 해석 (Worker에서 실행)
│   │   │   ├── mesh.ts                   # 2D 메쉬 생성
│   │   │   ├── poisson.ts               # Poisson solver
│   │   │   ├── continuity.ts            # Drift-Diffusion + S-G
│   │   │   ├── gummel.ts               # Gummel iteration
│   │   │   └── sparseSolver.ts          # BiCGSTAB
│   │   ├── doping.ts                     # 도핑 프로파일 엔진
│   │   ├── sweep.ts                      # I-V, C-V sweep
│   │   └── worker.ts                     # Web Worker entry point
│   │
│   ├── store/                            # Zustand 상태 관리
│   │   ├── deviceStore.ts                # 소자 파라미터 + 모드
│   │   ├── simulationStore.ts            # 시뮬레이션 결과 + 상태
│   │   └── viewStore.ts                  # UI 뷰 설정 (colormap, theme 등)
│   │
│   ├── components/                       # React 컴포넌트
│   │   ├── layout/
│   │   │   ├── Toolbar.tsx               # 상단 제어 바
│   │   │   ├── Toolbar.module.css
│   │   │   ├── LeftSidebar.tsx           # 파라미터 입력
│   │   │   ├── LeftSidebar.module.css
│   │   │   ├── MainView.tsx              # 3D + 2D split
│   │   │   ├── MainView.module.css
│   │   │   ├── RightSidebar.tsx          # 플롯 + 대시보드
│   │   │   ├── RightSidebar.module.css
│   │   │   ├── StatusBar.tsx             # 하단 상태
│   │   │   └── StatusBar.module.css
│   │   │
│   │   ├── params/                       # 파라미터 입력 컴포넌트
│   │   │   ├── ParamSlider.tsx           # 슬라이더+입력 위젯
│   │   │   ├── ParamSlider.module.css
│   │   │   ├── ParamSection.tsx          # Collapsible 섹션
│   │   │   ├── ParamSection.module.css
│   │   │   ├── DeviceParams.tsx          # Device Mode 전체 패널
│   │   │   ├── ProcessParams.tsx         # Process Mode 전체 패널
│   │   │   └── BiasControls.tsx          # V_GS, V_DS, V_BS
│   │   │
│   │   ├── views/                        # 시각화 컴포넌트
│   │   │   ├── View3D.tsx                # Three.js 3D 뷰
│   │   │   ├── View3D.module.css
│   │   │   ├── View2DFront.tsx           # 종단면 (X-Z)
│   │   │   ├── View2DTop.tsx             # 상면 (X-Y)
│   │   │   ├── View2DSide.tsx            # 횡단면 (Y-Z)
│   │   │   └── View2D.module.css
│   │   │
│   │   └── plots/                        # Plotly 차트 컴포넌트
│   │       ├── IVPlot.tsx                # I_D-V_DS, I_D-V_GS
│   │       ├── CVPlot.tsx                # C-V curves
│   │       ├── BandDiagram.tsx           # Energy band
│   │       ├── DopingProfile.tsx         # 1D doping
│   │       ├── FieldPlots.tsx            # E-field, potential
│   │       ├── Dashboard.tsx             # 성능 지표
│   │       └── Plots.module.css
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useSimulation.ts              # 물리 계산 트리거 + debounce
│   │   ├── useWorker.ts                  # Web Worker 관리
│   │   └── useThreeJS.ts                 # Three.js lifecycle
│   │
│   └── utils/                            # 유틸리티
│       ├── colormap.ts                   # 컬러맵 생성 (viridis, diverging 등)
│       ├── units.ts                      # 단위 변환 + 포맷팅
│       └── export.ts                     # PNG, CSV, JSON 내보내기
```

### 1.3 아키텍처 다이어그램

```
┌─ React UI Layer ──────────────────────────────────────────────┐
│                                                                │
│  Toolbar ─── LeftSidebar ─── MainView ─── RightSidebar        │
│                  │            │    │           │                │
│                  │         View3D  View2D×3  Plots+Dashboard   │
│                  │                                             │
│                  ▼                                             │
│  ┌─ Zustand Stores ────────────────────────────────┐          │
│  │  deviceStore    simulationStore    viewStore     │          │
│  └──────┬──────────────┬───────────────────────────┘          │
│         │              │                                       │
│  ┌──────▼──────────────▼─── hooks ─────────────────┐          │
│  │  useSimulation (debounce + trigger)              │          │
│  │  useWorker (Level C async)                       │          │
│  └──────┬──────────────────────────────────────────┘          │
└─────────┼──────────────────────────────────────────────────────┘
          │
┌─────────▼──── Pure TypeScript Physics Layer ───────────────────┐
│                                                                 │
│  src/physics/ — NO React imports, NO DOM, NO side effects      │
│                                                                 │
│  constants.ts ──► materials.ts                                  │
│                      │                                          │
│                      ├──► levelA.ts ──► sweep.ts               │
│                      │       │                                  │
│                      ├──► levelB.ts ──► sweep.ts               │
│                      │                                          │
│                      ├──► doping.ts                             │
│                      │                                          │
│                      └──► levelC/                               │
│                            ├── mesh.ts                          │
│                            ├── poisson.ts                       │
│                            ├── continuity.ts                    │
│                            ├── gummel.ts                        │
│                            └── sparseSolver.ts                  │
│                                                                 │
│  worker.ts ← Web Worker entry (imports levelC/*)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈 상세 설계

### 2.1 types/ — 공유 타입 정의

#### types/device.ts
```typescript
export type DeviceType = 'nmos' | 'pmos';
export type PhysicsLevel = 'A' | 'B' | 'C';
export type InputMode = 'device' | 'process';
export type OxideMaterial = 'SiO2' | 'HfO2';
export type GateMaterial = 'poly-n' | 'poly-p' | 'TiN' | 'TaN';
export type SubstrateType = 'p-type' | 'n-type';
export type ImplantSpecies = 'B' | 'BF2' | 'P' | 'As';

export interface DeviceParams {
  gate: {
    oxideMaterial: OxideMaterial;
    tox: number;        // nm
    gateMaterial: GateMaterial;
    workFunction: number; // eV
    length: number;     // nm (L_eff)
  };
  channel: {
    doping: number;     // cm⁻³
    profileType: 'uniform' | 'gaussian' | 'retrograde';
  };
  sourceDrain: {
    doping: number;     // cm⁻³
    junctionDepth: number; // nm
    lddDoping: number;    // cm⁻³
    lddLength: number;    // nm
  };
  substrate: {
    type: SubstrateType;
    doping: number;     // cm⁻³
  };
  geometry: {
    width: number;      // nm
    overlapLength: number; // nm
  };
  advanced: {
    fixedCharge: number;      // cm⁻²
    interfaceTrapDensity: number; // cm⁻²eV⁻¹
    seriesResistanceS: number;    // Ω
    seriesResistanceD: number;    // Ω
  };
}

export interface ProcessParams {
  gateStack: { /* ... 7 params */ };
  well: { /* ... 6 params */ };
  vtAdjust: { /* ... 4 params */ };
  halo: { enabled: boolean; /* ... 3 params */ };
  sdMain: { /* ... 4 params */ };
  ldd: { /* ... 3 params */ };
  spacer: { width: number; material: string; };
  silicide: { enabled: boolean; /* ... */ };
  anneal: { type: string; temperature: number; time: number; activationRatio: number; };
  isolation: { type: string; stiDepth: number; stiWidth: number; activeWidth: number; };
}

export interface BiasConditions {
  vgs: number; // V
  vds: number; // V
  vbs: number; // V
}
```

#### types/simulation.ts
```typescript
export interface SweepCurve {
  label: string;
  x: number[];
  y: number[];
}

export interface IVResult {
  output: SweepCurve[];    // I_D vs V_DS (multiple V_GS)
  transfer: SweepCurve[];  // I_D vs V_GS (multiple V_DS)
  transferLog: SweepCurve[]; // log(I_D) vs V_GS
}

export interface CVResult {
  highFreq: { vg: number[]; c: number[] };
  lowFreq?: { vg: number[]; c: number[] };
}

export interface BandDiagramResult {
  vertical: { depth: number[]; Ec: number[]; Ev: number[]; Ef: number; Ei: number[] };
  lateral?: { position: number[]; Ec: number[]; Ev: number[]; EfN: number[]; EfP: number[] };
}

export interface DopingProfile2D {
  x: number[];     // nm
  z: number[];     // nm
  Nd: Float64Array; // [nx * nz] cm⁻³
  Na: Float64Array;
  Nnet: Float64Array;
}

export interface NumericalResult2D {
  psi: Float64Array;   // potential
  n: Float64Array;     // electron conc.
  p: Float64Array;     // hole conc.
  Ex: Float64Array;    // E-field x
  Ez: Float64Array;    // E-field z
}

export interface DeviceMetrics {
  Vth: number;        // V
  SS: number;         // mV/dec
  Ion: number;        // A
  Ioff: number;       // A
  IonIoffRatio: number;
  DIBL?: number;      // mV/V
  gmMax?: number;     // S
  Vdsat?: number;     // V
}

export interface SimulationState {
  status: 'idle' | 'computing' | 'done' | 'error';
  progress: number;    // 0~1
  calcTime: number;    // ms
  iv: IVResult | null;
  cv: CVResult | null;
  band: BandDiagramResult | null;
  doping2d: DopingProfile2D | null;
  numerical2d: NumericalResult2D | null;
  metrics: DeviceMetrics | null;
  error: string | null;
}
```

---

### 2.2 physics/constants.ts

```typescript
/** 물리 상수 (SI 단위) */
export const Q    = 1.602176634e-19;   // C — electron charge
export const K_B  = 1.380649e-23;      // J/K — Boltzmann constant
export const EPS0 = 8.8541878128e-12;  // F/m — vacuum permittivity
export const H    = 6.62607015e-34;    // J·s — Planck constant
export const HBAR = 1.054571817e-34;   // J·s — reduced Planck
export const M0   = 9.1093837015e-31;  // kg — electron rest mass

/** 열전압 */
export function thermalVoltage(T: number): number {
  return K_B * T / Q; // V
}

/** kT in eV */
export function kT_eV(T: number): number {
  return K_B * T / Q; // eV (numerically same as V_T)
}

/** 단위 변환 */
export const NM_TO_CM = 1e-7;
export const CM_TO_M  = 1e-2;
export const EV_TO_J  = Q; // 1 eV = Q joules
```

---

### 2.3 physics/materials.ts

```typescript
import { Q, K_B, EPS0, kT_eV } from './constants';
import type { OxideMaterial, GateMaterial } from '../types/device';

/** Silicon 파라미터 */
export const Si = {
  Eg_0:      1.166,        // eV (0K)
  Eg_alpha:  4.73e-4,      // eV/K — Varshni alpha
  Eg_beta:   636,          // K — Varshni beta
  eps_r:     11.7,
  chi:       4.05,         // eV — electron affinity
  Nc_300:    2.86e19,      // cm⁻³
  Nv_300:    3.10e19,      // cm⁻³
  ni_300:    1.07e10,      // cm⁻³
  mu_n_max:  1400,         // cm²/V·s (300K, low field)
  mu_p_max:  450,
  mu_n_min:  65,           // Caughey-Thomas minimum
  mu_p_min:  47,
  Nref_n:    8.5e16,       // cm⁻³ — Caughey-Thomas reference
  Nref_p:    6.3e16,
  alpha_n:   0.72,         // Caughey-Thomas exponent
  alpha_p:   0.76,
  vsat_n:    1.07e7,       // cm/s — electron saturation velocity
  vsat_p:    8.37e6,       // cm/s — hole saturation velocity
} as const;

/** Varshni bandgap: Eg(T) */
export function bandgapSi(T: number): number {
  return Si.Eg_0 - Si.Eg_alpha * T * T / (T + Si.Eg_beta);
}

/** Intrinsic carrier concentration: ni(T) */
export function niSi(T: number): number {
  const Eg = bandgapSi(T);
  const Nc = Si.Nc_300 * Math.pow(T / 300, 1.5);
  const Nv = Si.Nv_300 * Math.pow(T / 300, 1.5);
  return Math.sqrt(Nc * Nv) * Math.exp(-Eg / (2 * kT_eV(T)));
}

/** Caughey-Thomas mobility: μ(N_total, T) */
export function mobilityElectron(N_total: number, T: number): number {
  const mu_max = Si.mu_n_max * Math.pow(T / 300, -2.4);
  return Si.mu_n_min + (mu_max - Si.mu_n_min) /
    (1 + Math.pow(N_total / Si.Nref_n, Si.alpha_n));
}
export function mobilityHole(N_total: number, T: number): number {
  const mu_max = Si.mu_p_max * Math.pow(T / 300, -2.2);
  return Si.mu_p_min + (mu_max - Si.mu_p_min) /
    (1 + Math.pow(N_total / Si.Nref_p, Si.alpha_p));
}

/** Oxide 물질 */
export const OXIDES: Record<OxideMaterial, { eps_r: number; Eg: number; barrier_n: number }> = {
  SiO2: { eps_r: 3.9, Eg: 9.0, barrier_n: 3.1 },
  HfO2: { eps_r: 25,  Eg: 5.8, barrier_n: 1.5 },
};

/** Gate work function */
export const GATE_WORK_FUNCTIONS: Record<GateMaterial, number> = {
  'poly-n': 4.15,   // eV (n+ polysilicon)
  'poly-p': 5.25,   // eV (p+ polysilicon)
  'TiN':    4.6,    // eV
  'TaN':    4.4,    // eV
};

/** Implant range tables: species → energy(keV) → { Rp(nm), dRp(nm) } */
export const IMPLANT_TABLES: Record<string, { energy: number; Rp: number; dRp: number }[]> = {
  B:   [
    { energy: 5, Rp: 20, dRp: 9 },
    { energy: 10, Rp: 35, dRp: 15 },
    { energy: 20, Rp: 68, dRp: 27 },
    { energy: 30, Rp: 100, dRp: 37 },
    { energy: 50, Rp: 165, dRp: 53 },
    { energy: 80, Rp: 260, dRp: 73 },
    { energy: 100, Rp: 320, dRp: 85 },
  ],
  BF2: [
    { energy: 10, Rp: 15, dRp: 6 },
    { energy: 20, Rp: 25, dRp: 10 },
    { energy: 30, Rp: 37, dRp: 14 },
    { energy: 50, Rp: 60, dRp: 21 },
    { energy: 80, Rp: 95, dRp: 32 },
  ],
  P:   [
    { energy: 10, Rp: 13, dRp: 5 },
    { energy: 20, Rp: 24, dRp: 10 },
    { energy: 30, Rp: 36, dRp: 14 },
    { energy: 50, Rp: 60, dRp: 22 },
    { energy: 80, Rp: 98, dRp: 34 },
    { energy: 100, Rp: 125, dRp: 42 },
  ],
  As:  [
    { energy: 10, Rp: 8, dRp: 3 },
    { energy: 20, Rp: 14, dRp: 6 },
    { energy: 30, Rp: 20, dRp: 8 },
    { energy: 50, Rp: 30, dRp: 11 },
    { energy: 80, Rp: 44, dRp: 16 },
    { energy: 100, Rp: 55, dRp: 19 },
  ],
};
```

---

### 2.4 store/ — Zustand 상태 관리

#### store/deviceStore.ts
```typescript
import { create } from 'zustand';
import type { DeviceType, PhysicsLevel, InputMode, DeviceParams, ProcessParams, BiasConditions } from '../types/device';

interface DeviceStore {
  // 모드
  deviceType: DeviceType;
  level: PhysicsLevel;
  mode: InputMode;
  temperature: number;

  // 파라미터
  deviceParams: DeviceParams;
  processParams: ProcessParams;
  bias: BiasConditions;

  // 액션
  setDeviceType: (type: DeviceType) => void;
  setLevel: (level: PhysicsLevel) => void;
  setMode: (mode: InputMode) => void;
  setTemperature: (T: number) => void;
  updateDeviceParam: (path: string, value: number | string) => void;
  updateProcessParam: (path: string, value: number | string) => void;
  updateBias: (key: keyof BiasConditions, value: number) => void;
  resetAll: () => void;
}

const DEFAULT_DEVICE_PARAMS: DeviceParams = { /* ... 기본값 */ };
const DEFAULT_PROCESS_PARAMS: ProcessParams = { /* ... 기본값 */ };

export const useDeviceStore = create<DeviceStore>((set) => ({
  deviceType: 'nmos',
  level: 'A',
  mode: 'device',
  temperature: 300,
  deviceParams: DEFAULT_DEVICE_PARAMS,
  processParams: DEFAULT_PROCESS_PARAMS,
  bias: { vgs: 1.0, vds: 1.0, vbs: 0.0 },
  // ... actions
}));
```

#### store/simulationStore.ts
```typescript
import { create } from 'zustand';
import type { SimulationState } from '../types/simulation';

interface SimStore extends SimulationState {
  setResult: (partial: Partial<SimulationState>) => void;
  setStatus: (status: SimulationState['status']) => void;
  setProgress: (p: number) => void;
  clearResults: () => void;
}

export const useSimulationStore = create<SimStore>((set) => ({
  status: 'idle',
  progress: 0,
  calcTime: 0,
  iv: null, cv: null, band: null,
  doping2d: null, numerical2d: null,
  metrics: null, error: null,
  // ... actions
}));
```

#### store/viewStore.ts
```typescript
import { create } from 'zustand';

type ColormapType = 'structure' | 'doping' | 'netType' | 'potential' | 'efield' | 'electron' | 'hole' | 'current' | 'recombination';
type PlotTab = 'iv' | 'cv' | 'band' | 'profile' | 'field' | 'dashboard';
type Theme = 'dark' | 'light';

interface ViewStore {
  colormap: ColormapType;
  plotTab: PlotTab;
  theme: Theme;
  showDepletion: boolean;
  showWireframe: boolean;
  clipPlaneEnabled: boolean;
  clipPlanePosition: number;

  setColormap: (c: ColormapType) => void;
  setPlotTab: (t: PlotTab) => void;
  toggleTheme: () => void;
  toggleDepletion: () => void;
  // ...
}

export const useViewStore = create<ViewStore>((set) => ({
  colormap: 'structure',
  plotTab: 'iv',
  theme: 'dark',
  showDepletion: true,
  showWireframe: false,
  clipPlaneEnabled: false,
  clipPlanePosition: 0.5,
  // ... actions
}));
```

---

### 2.5 hooks/ — Custom Hooks

#### hooks/useSimulation.ts
```typescript
/**
 * 핵심 hook: 파라미터 변경 감지 → 물리 계산 트리거 → 결과 저장
 *
 * Level A/B: 직접 계산 (debounce 50ms)
 * Level C: Web Worker 위임
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import { useSimulationStore } from '../store/simulationStore';
import { LevelAEngine } from '../physics/levelA';
import { LevelBEngine } from '../physics/levelB';

export function useSimulation() {
  const timerRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const { deviceType, level, mode, temperature, deviceParams, processParams, bias } = useDeviceStore();
  const { setResult, setStatus, setProgress } = useSimulationStore();

  const runCalculation = useCallback(() => {
    const startTime = performance.now();

    if (level === 'A') {
      const engine = new LevelAEngine();
      const result = engine.fullCalculation(deviceType, deviceParams, bias, temperature);
      setResult({ ...result, calcTime: performance.now() - startTime, status: 'done' });
    } else if (level === 'B') {
      const engine = new LevelBEngine();
      const result = engine.fullCalculation(deviceType, deviceParams, bias, temperature);
      setResult({ ...result, calcTime: performance.now() - startTime, status: 'done' });
    } else {
      // Level C → Web Worker
      setStatus('computing');
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../physics/worker.ts', import.meta.url),
          { type: 'module' }
        );
      }
      workerRef.current.postMessage({ command: 'solve', /* params */ });
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'progress') setProgress(e.data.progress);
        if (e.data.type === 'result') {
          setResult({ ...e.data.result, calcTime: performance.now() - startTime, status: 'done' });
        }
        if (e.data.type === 'error') setResult({ error: e.data.message, status: 'error' });
      };
    }
  }, [deviceType, level, deviceParams, bias, temperature]);

  // Level A/B: 파라미터 변경 시 debounce auto-calculate
  useEffect(() => {
    if (level === 'C') return; // Level C는 수동 트리거
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(runCalculation, 50);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [deviceType, level, deviceParams, bias, temperature, runCalculation]);

  return { runCalculation };
}
```

#### hooks/useWorker.ts
```typescript
/**
 * Web Worker 생명주기 관리
 * - Worker 생성/종료
 * - Message protocol 추상화
 * - 자동 복구 (crash 시 재생성)
 */
export function useWorker() {
  // ...
}
```

#### hooks/useThreeJS.ts
```typescript
/**
 * Three.js scene 생명주기 관리
 * - Scene, Camera, Renderer 초기화
 * - OrbitControls 바인딩
 * - Resize observer
 * - Animation loop
 * - 컴포넌트 unmount 시 cleanup
 */
export function useThreeJS(containerRef: React.RefObject<HTMLDivElement>) {
  // return { scene, camera, renderer }
}
```

---

### 2.6 physics/levelA.ts — 핵심 계산 엔진 (예시)

```typescript
import { Q, EPS0, thermalVoltage, NM_TO_CM } from './constants';
import { Si, niSi, bandgapSi, mobilityElectron, mobilityHole, OXIDES, GATE_WORK_FUNCTIONS } from './materials';
import type { DeviceType, DeviceParams, BiasConditions } from '../types/device';
import type { IVResult, CVResult, BandDiagramResult, DeviceMetrics } from '../types/simulation';

export class LevelAEngine {

  /** Fermi potential: φ_F = (kT/q) * ln(N_A / n_i) */
  phiF(doping: number, T: number): number {
    return thermalVoltage(T) * Math.log(doping / niSi(T));
  }

  /** Flat-band voltage */
  Vfb(workFunction: number, phiF: number, Eg: number, Qf: number, Cox: number): number {
    const chi = Si.chi;
    const phi_s = chi + Eg / 2 + phiF; // Si work function
    return workFunction - phi_s - Qf * Q / Cox;
  }

  /** Threshold voltage */
  Vth(params: DeviceParams, T: number, Vbs: number = 0): number {
    // ... full implementation
  }

  /** I_D for given bias point */
  drainCurrent(type: DeviceType, params: DeviceParams, bias: BiasConditions, T: number): number {
    // Shockley model: linear + saturation + subthreshold
  }

  /** Full I-V sweep */
  sweepIV(type: DeviceType, params: DeviceParams, T: number): IVResult {
    // ...
  }

  /** C-V sweep */
  sweepCV(type: DeviceType, params: DeviceParams, T: number): CVResult {
    // ...
  }

  /** Band diagram */
  bandDiagram(type: DeviceType, params: DeviceParams, bias: BiasConditions, T: number): BandDiagramResult {
    // ...
  }

  /** All-in-one calculation */
  fullCalculation(type: DeviceType, params: DeviceParams, bias: BiasConditions, T: number) {
    const iv = this.sweepIV(type, params, T);
    const cv = this.sweepCV(type, params, T);
    const band = this.bandDiagram(type, params, bias, T);
    const metrics = this.extractMetrics(iv, cv, type, params, T);
    return { iv, cv, band, metrics, status: 'done' as const };
  }

  /** Metric 추출 */
  extractMetrics(iv: IVResult, cv: CVResult, type: DeviceType, params: DeviceParams, T: number): DeviceMetrics {
    // V_th: constant current method
    // SS: min(dVgs/dlog(Id))
    // I_on, I_off, ratio
  }
}
```

---

### 2.7 physics/worker.ts — Web Worker Entry

```typescript
/**
 * Web Worker entry point for Level C numerical simulation.
 * Imports only from physics/ (no React, no DOM).
 */
import { LevelCGummelSolver } from './levelC/gummel';
import { MeshGenerator } from './levelC/mesh';
import { DopingEngine } from './doping';

self.onmessage = function(e: MessageEvent) {
  const { command, params } = e.data;

  switch (command) {
    case 'solve': {
      try {
        const mesh = MeshGenerator.generate(params.geometry, params.meshOptions);
        const doping = DopingEngine.generate2DProfile(params, mesh);
        const solver = new LevelCGummelSolver(mesh, doping, params);

        solver.onProgress = (iter, residual) => {
          self.postMessage({ type: 'progress', progress: iter / params.maxIter, iter, residual });
        };

        const result = solver.solve(params.bias);
        self.postMessage({ type: 'result', result }, [
          result.psi.buffer, result.n.buffer, result.p.buffer  // Transferable
        ]);
      } catch (err) {
        self.postMessage({ type: 'error', message: String(err) });
      }
      break;
    }

    case 'sweep': {
      // Multi-bias-point sweep
      break;
    }
  }
};
```

---

## 3. 데이터 흐름

### 3.1 Level A/B (실시간)

```
ParamSlider onChange
  → useDeviceStore.updateDeviceParam()
  → Zustand state 변경
  → useSimulation hook (useEffect 감지)
  → debounce 50ms
  → LevelA/BEngine.fullCalculation()  [main thread, < 100ms]
  → useSimulationStore.setResult()
  → React 리렌더:
      → IVPlot 업데이트 (Plotly.react)
      → CVPlot 업데이트
      → BandDiagram 업데이트
      → Dashboard 업데이트
      → View3D 업데이트 (Three.js)
      → View2D×3 업데이트 (Canvas)
```

### 3.2 Level C (비동기)

```
User clicks "Run Simulation"
  → useSimulation.runCalculation()
  → Worker.postMessage({ command: 'solve', params })
  → simulationStore.setStatus('computing')
  → UI: progress bar, 입력 dim

Worker thread:
  → MeshGenerator.generate()
  → DopingEngine.generate2DProfile()
  → GummelSolver.solve()
    → [iteration loop]
    → postMessage({ type: 'progress', ... })
  → postMessage({ type: 'result', ... })

Main thread (Worker.onmessage):
  → 'progress' → simulationStore.setProgress()
  → 'result'   → simulationStore.setResult()
  → React 리렌더: 모든 뷰 업데이트
```

---

## 4. 수치 해석 상세 (Level C)

### 4.1 Scharfetter-Gummel Discretization

```
J_n,i+½ = (q·D_n / Δx) · [n_{i+1}·B(−Δψ/V_T) − n_i·B(Δψ/V_T)]
B(x) = x / (exp(x) − 1)   (Bernoulli function)
```

### 4.2 2D Poisson (5-point stencil, non-uniform grid)

```
∇²ψ → FD discretization with varying dx, dz
Right-hand side: −q/ε₀ε_r · (p − n + N_D − N_A)
Newton linearization: Jacobian includes dn/dψ, dp/dψ terms
```

### 4.3 Gummel Iteration

```
1. Init: charge neutrality → ψ₀
2. Loop:
   a. Solve Poisson → ψ (under-relaxation ω=0.1~0.5)
   b. Solve n-continuity (S-G) → n
   c. Solve p-continuity (S-G) → p
   d. Check: max|Δψ| < 1e-6 V
3. Fallback: 100 iter 초과 → 경고 + 마지막 결과
```

### 4.4 Sparse Solver: BiCGSTAB

```
CSR format, Jacobi preconditioner
Max 1000 inner iterations, tol = 1e-10
```

---

## 5. 성능 예산

### 5.1 메모리 (Level C, 200×200)

| 항목 | 크기 |
|------|------|
| Mesh + Doping arrays | ~1 MB |
| ψ, n, p | ~1 MB |
| Sparse matrix + work vectors | ~5 MB |
| Result arrays (E, J) | ~1.3 MB |
| **Worker total** | **~10 MB** |
| Three.js scene | ~20-50 MB |
| Plotly | ~10-20 MB |
| **App total** | **~50-100 MB** |

### 5.2 연산 시간 목표

| 작업 | 목표 |
|------|------|
| Level A single point | < 1ms |
| Level A sweep (100pts) | < 10ms |
| Level B single point | < 5ms |
| Level B sweep (100pts) | < 100ms |
| Level C single (100×100) | < 1s |
| Level C single (200×200) | < 5s |
| Level C sweep (50pts) | < 60s |

---

## 6. npm 패키지

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "three": "^0.165.0",
    "plotly.js-dist-min": "^2.35.0",
    "react-plotly.js": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.165.0",
    "@types/plotly.js": "^2.33.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

---

## 7. 빌드 및 실행

```bash
# 개발
npm run dev          # Vite dev server (HMR)

# 빌드
npm run build        # → dist/ (정적 파일)

# 배포
# dist/ 를 Vercel, Netlify, GitHub Pages 등에 업로드
```

---

## 8. 테스트 전략

### 8.1 물리 모델 단위 테스트 (Vitest)

physics/ 모듈은 React 무관이므로 순수 단위 테스트 가능:

| 테스트 | 검증 대상 |
|--------|----------|
| `niSi(300)` ≈ 1.07e10 | 물질 DB |
| `Vth(typical nMOS)` ≈ 0.4~0.5V | Level A |
| `SS(ideal, 300K)` ≈ 60 mV/dec | Level A |
| I-V shape qualitative | Level A/B |
| Poisson 1D analytic | Level C |
| Gummel convergence | Level C |

### 8.2 통합 테스트

- 파라미터 변경 → 결과 변화 방향 확인
- nMOS ↔ pMOS 전환 시 부호/범위 올바름
- Level A → B → C 전환 시 정성적 일관성

---

## 9. 리스크 및 완화

| 리스크 | 심각도 | 완화 |
|--------|--------|------|
| Level C 수렴 실패 | 높음 | 적응형 under-relaxation, bias ramping |
| Worker 메모리 초과 | 중간 | 메쉬 크기 제한 |
| Three.js + React 충돌 | 중간 | useRef + useEffect로 직접 관리, @react-three/fiber 미사용 |
| Plotly 번들 크기 | 중간 | plotly.js-dist-min 사용 |
| TypeScript strict mode | 낮음 | 점진적 타이핑 허용 |
