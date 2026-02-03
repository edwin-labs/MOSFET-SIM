# MOSFET Junction Simulator

Interactive web-based MOSFET device simulator with 3D visualization and multi-level physics engines.

## Features

- **Multi-level Physics Engines**
  - **Level A (Analytical)**: Shockley model with subthreshold current, ideal for quick analysis
  - **Level B (Semi-empirical)**: Velocity saturation, DIBL, CLM, body effect, mobility degradation
  - **Level C (Numerical)**: 2D Poisson + Drift-Diffusion with Gummel iteration solver

- **Device Visualization**
  - 3D interactive MOSFET structure with OrbitControls
  - 2D cross-section views (Front/Top/Side)
  - Doping colormap overlay
  - Depletion region visualization
  - Current flow arrows

- **Analysis Plots**
  - I-V characteristics (output and transfer)
  - C-V characteristics (high frequency)
  - Energy band diagram
  - Transconductance (gm) and output conductance (gds)
  - Doping profile (vertical and lateral)

- **Device Metrics Dashboard**
  - Threshold voltage (Vth)
  - Subthreshold swing (SS)
  - On/Off current ratio
  - DIBL coefficient
  - Peak transconductance (gm,max)

- **Technology Presets**
  - 180nm, 90nm, 45nm, 28nm technology nodes
  - Pre-configured device parameters

- **Export Capabilities**
  - CSV export for I-V and C-V data
  - JSON state save/load
  - Parameter comparison mode

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **3D Graphics**: Three.js
- **Plotting**: Plotly.js
- **State Management**: Zustand
- **Styling**: CSS Modules

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/edwin-labs/MOSFET-SIM.git
cd MOSFET-SIM

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
pnpm build
```

## Physics Models

### Level A: Analytical Model

Implements the classical Shockley MOSFET equations:

- **Linear region**: I_D = μ·C_ox·(W/L)·[(V_GS - V_th)·V_DS - V_DS²/2]
- **Saturation region**: I_D = (μ·C_ox/2)·(W/L)·(V_GS - V_th)²
- **Subthreshold**: I_sub = I_0·exp(V_GS/(n·V_T))·[1 - exp(-V_DS/V_T)]

### Level B: Semi-empirical Model

Extends Level A with short-channel effects:

- **Velocity saturation**: μ_eff = μ_0/(1 + μ_0·E/v_sat)
- **DIBL**: ΔV_th = -η·V_DS
- **Channel length modulation**: I_D·(1 + λ·V_DS)
- **Body effect**: V_th(V_SB) = V_th0 + γ·(√(2φ_F + V_SB) - √(2φ_F))
- **Mobility degradation**: μ_eff = μ_0/(1 + θ·(V_GS - V_th))

### Level C: Numerical Model

2D numerical simulation using:

- **Poisson equation**: ∇²ψ = -ρ/ε
- **Drift-diffusion**: J_n = qμ_n·n·E + qD_n·∇n
- **Scharfetter-Gummel discretization** for carrier continuity
- **Gummel iteration** for self-consistent solution
- **BiCGSTAB** sparse linear solver

## Project Structure

```
src/
├── components/
│   ├── layout/      # App layout components
│   ├── params/      # Parameter input panels
│   ├── plots/       # Analysis plots
│   └── views/       # 3D and 2D visualization
├── hooks/           # React hooks
├── physics/         # Physics engines
│   ├── levelA.ts    # Analytical model
│   ├── levelB.ts    # Semi-empirical model
│   └── levelC/      # Numerical solver
├── store/           # Zustand state stores
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Physics models based on semiconductor device physics textbooks
