# PRD: MOSFET Junction Simulator
## Product Requirements Document v2.0

---

## 1. 제품 비전 및 목적

### 1.1 비전
웹 브라우저에서 구동되는 간이 TCAD 수준의 Planar MOSFET 시뮬레이터. 실제 fabrication 전 단계에서 소자 설계를 빠르게 검증하고, 물리적 동작을 직관적으로 이해할 수 있는 연구용 도구.

### 1.2 문제 정의
- 상용 TCAD (Sentaurus, Silvaco)는 라이선스 비용이 높고 설치/환경 의존성이 큼
- 빠른 파라미터 스위프와 직관적 시각화를 결합한 경량 도구가 부재
- 공정 파라미터와 소자 파라미터 간의 관계를 실시간으로 탐색할 수단이 부족

### 1.3 타겟 사용자
- **Primary:** 반도체 소자 연구자
- **Secondary:** 반도체 공정/설계 엔지니어
- **Tertiary:** 반도체 물리 학습자 (대학원 수준)

### 1.4 핵심 가치 제안
| 기존 TCAD | 본 시뮬레이터 |
|-----------|-------------|
| 설치 필요, OS 의존 | 브라우저 즉시 실행 |
| 분~시간 단위 시뮬레이션 | 실시간 ~ 수초 |
| 복잡한 입력 스크립트 | 직관적 GUI 슬라이더/입력 |
| 2D 결과 후처리 별도 | 실시간 3D/2D 동시 시각화 |
| 라이선스 $$$$ | 무료 |

### 1.5 기술 스택
| 항목 | 기술 |
|------|------|
| 빌드 | Vite |
| UI 프레임워크 | React 18 + TypeScript |
| 상태 관리 | Zustand |
| 3D 렌더링 | Three.js (직접 사용, useRef 마운트) |
| 2D 플롯 | react-plotly.js (Plotly.js) |
| 2D 히트맵 | Canvas 2D API (React ref) |
| 비동기 연산 | Web Worker (Vite worker import) |
| 스타일링 | CSS Modules |
| 배포 | Vite build → 정적 파일 |

### 1.6 구현 방식
- **구현 주체:** Claude Code
- **프로젝트 구조:** 멀티 파일 Vite + React + TypeScript
- **물리 엔진:** UI 무관 순수 TypeScript (src/physics/) — 단위 테스트 가능, 재사용 가능
- **Web Worker:** Vite `new Worker(new URL(...), import.meta.url)` 패턴

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 소자 타입 및 모드

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-001 | nMOS / pMOS 선택 지원 | P0 | 1 |
| FR-002 | 물리 모델 Level A/B/C 실시간 전환 | P0 | 1-3 |
| FR-003 | Device Mode (소자 파라미터 직접 입력) | P0 | 1 |
| FR-004 | Process Mode (공정 파라미터 입력 → 소자 구조 자동 생성) | P0 | 2 |
| FR-005 | Device ↔ Process 모드 전환 시 파라미터 자동 매핑 | P1 | 2 |

### 2.2 설계 파라미터 입력

#### 2.2.1 Device Mode 파라미터

| ID | 파라미터 그룹 | 항목 수 | 우선순위 | Phase |
|----|-------------|--------|---------|-------|
| FR-010 | Gate Stack (t_ox, φ_m, L_eff, material) | 6 | P0 | 1 |
| FR-011 | Channel (N_ch, doping profile type) | 3 | P0 | 1 |
| FR-012 | Source/Drain (N_SD, x_j, LDD) | 6 | P0 | 1 |
| FR-013 | Substrate (N_sub, type) | 2 | P0 | 1 |
| FR-014 | Geometry (W, L, overlap) | 4 | P0 | 1 |
| FR-015 | Bias Conditions (V_GS, V_DS, V_BS) | 3 | P0 | 1 |
| FR-016 | Operating Conditions (Temperature) | 1 | P0 | 1 |
| FR-017 | Advanced (Q_f, D_it, R_S, R_D) | 4 | P1 | 2 |

#### 2.2.2 Process Mode 파라미터

| ID | 파라미터 그룹 | 항목 수 | 우선순위 | Phase |
|----|-------------|--------|---------|-------|
| FR-020 | Gate Stack (oxide material, thickness, gate material, L_gate) | 7 | P0 | 2 |
| FR-021 | Substrate / Well (N_sub, well doping, depth, retrograde) | 6 | P0 | 2 |
| FR-022 | VT Adjust Implant (dose, energy, species, profile) | 4 | P0 | 2 |
| FR-023 | Halo/Pocket Implant (dose, energy, tilt) | 4 | P1 | 2 |
| FR-024 | S/D Main Implant (species, dose, energy) | 4 | P0 | 2 |
| FR-025 | LDD/Extension Implant (dose, energy, depth) | 3 | P0 | 2 |
| FR-026 | Spacer (width, material) | 2 | P0 | 2 |
| FR-027 | Silicide (on/off, material, thickness) | 3 | P1 | 2 |
| FR-028 | Thermal Anneal (type, temperature, time, activation ratio) | 4 | P0 | 2 |
| FR-029 | Isolation (type, STI depth/width, active width) | 4 | P1 | 2 |

#### 2.2.3 물질 데이터베이스

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-030 | Si 물질 파라미터 (E_g, n_i, ε_r, μ, v_sat 등) | P0 | 1 |
| FR-031 | SiO₂ (ε_r, E_g, barrier) | P0 | 1 |
| FR-032 | HfO₂ High-k dielectric | P1 | 2 |
| FR-033 | Si₃N₄ spacer material | P1 | 2 |
| FR-034 | Gate materials (Poly-Si, TiN, TaN) work functions | P0 | 1 |
| FR-035 | 온도 의존성 모델 (n_i, μ, E_g, v_sat) | P0 | 1 |
| FR-036 | Implant species lookup tables (Rp, ΔRp vs Energy) | P0 | 2 |

### 2.3 물리 시뮬레이션 엔진

#### 2.3.1 Level A — Analytical Model

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-040 | Threshold Voltage 계산 (V_FB, φ_F, V_th) | P0 | 1 |
| FR-041 | Shockley I-V (linear + saturation) | P0 | 1 |
| FR-042 | Oxide Capacitance (C_ox) | P0 | 1 |
| FR-043 | Depletion Width 계산 | P0 | 1 |
| FR-044 | Simple Subthreshold Current | P0 | 1 |
| FR-045 | MOS Capacitance (accumulation/depletion/inversion) | P0 | 1 |
| FR-046 | Energy Band Diagram (equilibrium + bias) | P0 | 1 |
| FR-047 | n_i(T) 온도 의존성 | P0 | 1 |

#### 2.3.2 Level B — Semi-Empirical Model

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-050 | Velocity Saturation 모델 | P0 | 2 |
| FR-051 | DIBL (Drain-Induced Barrier Lowering) | P0 | 2 |
| FR-052 | Channel Length Modulation (CLM) | P0 | 2 |
| FR-053 | Subthreshold Swing 정밀 모델 | P0 | 2 |
| FR-054 | Body Effect (V_th vs V_BS) | P0 | 2 |
| FR-055 | Mobility Degradation (vertical field) | P0 | 2 |
| FR-056 | Short Channel V_th Roll-off | P1 | 2 |
| FR-057 | Narrow Width Effect | P1 | 2 |
| FR-058 | Fowler-Nordheim Gate Leakage | P2 | 4 |
| FR-059 | Hot Carrier Effect (substrate current) | P2 | 4 |
| FR-060 | Gaussian Doping Profile 생성 (implant 기반) | P0 | 2 |
| FR-061 | Thermal Diffusion 모델 (anneal) | P0 | 2 |
| FR-062 | Multiple Implant Superposition | P0 | 2 |

#### 2.3.3 Level C — Numerical Model

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-070 | 2D Poisson's Equation Solver | P0 | 3 |
| FR-071 | Electron Continuity Equation Solver | P0 | 3 |
| FR-072 | Hole Continuity Equation Solver | P0 | 3 |
| FR-073 | Drift-Diffusion Transport (electrons + holes) | P0 | 3 |
| FR-074 | SRH Recombination Model | P0 | 3 |
| FR-075 | Auger Recombination Model | P1 | 3 |
| FR-076 | Scharfetter-Gummel Discretization | P0 | 3 |
| FR-077 | Gummel Iteration (decoupled solver) | P0 | 3 |
| FR-078 | Newton Method (fully coupled, optional) | P2 | 4 |
| FR-079 | Adaptive Mesh Refinement (junction regions) | P1 | 3 |
| FR-080 | Impact Ionization | P2 | 4 |
| FR-081 | Quantum Correction (Density Gradient) | P2 | 4 |

#### 2.3.4 I-V / C-V Sweep Engine

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-085 | V_DS sweep (output characteristics) | P0 | 1 |
| FR-086 | V_GS sweep (transfer characteristics) | P0 | 1 |
| FR-087 | V_GS sweep (log scale, subthreshold) | P0 | 1 |
| FR-088 | C-V sweep (high frequency) | P0 | 1 |
| FR-089 | C-V sweep (low frequency / quasi-static) | P1 | 2 |
| FR-090 | V_BS sweep (body effect) | P1 | 2 |
| FR-091 | Multi-curve sweep (V_GS family on I_D-V_DS) | P0 | 1 |

### 2.4 시각화

#### 2.4.1 3D View (Main — Top Half)

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-100 | MOSFET 3D 구조 렌더링 (Gate, Oxide, S/D, Substrate, Spacer) | P0 | 1 |
| FR-101 | 마우스 회전/줌/패닝 (OrbitControls) | P0 | 1 |
| FR-102 | 컬러맵: Structure Only (물질별 고유색) | P0 | 1 |
| FR-103 | 컬러맵: Doping Concentration (log scale) | P0 | 2 |
| FR-104 | 컬러맵: Net Doping Type (n/p binary) | P0 | 2 |
| FR-105 | 컬러맵: Electric Potential (ψ) | P1 | 3 |
| FR-106 | 컬러맵: Electric Field Magnitude | P1 | 3 |
| FR-107 | 컬러맵: Electron Concentration | P1 | 3 |
| FR-108 | 컬러맵: Hole Concentration | P1 | 3 |
| FR-109 | 컬러맵: Current Density | P2 | 3 |
| FR-110 | 컬러맵: Recombination Rate | P2 | 4 |
| FR-111 | Depletion Region 오버레이 | P0 | 1 |
| FR-112 | Clip Plane (자유 이동 단면 절단) | P1 | 2 |
| FR-113 | Coordinate Tooltip (클릭 시 물리량 표시) | P1 | 2 |
| FR-114 | Wireframe/Solid/Transparent 전환 | P1 | 2 |
| FR-115 | 축 스케일 독립 조정 | P2 | 4 |

#### 2.4.2 2D Section Views (Main — Bottom Half, 3-split)

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-120 | Top View (X-Y plane) — gate 상면 레이아웃 | P0 | 1 |
| FR-121 | Front View (X-Z plane) — S-Ch-D 종단면 | P0 | 1 |
| FR-122 | Side View (Y-Z plane) — Active-STI 횡단면 | P0 | 1 |
| FR-123 | 컬러맵 오버레이 (3D와 동일 옵션) | P0 | 2 |
| FR-124 | Contour Line 토글 | P1 | 2 |
| FR-125 | 줌/패닝 | P0 | 1 |
| FR-126 | 커서 물리량 실시간 표시 | P1 | 2 |
| FR-127 | 스케일 바 | P0 | 1 |

#### 2.4.3 분석 플롯 (Right Sidebar)

| ID | 요구사항 | 플롯 종류 | 우선순위 | Phase |
|----|---------|----------|---------|-------|
| FR-130 | I_D vs V_DS (output) | I-V | P0 | 1 |
| FR-131 | I_D vs V_GS (linear transfer) | I-V | P0 | 1 |
| FR-132 | log(I_D) vs V_GS (subthreshold) | I-V | P0 | 1 |
| FR-133 | g_m vs V_GS | I-V | P1 | 2 |
| FR-134 | g_ds vs V_DS | I-V | P1 | 2 |
| FR-135 | g_m/I_D vs V_GS | I-V | P2 | 2 |
| FR-136 | C-V (high frequency) | C-V | P0 | 1 |
| FR-137 | C-V (low frequency) | C-V | P1 | 2 |
| FR-138 | C_GS, C_GD vs V_GS | C-V | P2 | 3 |
| FR-139 | 1/C² vs V_G | C-V | P2 | 3 |
| FR-140 | Band Diagram (vertical, gate→sub) | Band | P0 | 1 |
| FR-141 | Band Diagram (lateral, S→D) | Band | P1 | 2 |
| FR-142 | Surface Potential vs V_G | Band | P1 | 2 |
| FR-143 | 1D Doping Profile (vertical) | Profile | P0 | 2 |
| FR-144 | 1D Doping Profile (lateral) | Profile | P0 | 2 |
| FR-145 | Carrier Concentration vs Depth | Profile | P1 | 3 |
| FR-146 | E-field along channel | Field | P1 | 3 |
| FR-147 | E-field vertical | Field | P1 | 3 |
| FR-148 | Potential along channel | Field | P1 | 3 |

#### 2.4.4 Performance Dashboard

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-150 | V_th 표시 (multiple extraction methods) | P0 | 1 |
| FR-151 | SS (Subthreshold Swing, mV/dec) | P0 | 1 |
| FR-152 | I_on / I_off / ratio | P0 | 1 |
| FR-153 | DIBL (mV/V) | P0 | 2 |
| FR-154 | g_m_max | P1 | 2 |
| FR-155 | V_DSAT | P1 | 2 |
| FR-156 | r_out (output resistance) | P2 | 2 |
| FR-157 | C_gg (total gate capacitance) | P2 | 2 |

### 2.5 사용자 기능

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|---------|-------|
| FR-160 | Preset Configurations (180nm, 90nm, 45nm, 28nm) | P1 | 4 |
| FR-161 | Export — Plot PNG 저장 | P1 | 4 |
| FR-162 | Export — Data CSV 저장 | P1 | 4 |
| FR-163 | Export — Full State JSON 저장/불러오기 | P1 | 4 |
| FR-164 | Parameter Comparison Mode (A vs B side-by-side) | P2 | 4 |
| FR-165 | Dark / Light Theme 전환 | P1 | 1 |
| FR-166 | Run Simulation 버튼 (Level C 수동 트리거) | P0 | 3 |
| FR-167 | Auto-Simulate 토글 (Level A/B 자동 갱신) | P0 | 1 |
| FR-168 | Reset All Parameters | P0 | 1 |

---

## 3. 비기능 요구사항 (Non-Functional Requirements)

### 3.1 성능

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-001 | Level A 계산 응답 시간 | < 10ms |
| NFR-002 | Level B 계산 응답 시간 | < 100ms |
| NFR-003 | Level C (100×100 mesh) | < 3s |
| NFR-004 | Level C (200×200 mesh) | < 15s |
| NFR-005 | 3D 렌더링 프레임 레이트 | ≥ 30fps |
| NFR-006 | UI 인터랙션 응답 | < 50ms |
| NFR-007 | 초기 로드 시간 | < 3s |
| NFR-008 | I-V sweep (50 points, Level B) | < 2s |

### 3.2 안정성

| ID | 요구사항 |
|----|---------|
| NFR-010 | Level C 비수렴 시 graceful degradation |
| NFR-011 | 비물리적 파라미터 입력 시 경고 |
| NFR-012 | Web Worker crash 시 자동 복구 |
| NFR-013 | 메모리 사용량 < 1GB |

### 3.3 사용성

| ID | 요구사항 |
|----|---------|
| NFR-020 | 슬라이더 + 직접 입력 동시 지원 |
| NFR-021 | 지수 표기 (1e15) 직접 입력 |
| NFR-022 | Level A/B 파라미터 변경 시 자동 업데이트 |
| NFR-023 | Level C 진행률 표시 |
| NFR-024 | 유효 범위 밖 입력 시 경고 |
| NFR-025 | 파라미터 tooltip 설명 |
| NFR-026 | Collapsible sections |

### 3.4 기술 제약

| ID | 요구사항 |
|----|---------|
| NFR-030 | Vite + React 18 + TypeScript |
| NFR-031 | 100% 클라이언트 사이드 (서버 불필요) |
| NFR-032 | Chrome/Edge/Firefox 최신 |
| NFR-033 | 최소 해상도 1440×900 |
| NFR-034 | WebGL 필수 |

### 3.5 코드 품질

| ID | 요구사항 |
|----|---------|
| NFR-040 | src/physics/ 는 React 무관 순수 TypeScript |
| NFR-041 | 모든 파라미터에 TypeScript interface 정의 |
| NFR-042 | 물리 상수에 단위 주석 필수 |
| NFR-043 | Zustand store로 상태→리렌더 자동 처리 |

---

## 4. 우선순위 정의

| 등급 | 의미 |
|------|------|
| **P0** | Must Have — 해당 Phase 필수 |
| **P1** | Should Have — 이월 가능 |
| **P2** | Nice to Have — 시간 허락 시 |

---

## 5. Phase 완료 기준

### Phase 1: Foundation (UI + Level A)
- Vite + React 프로젝트 `npm run dev` / `npm run build` 정상
- 3-column 레이아웃 + 3D/2D split
- Device Mode 전체 파라미터 입력
- nMOS/pMOS 전환
- Level A I-V, C-V, Band Diagram 정확
- 3D Structure 렌더링 + Depletion 오버레이
- Dashboard: V_th, SS, I_on/I_off
- 파라미터 변경 시 실시간 갱신 (< 100ms)

### Phase 2: Level B + Process Mode
- Level B 전체 (SCE, DIBL, CLM, Body Effect)
- Process Mode UI + 도핑 프로파일 생성
- 도핑 컬러맵 3D/2D
- gm, gds 플롯
- Clip plane, tooltip

### Phase 3: Level C Numerical
- 2D Poisson + Drift-Diffusion (Web Worker)
- Gummel iteration 수렴
- 전계/전위/캐리어 시각화
- Level A/B와 정성적 일관성
- < 15s (200×200)

### Phase 4: Polish
- Presets, Export (PNG/CSV/JSON)
- 고급 물리 모델
- Theme, UI polish

---

## 6. 제외 범위

- FinFET, GAA, SOI 등 비-planar 구조
- Transient 시뮬레이션
- 3D 수치 해석 (2D까지만)
- AC small-signal 분석
- Reliability (NBTI, HCI aging)
- Multi-device
- 서버 사이드 연산
- 모바일/태블릿 최적화
