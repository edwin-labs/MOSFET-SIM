# Getting Started

This guide will help you start using the MOSFET Junction Simulator for device analysis and learning.

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

### Panel Functions

| Panel | Purpose |
|-------|---------|
| **Toolbar** | Device type, physics level, view options |
| **Left Sidebar** | Device parameters, bias controls, export |
| **Main View** | 3D structure, 2D cross-sections |
| **Right Sidebar** | Metrics dashboard, I-V/C-V plots, band diagram |
| **Status Bar** | Simulation status, performance info |

## Toolbar Controls

| Control | Description |
|---------|-------------|
| **Device** | Switch between nMOS and pMOS |
| **Level** | Select physics model (A/B/C) |
| **Mode** | Device or Process parameter mode |
| **Tech** | Technology node preset |
| **T** | Operating temperature |
| **View** | Colormap mode (Structure/Doping/Potential) |
| **Auto** | Auto-simulate on parameter change |
| **Reset** | Reset to default parameters |
| **Theme** | Dark/Light mode toggle |

## Quick Start Tutorial

### Step 1: Select Device Type

Click **nMOS** or **pMOS** in the toolbar. This changes:

| Setting | nMOS | pMOS |
|---------|------|------|
| Substrate | p-type | n-type |
| Source/Drain | n+ | p+ |
| Bias polarity | Positive Vgs/Vds | Negative Vgs/Vds |
| Carriers | Electrons | Holes |

### Step 2: Choose Physics Level

| Level | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| **A** | ⚡ Instant | Basic | Learning, quick exploration |
| **B** | ⚡ Fast | Good | Device design, SCE analysis |
| **C** | 🐢 Slow | Excellent | Research, validation |

::: tip Recommendation
Start with **Level B** for a good balance of speed and accuracy. Use **Level C** only when you need 2D field distributions or high accuracy.
:::

### Step 3: Select Technology Node

Pre-configured parameters are available for common nodes:

| Node | Gate Length | Vdd | tox | Typical Use |
|------|-------------|-----|-----|-------------|
| 180nm | 180 nm | 1.8V | 4 nm | Legacy, analog |
| 90nm | 90 nm | 1.2V | 2 nm | Mature digital |
| 45nm | 45 nm | 1.0V | 1.5 nm | Modern CMOS |
| 28nm | 28 nm | 0.9V | 1.2 nm | Advanced node |

Or select **Custom** to manually set all parameters.

### Step 4: Set Device Parameters

Use the left sidebar to adjust device parameters:

**Gate Stack:**
- Oxide thickness ($t_{ox}$)
- Channel length ($L$)
- Gate work function ($\Phi_M$)

**Channel:**
- Doping concentration ($N_{ch}$)

**Source/Drain:**
- Doping ($N_{SD}$)
- Junction depth ($x_j$)
- LDD parameters

See [Device Parameters](./device-parameters) for detailed explanations.

### Step 5: Apply Bias Conditions

Use the **Bias Controls** section:

| Parameter | Description | nMOS Range | pMOS Range |
|-----------|-------------|------------|------------|
| **Vgs** | Gate-to-source | 0 to Vdd | 0 to -Vdd |
| **Vds** | Drain-to-source | 0 to Vdd | 0 to -Vdd |
| **Vbs** | Body-to-source | -Vdd to 0 | 0 to Vdd |

### Step 6: Analyze Results

The right sidebar displays:

**Device Metrics Dashboard:**
- Threshold voltage ($V_{th}$)
- Subthreshold swing (SS)
- On/Off current ratio
- DIBL coefficient
- Peak transconductance ($g_{m,max}$)

**Plots:**
- I-V characteristics
- C-V characteristics
- Band diagram
- Transconductance plots
- Doping profile

## View Controls

### 3D View Interaction

| Action | Mouse | Result |
|--------|-------|--------|
| **Rotate** | Left-click + drag | Orbit around device |
| **Zoom** | Scroll wheel | Zoom in/out |
| **Pan** | Right-click + drag | Move view |

### 2D Views

The 2D panel shows cross-sections:
- **Front View (X-Z)**: Along channel direction
- **Top View (X-Y)**: Bird's eye view
- **Side View (Y-Z)**: Width direction

### Colormap Modes

| Mode | Shows |
|------|-------|
| **Structure** | Physical regions (substrate, channel, gate, etc.) |
| **Doping** | Net doping concentration (n-type red, p-type blue) |
| **Net Type** | Simplified n/p regions |
| **Potential** | Electrostatic potential (Level C only) |
| **E-Field** | Electric field magnitude (Level C only) |

## Using the Comparison Feature

To compare two device configurations:

1. Set up first device
2. Click **Save State A** in Comparison panel
3. Modify parameters
4. Click **Save State B**
5. Toggle **Show Comparison** to overlay results

::: info Use Cases
- Compare different technology nodes
- Analyze SCE vs long-channel behavior
- Study parameter sensitivity
:::

## Exporting Data

### Available Exports

| Format | Contents |
|--------|----------|
| **CSV (I-V)** | Drain current vs bias data |
| **CSV (C-V)** | Capacitance vs gate voltage |
| **JSON** | Complete simulation state |

### How to Export

1. Open **Export** panel in left sidebar
2. Select export type
3. Click export button
4. File downloads automatically

## Performance Tips

### For Faster Simulation

- Use Level A or B instead of C
- Reduce mesh size (Level C settings)
- Disable auto-simulate for parameter sweeps
- Use technology presets instead of custom values

### For More Accuracy

- Use Level C numerical solver
- Increase mesh density near critical regions
- Enable advanced physics options
- Use smaller convergence tolerance

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Reset view |
| `D` | Toggle dark mode |
| `A` | Toggle auto-simulate |
| `1/2/3` | Switch physics level |

## Common Issues

### Simulation Not Updating

- Check if "Auto" is enabled
- For Level C, wait for completion (check status bar)
- Try clicking "Simulate" manually

### Unexpected Results

- Verify bias polarities match device type
- Check that parameters are physically reasonable
- Start from a technology preset

### Level C Too Slow

- Reduce mesh size
- Use coarser tolerance
- Consider Level B for initial exploration

## Next Steps

- Read [Device Parameters](./device-parameters) for parameter details
- Explore [Physics Overview](/physics/overview) to understand the models
- Try different technology nodes and compare results
