# TASKS: MOSFET Junction Simulator
## 개발 작업 정의서 v2.0
### 구현: Claude Code | 스택: Vite + React + TypeScript

---

## Task 체계

```
Phase > Epic > Task
ID: P{phase}-E{epic}-T{task}
```

**우선순위:** P0 (필수) | P1 (권장) | P2 (선택)

---

# Phase 1: Foundation (UI + Level A)

## Epic 1.1: 프로젝트 초기화

### P1-E1-T1: Vite + React + TypeScript 프로젝트 생성
- **우선순위:** P0
- **의존성:** 없음
- **작업:**
  1. `npm create vite@latest mosfet-simulator -- --template react-ts`
  2. 패키지 설치: `zustand`, `three`, `@types/three`, `plotly.js-dist-min`, `react-plotly.js`, `@types/plotly.js`
  3. `tsconfig.json` strict mode 설정
  4. `vite.config.ts` 기본 설정 (worker 지원 확인)
  5. 프로젝트 디렉토리 구조 생성 (TRD §1.2 참조):
     - `src/types/`, `src/physics/`, `src/store/`, `src/components/`, `src/hooks/`, `src/utils/`
     - `src/components/layout/`, `params/`, `views/`, `plots/`
     - `src/physics/levelC/`
  6. `npm run dev`로 정상 실행 확인
- **완료 기준:** `npm run dev` 정상, `npm run build` 에러 없음

### P1-E1-T2: 공유 타입 정의
- **우선순위:** P0
- **의존성:** P1-E1-T1
- **작업:**
  1. `src/types/device.ts` — DeviceType, PhysicsLevel, InputMode, DeviceParams, ProcessParams, BiasConditions
  2. `src/types/simulation.ts` — SweepCurve, IVResult, CVResult, BandDiagramResult, DopingProfile2D, NumericalResult2D, DeviceMetrics, SimulationState
  3. `src/types/materials.ts` — MaterialProperties, OxideMaterial, GateMaterial, ImplantSpecies
- **완료 기준:** 모든 타입이 컴파일 에러 없이 정의됨. 다른 모듈에서 import 가능

---

## Epic 1.2: 물리 엔진 기반 (순수 TypeScript)

### P1-E2-T1: 물리 상수 및 단위 변환
- **우선순위:** P0
- **의존성:** P1-E1-T2
- **파일:** `src/physics/constants.ts`
- **작업:**
  1. 물리 상수: Q, K_B, EPS0, H, HBAR, M0
  2. 함수: thermalVoltage(T), kT_eV(T)
  3. 단위 변환 상수: NM_TO_CM, CM_TO_M, EV_TO_J
- **완료 기준:** kT_eV(300) ≈ 0.02585

### P1-E2-T2: 물질 데이터베이스
- **우선순위:** P0
- **의존성:** P1-E2-T1
- **파일:** `src/physics/materials.ts`
- **작업:**
  1. Si 파라미터 객체 (Eg_0, eps_r, chi, Nc_300, Nv_300, ni_300, mu_n/p, vsat 등)
  2. bandgapSi(T) — Varshni 모델
  3. niSi(T) — 온도 의존 intrinsic carrier
  4. mobilityElectron(N, T), mobilityHole(N, T) — Caughey-Thomas
  5. OXIDES 객체 (SiO2, HfO2)
  6. GATE_WORK_FUNCTIONS 객체
- **완료 기준:**
  - niSi(300) ≈ 1.07e10
  - bandgapSi(300) ≈ 1.12 eV
  - mobilityElectron(1e17, 300) ≈ 800 cm²/V·s (문헌 범위)

### P1-E2-T3: Level A 물리 엔진
- **우선순위:** P0
- **의존성:** P1-E2-T2
- **파일:** `src/physics/levelA.ts`
- **작업:**
  1. `LevelAEngine` 클래스:
     - `phiF(doping, T)` — Fermi potential
     - `Vfb(workFunction, phiF, Eg, Qf, Cox)` — flat-band voltage
     - `Vth(params, T, Vbs)` — threshold voltage
     - `oxideCap(epsr, tox)` — C_ox (F/cm²)
     - `depletionWidth(phiS, Na, T)` — W_dep
     - `drainCurrent(type, params, bias, T)` — I_D (linear+sat+subthreshold 부드러운 연결)
     - `mosCapacitance(type, params, Vg, T)` — C-V (high freq)
     - `bandDiagram(type, params, bias, T)` — Ec, Ev, Ef, Ei vs depth
  2. nMOS / pMOS 모두 대응 (부호 체계)
  3. Subthreshold: I_sub = I_0 * exp(qVgs/(nkT)) * [1-exp(-qVds/kT)]
  4. Smooth transition between regions (no discontinuity)
- **완료 기준:**
  - 전형적 nMOS (Na=1e17, tox=5nm, poly-n): V_th ≈ 0.4~0.5V
  - I-V 곡선: cutoff → linear → saturation 자연스러운 전환
  - C-V: accumulation(C_ox) → depletion → inversion(C_min) 패턴
  - pMOS: 음의 V_GS, 음의 I_D

### P1-E2-T4: Sweep 엔진
- **우선순위:** P0
- **의존성:** P1-E2-T3
- **파일:** `src/physics/sweep.ts`
- **작업:**
  1. `sweepIdVds(engine, type, params, T, options)` — output characteristics (다중 V_GS)
  2. `sweepIdVgs(engine, type, params, T, options)` — transfer (linear + log)
  3. `sweepCV(engine, type, params, T, options)` — C-V
  4. `extractMetrics(iv, cv, type, params, T)`:
     - V_th (constant current: I_D = 100nA × W/L)
     - SS (min dVgs/dlog(Id))
     - I_on (V_GS=V_DS=V_DD)
     - I_off (V_GS=0, V_DS=V_DD)
     - I_on/I_off
  5. 결과를 IVResult, CVResult, DeviceMetrics 타입으로 반환
- **완료 기준:**
  - sweepIdVds: 100 points × 5 curves < 10ms
  - SS(ideal, 300K) ≈ 60 mV/dec
  - V_th 추출값이 해석값과 ±10%

---

## Epic 1.3: Zustand 상태 관리

### P1-E3-T1: Store 구현
- **우선순위:** P0
- **의존성:** P1-E1-T2
- **작업:**
  1. `src/store/deviceStore.ts` — deviceType, level, mode, temperature, deviceParams, processParams, bias + 모든 setter 함수 + resetAll + nMOS↔pMOS 전환 시 기본값 자동 조정
  2. `src/store/simulationStore.ts` — SimulationState + setResult, setStatus, setProgress, clearResults
  3. `src/store/viewStore.ts` — colormap, plotTab, theme, showDepletion, wireframe, clipPlane + setter
  4. 각 store에 DEFAULT 값 정의 (PRD §2.2 참조)
- **완료 기준:**
  - useDeviceStore() 로 읽기/쓰기 정상
  - nMOS→pMOS 전환 시 substrate type, dopant species 자동 변경

---

## Epic 1.4: 레이아웃 및 기본 UI

### P1-E4-T1: App 레이아웃
- **우선순위:** P0
- **의존성:** P1-E1-T1
- **작업:**
  1. `src/App.tsx` — CSS Grid 3-column 레이아웃:
     - left: 280px (LeftSidebar)
     - center: flex (MainView)
     - right: 320px (RightSidebar)
     - top: Toolbar (40px)
     - bottom: StatusBar (28px)
  2. `src/App.module.css` — dark theme 기본, CSS custom properties
  3. 각 layout 컴포넌트 빈 껍데기 생성:
     - `Toolbar.tsx`, `LeftSidebar.tsx`, `MainView.tsx`, `RightSidebar.tsx`, `StatusBar.tsx`
  4. MainView: 상하 50:50 split (상단 3D, 하단 2D 3-split)
- **완료 기준:**
  - 1440×900에서 올바른 3-column 레이아웃
  - 사이드바 독립 스크롤
  - Dark theme 적용

### P1-E4-T2: 파라미터 입력 컴포넌트
- **우선순위:** P0
- **의존성:** P1-E3-T1, P1-E4-T1
- **작업:**
  1. `ParamSlider.tsx` — 범용 위젯:
     - props: label, value, min, max, step, unit, logScale?, tooltip?
     - 슬라이더 + 숫자 입력 양방향 동기화
     - 지수 표기 파서 (1e15, 5.2E-3)
     - 범위 밖 값 시각적 경고 (빨간 테두리)
  2. `ParamSection.tsx` — Collapsible 섹션 (제목 클릭으로 열기/닫기)
  3. `DeviceParams.tsx` — Device Mode 전체 패널:
     - Gate Stack, Channel, Source/Drain, Substrate, Geometry, Advanced 섹션
     - 각 파라미터를 ParamSlider로 구성
     - deviceStore와 연결
  4. `BiasControls.tsx` — V_GS, V_DS, V_BS 슬라이더 (항상 표시)
- **완료 기준:**
  - 모든 Device Mode 파라미터 조작 가능
  - 슬라이더 ↔ 입력 필드 동기화
  - "1e17" 입력 시 올바르게 파싱
  - Section collapse/expand

### P1-E4-T3: Toolbar
- **우선순위:** P0
- **의존성:** P1-E3-T1, P1-E4-T1
- **작업:**
  1. `Toolbar.tsx`:
     - nMOS/pMOS 토글
     - Level A/B/C 버튼 그룹 (Level B/C는 Phase 2/3까지 disabled 표시 가능)
     - Device/Process 모드 토글
     - Temperature 입력
     - Material 드롭다운
     - Reset 버튼
     - Theme 토글 (dark/light)
  2. deviceStore, viewStore와 연결
- **완료 기준:** Toolbar 조작 시 store 상태 올바르게 변경

### P1-E4-T4: Right Sidebar — 플롯 탭 + Dashboard
- **우선순위:** P0
- **의존성:** P1-E4-T1
- **작업:**
  1. `RightSidebar.tsx`:
     - 탭 버튼: [I-V] [C-V] [Band] [Dashboard]
     - 각 탭 내용 컴포넌트 조건부 렌더링
  2. `Dashboard.tsx`:
     - V_th, SS, I_on, I_off, I_on/I_off 텍스트 카드
     - simulationStore.metrics 에서 읽기
     - 단위 포맷팅 (mV/dec, μA, pA 등)
- **완료 기준:** 탭 전환 동작, Dashboard 값 표시

### P1-E4-T5: StatusBar
- **우선순위:** P0
- **의존성:** P1-E4-T1
- **작업:**
  1. `StatusBar.tsx`:
     - 계산 상태 (idle/computing/done/error)
     - 계산 시간
     - V_th 간략 표시
     - Level C: mesh 크기, 수렴 상태
- **완료 기준:** simulationStore 상태 반영

---

## Epic 1.5: useSimulation Hook

### P1-E5-T1: 계산 파이프라인 Hook
- **우선순위:** P0
- **의존성:** P1-E2-T4, P1-E3-T1
- **작업:**
  1. `src/hooks/useSimulation.ts`:
     - deviceStore의 파라미터 변경 감지 (useEffect)
     - debounce 50ms
     - Level A: LevelAEngine.fullCalculation() 호출
     - 결과를 simulationStore에 저장
     - 에러 핸들링 (NaN, Infinity 방지)
  2. App.tsx에서 useSimulation() 호출
- **완료 기준:**
  - 파라미터 변경 → 50ms 후 자동 계산 → 결과 store 업데이트
  - 슬라이더 드래그 중 과도한 계산 없음 (debounce)

---

## Epic 1.6: 3D 시각화

### P1-E6-T1: Three.js 초기화 Hook
- **우선순위:** P0
- **의존성:** P1-E4-T1
- **작업:**
  1. `src/hooks/useThreeJS.ts`:
     - Scene, PerspectiveCamera, WebGLRenderer 생성
     - OrbitControls (from three/examples/jsm/controls/OrbitControls)
     - AmbientLight + DirectionalLight
     - Axes helper
     - ResizeObserver → 카메라/렌더러 크기 업데이트
     - requestAnimationFrame loop
     - cleanup on unmount (dispose)
  2. ref 기반: `containerRef`에 renderer.domElement append
- **완료 기준:** 빈 scene에서 axes 표시, 마우스 회전/줌/패닝 정상

### P1-E6-T2: MOSFET 3D 구조 빌드
- **우선순위:** P0
- **의존성:** P1-E6-T1, P1-E3-T1
- **작업:**
  1. `View3D.tsx` 컴포넌트:
     - useThreeJS hook 사용
     - deviceStore 파라미터 감지
     - buildMOSFET(params) 함수:
       - Substrate (BoxGeometry, 파란 계열)
       - Gate oxide (thin Box, 반투명 청록)
       - Gate electrode (Box, 은색)
       - Source/Drain (Box, 빨강 계열)
       - LDD regions (Box, 연빨강)
       - Spacers (Box/trapezoid, 노랑)
       - Channel 강조
     - 파라미터 변경 시 geometry 재생성
     - nMOS/pMOS 색상 구분
  2. Depletion region (반투명 overlay)
     - simulationStore에서 depletion width 읽기
     - 바이어스에 따라 크기 변화
- **완료 기준:**
  - 전형적 MOSFET 3D 구조 렌더링
  - t_ox, L_gate, x_j 변경 시 실시간 업데이트
  - Depletion region 표시

---

## Epic 1.7: 2D 단면 뷰

### P1-E7-T1: 2D 뷰 컴포넌트 (Front/Top/Side)
- **우선순위:** P0
- **의존성:** P1-E4-T1, P1-E3-T1
- **작업:**
  1. `View2DFront.tsx` (X-Z 종단면):
     - Canvas ref + 2D context
     - 물질별 색상 영역 채우기
     - 구조 경계선
     - 스케일 바 (nm)
     - 줌/패닝 (wheel + drag)
     - 커서 좌표 표시
  2. `View2DTop.tsx` (X-Y 상면):
     - Gate, S/D, Active 영역
  3. `View2DSide.tsx` (Y-Z 횡단면):
     - Active + STI 경계
  4. 파라미터 변경 시 자동 재렌더링
- **완료 기준:**
  - 3개 뷰 모두 올바른 단면 표시
  - 줌/패닝 동작
  - 파라미터 변경 시 실시간 업데이트

---

## Epic 1.8: 분석 플롯

### P1-E8-T1: I-V 플롯
- **우선순위:** P0
- **의존성:** P1-E5-T1, P1-E4-T4
- **작업:**
  1. `IVPlot.tsx`:
     - simulationStore.iv에서 데이터 읽기
     - I_D vs V_DS (output, 다중 V_GS) — react-plotly.js
     - I_D vs V_GS (linear transfer)
     - log(I_D) vs V_GS (subthreshold)
     - Dark theme layout
     - Plotly `revision` prop으로 효율적 업데이트
- **완료 기준:** 실시간 갱신, 로그 스케일에서 subthreshold 보임

### P1-E8-T2: C-V 플롯
- **우선순위:** P0
- **의존성:** P1-E5-T1
- **작업:**
  1. `CVPlot.tsx`:
     - C vs V_G (high freq)
     - C_ox 수평 reference line
- **완료 기준:** 3개 영역 패턴 올바름

### P1-E8-T3: Band Diagram 플롯
- **우선순위:** P0
- **의존성:** P1-E5-T1
- **작업:**
  1. `BandDiagram.tsx`:
     - Ec, Ev, Ef, Ei vs depth
     - Oxide-Si 계면 표시
     - V_GS 변경 시 band bending 반영
- **완료 기준:** V_GS > V_th에서 반전 확인

---

## Epic 1.9: 통합 및 마무리

### P1-E9-T1: 전체 파이프라인 통합
- **우선순위:** P0
- **의존성:** 모든 Phase 1 Epics
- **작업:**
  1. App.tsx에서 모든 컴포넌트 조립
  2. useSimulation hook이 전체 뷰를 구동하는지 확인
  3. 어떤 파라미터 변경해도 crash 없이 전체 뷰 갱신
  4. nMOS ↔ pMOS 전환 완전 동작
  5. Edge case 처리: V_GS=0, V_DS=0, 극단적 도핑 등
- **완료 기준:** Phase 1 완료 기준 전체 충족

### P1-E9-T2: Dark/Light Theme
- **우선순위:** P1
- **의존성:** P1-E9-T1
- **작업:**
  1. CSS custom properties로 dark/light 변수 세트
  2. viewStore.theme 연동
  3. Three.js scene 배경색 변경
  4. Plotly layout 테마 변경
  5. Canvas 2D 색상 변경
- **완료 기준:** 모든 UI 요소 theme 전환

---

### Phase 1 요약
| 항목 | 수량 |
|------|------|
| Epic | 9 |
| Task | 17 |
| 예상 규모 | ~3000~4000 LoC |
| 핵심 산출물 | Level A 완전 동작 시뮬레이터 |

---

# Phase 2: Enhanced Physics (Level B + Process Mode)

## Epic 2.1: Level B 물리 엔진

### P2-E1-T1: Level B 엔진 구현
- **우선순위:** P0
- **의존성:** P1-E2-T3
- **파일:** `src/physics/levelB.ts`
- **작업:**
  1. `LevelBEngine` 클래스 (LevelAEngine 확장 또는 독립):
     - Velocity Saturation: μ_eff = μ_0/(1+μ_0·E/v_sat)
     - DIBL: ΔV_th = -η·V_DS
     - Channel Length Modulation: I_D * (1+λ·V_DS)
     - Body Effect: V_th(V_SB) = V_th0 + γ·(√(2φ_F+V_SB) − √(2φ_F))
     - Mobility Degradation: μ_eff = μ_0/(1+θ·(V_GS−V_th))
     - Subthreshold Swing: SS = (kT/q)·ln(10)·(1+C_dep/C_ox)
     - Short Channel V_th Roll-off (charge sharing)
     - Narrow Width Effect
  2. 모든 효과 통합한 I_D(V_GS, V_DS, V_BS)
  3. gm = ∂I_D/∂V_GS, gds = ∂I_D/∂V_DS (수치 미분)
  4. DIBL metric 자동 추출
  5. fullCalculation() 메서드
- **완료 기준:**
  - Level A와 B 결과 전환 비교 가능
  - 짧은 L에서 V_th 감소 (SCE)
  - V_DS 증가 시 V_th 감소 (DIBL)
  - SS > 60 mV/dec (비이상적)

### P2-E1-T2: Level B Sweep + Metrics 통합
- **우선순위:** P0
- **의존성:** P2-E1-T1
- **작업:**
  1. sweep.ts에 Level B 엔진 연결
  2. 추가 metrics: DIBL, gm_max, Vdsat
  3. useSimulation hook에 Level B 분기 추가
- **완료 기준:** Level B 선택 시 전체 파이프라인 동작

---

## Epic 2.2: 도핑 프로파일 엔진

### P2-E2-T1: 도핑 엔진 구현
- **우선순위:** P0
- **의존성:** P1-E2-T2
- **파일:** `src/physics/doping.ts`
- **작업:**
  1. Implant range lookup + interpolation (IMPLANT_TABLES)
  2. Gaussian 1D implant profile
  3. Thermal diffusion (Gaussian convolution)
  4. 2D profile 생성:
     - Substrate + Well + VT adjust + Halo + S/D + LDD
     - Gate/Spacer 마스킹
     - Anneal 후 최종 프로파일
  5. Device Mode용 단순 프로파일 (step + Gaussian junction)
  6. 반환: DopingProfile2D { x[], z[], Nd, Na, Nnet }
- **완료 기준:**
  - S/D junction이 gate edge에 적절히 형성
  - Implant 프로파일 적분 ≈ Dose
  - Anneal 후 junction depth 증가

---

## Epic 2.3: Process Mode UI

### P2-E3-T1: Process Mode 파라미터 패널
- **우선순위:** P0
- **의존성:** P1-E4-T2
- **파일:** `src/components/params/ProcessParams.tsx`
- **작업:**
  1. 모든 Process Mode 파라미터 섹션 (TRD §2.2 참조)
  2. Device ↔ Process 모드 전환 시 패널 교체
  3. processStore 연결
- **완료 기준:** Process Mode 전체 파라미터 입력 가능

---

## Epic 2.4: 도핑 시각화

### P2-E4-T1: 2D 도핑 히트맵
- **우선순위:** P0
- **의존성:** P2-E2-T1
- **작업:**
  1. View2DFront에 도핑 컬러맵 오버레이:
     - log scale, diverging colormap (Blue←p | Red→n)
     - ImageData 직접 픽셀 조작
     - 컬러 범위 자동 조정 + colorbar
  2. View2DTop, View2DSide에도 동일 적용
  3. viewStore.colormap 연동 (structure/doping/netType 전환)
- **완료 기준:** 도핑 분포가 컬러맵으로 정확히 표시

### P2-E4-T2: 3D 도핑 컬러맵
- **우선순위:** P0
- **의존성:** P2-E2-T1, P1-E6-T2
- **작업:**
  1. 3D mesh에 도핑 텍스처 매핑
  2. 컬러맵 드롭다운 UI (Toolbar 또는 3D 뷰 상단)
- **완료 기준:** 3D에서 S/D(n-type) 빨강, substrate(p-type) 파랑

### P2-E4-T3: Clip Plane + Contour Lines
- **우선순위:** P1
- **의존성:** P2-E4-T1
- **작업:**
  1. Three.js clipping plane (슬라이더로 위치 조정)
  2. Canvas 2D contour lines (marching squares)
- **완료 기준:** Clip plane으로 내부 도핑 구조 확인 가능

---

## Epic 2.5: 추가 플롯

### P2-E5-T1: gm, gds, Doping Profile 플롯
- **우선순위:** P1
- **의존성:** P2-E1-T2, P2-E2-T1
- **작업:**
  1. IVPlot에 gm vs V_GS, gds vs V_DS 추가
  2. `DopingProfile.tsx`: vertical + lateral 1D doping (log scale)
  3. RightSidebar 탭에 [Profile] 추가
- **완료 기준:** gm peak ≈ V_th 근처, doping profile 올바름

### P2-E5-T2: Lateral Band Diagram + Surface Potential
- **우선순위:** P1
- **의존성:** P2-E1-T1
- **작업:**
  1. BandDiagram에 lateral (S→D) 추가
  2. Surface potential vs V_G 플롯
- **완료 기준:** V_DS 인가 시 드레인 barrier 낮아짐

---

### Phase 2 요약
| 항목 | 수량 |
|------|------|
| Epic | 5 |
| Task | 8 |
| 예상 규모 | ~2000~3000 LoC 추가 |

---

# Phase 3: Numerical Engine (Level C)

## Epic 3.1: 수치 해석 기반

### P3-E1-T1: 메쉬 생성기
- **우선순위:** P0
- **의존성:** P2-E2-T1
- **파일:** `src/physics/levelC/mesh.ts`
- **작업:**
  1. 비균일 2D structured rectangular mesh
  2. junction/interface 근처 세밀화 (min Δx=0.5nm)
  3. Region ID 배열 (gate, oxide, channel, S/D, substrate 등)
  4. 반환: { x[], z[], nx, nz, dx[], dz[], region[] }
- **완료 기준:** 100×100 기본, junction 근처 < 2nm

### P3-E1-T2: Sparse Matrix + BiCGSTAB Solver
- **우선순위:** P0
- **의존성:** 없음
- **파일:** `src/physics/levelC/sparseSolver.ts`
- **작업:**
  1. CSR (Compressed Sparse Row) 구현
  2. BiCGSTAB 알고리즘 + Jacobi preconditioner
  3. SOR 대안 구현
- **완료 기준:** 테스트 행렬에서 올바른 해

### P3-E1-T3: Web Worker 인프라
- **우선순위:** P0
- **의존성:** P1-E1-T1
- **파일:** `src/physics/worker.ts`, `src/hooks/useWorker.ts`
- **작업:**
  1. worker.ts: onmessage handler (solve, sweep, cancel)
  2. useWorker hook: Worker 생성/종료, message 추상화, 자동 복구
  3. Transferable 사용 (Float64Array.buffer)
- **완료 기준:** Main ↔ Worker 데이터 왕복 확인

---

## Epic 3.2: Poisson + Drift-Diffusion

### P3-E2-T1: Poisson Solver
- **우선순위:** P0
- **의존성:** P3-E1-T1, P3-E1-T2
- **파일:** `src/physics/levelC/poisson.ts`
- **작업:**
  1. 2D Poisson 5-point stencil (비균일 grid)
  2. 경계 조건 (Dirichlet: gate, ohmic contacts)
  3. Newton linearization (Jacobian with dn/dψ, dp/dψ)
  4. Under-relaxation
- **완료 기준:** 균일 도핑 MOS에서 해석해와 비교

### P3-E2-T2: Continuity Solver (Scharfetter-Gummel)
- **우선순위:** P0
- **의존성:** P3-E2-T1
- **파일:** `src/physics/levelC/continuity.ts`
- **작업:**
  1. Bernoulli function B(x) = x/(exp(x)-1)
  2. S-G discretized current density (2D)
  3. n-continuity, p-continuity matrix assembly
  4. SRH recombination
- **완료 기준:** Equilibrium에서 J ≈ 0

### P3-E2-T3: Gummel Iteration
- **우선순위:** P0
- **의존성:** P3-E2-T1, P3-E2-T2
- **파일:** `src/physics/levelC/gummel.ts`
- **작업:**
  1. Gummel loop: Poisson → n-cont → p-cont → check
  2. Convergence criterion: max|Δψ| < 1e-6 V
  3. Under-relaxation ω = 0.1~0.5 (적응형)
  4. Progress callback (iteration, residual)
  5. Max 100 iter + fallback
  6. Drain current extraction
- **완료 기준:**
  - 기본 MOSFET에서 다양한 bias 수렴
  - 100×100 mesh < 3s

---

## Epic 3.3: Level C 통합

### P3-E3-T1: 결과 시각화 + UI
- **우선순위:** P0
- **의존성:** P3-E2-T3
- **작업:**
  1. Potential/E-field/Carrier 2D 히트맵 (View2D colormap 확장)
  2. 3D colormap options 확장 (potential, efield, electron, hole)
  3. "Run Simulation" 버튼 + Progress bar (Level C)
  4. FieldPlots.tsx: E-field along channel, vertical
  5. Level A/B/C 결과 비교 가능 확인
- **완료 기준:**
  - Level C 시각화 전체 동작
  - Run → Progress → 결과 표시 흐름

### P3-E3-T2: Level C I-V Sweep
- **우선순위:** P0
- **의존성:** P3-E3-T1
- **작업:**
  1. Worker에서 다중 bias sweep
  2. 각 point 계산 시 이전 해 초기값 재활용
  3. 실시간 포인트 추가 (Worker → Main → Plot)
  4. Cancel 지원
- **완료 기준:** 50-point I-V sweep (100×100) < 60s

---

### Phase 3 요약
| 항목 | 수량 |
|------|------|
| Epic | 3 |
| Task | 7 |
| 예상 규모 | ~2500~3500 LoC 추가 |

---

# Phase 4: Polish & Advanced

## Epic 4.1: 고급 물리

### P4-E1-T1: Gate Leakage (FN), Hot Carrier, Auger, Impact Ionization
- **우선순위:** P2
- **예상:** 각 1~2시간

## Epic 4.2: Export & Presets

### P4-E2-T1: Preset Configurations
- **우선순위:** P1
- **작업:** 180nm, 90nm, 45nm, 28nm 전형적 파라미터 세트

### P4-E2-T2: Export (PNG, CSV, JSON)
- **우선순위:** P1
- **작업:**
  1. PNG: Plotly.downloadImage()
  2. CSV: I-V, C-V 데이터 다운로드
  3. JSON: 전체 상태 저장/불러오기

## Epic 4.3: UI Polish

### P4-E3-T1: 전체 UI Polish + 버그 수정
- **우선순위:** P0

### P4-E3-T2: Parameter Comparison Mode
- **우선순위:** P2

### P4-E3-T3: 3D 고급 (Tooltip, Current Streamline)
- **우선순위:** P2

---

### Phase 4 요약
| 항목 | 수량 |
|------|------|
| Task | ~7 |

---

# 전체 요약

| Phase | Task 수 | 핵심 산출물 |
|-------|---------|------------|
| **Phase 1** | 17 | Level A 완전 동작 + 3D/2D/플롯 |
| **Phase 2** | 8 | Level B + Process Mode + 도핑 시각화 |
| **Phase 3** | 7 | Level C 수치 엔진 + Web Worker |
| **Phase 4** | ~7 | Export, Presets, Polish |
| **Total** | **~39** | |

---

# Claude Code 구현 가이드

## 실행 순서 (Critical Path)

```
1. P1-E1-T1 (프로젝트 생성)
2. P1-E1-T2 (타입 정의)
3. P1-E2-T1→T2→T3→T4 (물리 엔진)     ← 핵심, 먼저 완성
4. P1-E3-T1 (Zustand stores)
5. P1-E4-T1→T2→T3→T4→T5 (UI)
6. P1-E5-T1 (useSimulation hook)       ← 물리+UI 연결
7. P1-E6-T1→T2 (3D)
8. P1-E7-T1 (2D)
9. P1-E8-T1→T2→T3 (플롯)
10. P1-E9-T1→T2 (통합)
```

## 구현 원칙

1. **physics/ 먼저:** UI 없이 물리 엔진부터 완성. 콘솔에서 검증 가능해야 함
2. **타입 엄격하게:** 물리 파라미터는 반드시 타입 + 단위 주석
3. **store 통해서:** 컴포넌트 간 직접 통신 없이 반드시 Zustand store 경유
4. **Three.js는 ref로:** @react-three/fiber 사용하지 않음. useRef + useEffect로 직접 관리
5. **Plotly는 react-plotly.js:** `<Plot data={...} layout={...} />` 컴포넌트 사용
6. **Worker는 Vite 패턴:** `new Worker(new URL('../physics/worker.ts', import.meta.url), { type: 'module' })`
