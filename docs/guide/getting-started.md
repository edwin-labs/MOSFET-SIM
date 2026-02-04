# Getting Started

This guide will help you start using the MOSFET Junction Simulator.

## Interface Overview

The application has a three-panel layout:

```
┌──────────────────────────────────────────────────────┐
│                     Toolbar                          │
├──────────┬─────────────────────────┬────────────────┤
│          │                         │                │
│  Left    │        Main View        │    Right       │
│ Sidebar  │    (3D + 2D Views)      │   Sidebar      │
│          │                         │                │
│(Params)  │                         │   (Plots)      │
│          │                         │                │
├──────────┴─────────────────────────┴────────────────┤
│                    Status Bar                        │
└──────────────────────────────────────────────────────┘
```

## Toolbar Controls

| Control | Description |
|---------|-------------|
| **Device** | Switch between nMOS and pMOS |
| **Level** | Select physics model (A/B/C) |
| **Mode** | Device or Process mode |
| **Tech** | Technology node preset |
| **T** | Operating temperature |
| **View** | Colormap mode |
| **Auto** | Auto-simulate on parameter change |
| **Reset** | Reset to default parameters |
| **Theme** | Dark/Light mode toggle |

## Quick Start

### Step 1: Select Device Type

Click **nMOS** or **pMOS** in the toolbar. This changes:
- Substrate type (p-type for nMOS, n-type for pMOS)
- Source/Drain type (n+ for nMOS, p+ for pMOS)
- Bias polarities

### Step 2: Choose Physics Level

| Level | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| **A** | Fast | Basic | Learning, quick analysis |
| **B** | Fast | Good | Device design |
| **C** | Slow | High | Accurate simulation |

### Step 3: Set Device Parameters

Use the left sidebar to adjust:
- **Gate Stack**: Oxide thickness, channel length
- **Channel**: Doping concentration
- **Source/Drain**: Doping, junction depth
- **Substrate**: Background doping

### Step 4: Apply Bias

Use the **Bias Controls** section:
- **Vgs**: Gate-to-source voltage
- **Vds**: Drain-to-source voltage
- **Vbs**: Body-to-source voltage

### Step 5: View Results

The right sidebar shows:
- **Device Metrics**: Vth, SS, Ion/Ioff
- **I-V Plots**: Output and transfer characteristics
- **C-V Plot**: Capacitance vs gate voltage
- **Band Diagram**: Energy band structure

## Using Technology Presets

The Tech dropdown provides pre-configured parameters:

| Node | Gate Length | Vdd | tox |
|------|-------------|-----|-----|
| 180nm | 180 nm | 1.8V | 4 nm |
| 90nm | 90 nm | 1.2V | 2.5 nm |
| 45nm | 45 nm | 1.0V | 1.4 nm |
| 28nm | 28 nm | 0.9V | 1.2 nm |

## Viewing Results

### 3D View
- **Rotate**: Left-click drag
- **Zoom**: Mouse wheel
- **Pan**: Right-click drag

### Plots
Each plot can be expanded/collapsed by clicking its header.
