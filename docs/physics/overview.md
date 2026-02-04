# Physics Overview

## MOSFET Operating Principles

The Metal-Oxide-Semiconductor Field-Effect Transistor (MOSFET) is the fundamental building block of modern integrated circuits. It controls current flow through a **channel** region between source and drain terminals. The channel conductivity is modulated by the electric field from the gate electrode, which is separated from the channel by a thin gate oxide.

### Basic Structure

A MOSFET consists of four terminals:

| Terminal | Function |
|----------|----------|
| **Gate (G)** | Controls channel conductivity via electric field |
| **Source (S)** | Carrier injection point |
| **Drain (D)** | Carrier collection point |
| **Body (B)** | Substrate contact, affects threshold voltage |

## Key Concepts

### Threshold Voltage ($V_{th}$)

The **threshold voltage** is the gate voltage required to create a conductive inversion layer (channel). It depends on several factors:

- **Flat-band voltage**: $V_{FB} = \phi_{ms} - Q_f/C_{ox}$
- **Surface potential**: $2\phi_F$ (for strong inversion)
- **Body effect**: $\gamma\sqrt{2\phi_F + V_{SB}}$

$$
V_{th} = V_{FB} + 2\phi_F + \gamma\sqrt{2\phi_F + V_{SB}}
$$

Where:
- $\phi_{ms}$: Metal-semiconductor work function difference
- $Q_f$: Fixed oxide charge
- $C_{ox}$: Oxide capacitance per unit area
- $\phi_F$: Fermi potential
- $\gamma$: Body effect coefficient

### Operating Regions

The MOSFET operates in three distinct regions depending on bias conditions:

| Region | Condition | Behavior |
|--------|-----------|----------|
| **Cutoff** | $V_{GS} < V_{th}$ | Channel not formed, only subthreshold leakage |
| **Linear (Triode)** | $V_{GS} > V_{th}$, $V_{DS} < V_{GS} - V_{th}$ | Acts like a voltage-controlled resistor |
| **Saturation** | $V_{GS} > V_{th}$, $V_{DS} \geq V_{GS} - V_{th}$ | Channel pinched off, current nearly constant |

### I-V Characteristics

The following chart shows typical MOSFET output characteristics (Id vs Vds) for different gate voltages:

<IVChart type="output" />

The transfer characteristic (Id vs Vgs) shows how current varies with gate voltage:

<IVChart type="transfer" />

### Subthreshold Conduction

Below threshold, the current doesn't go to zero immediately. The **subthreshold swing (SS)** characterizes how sharply the transistor turns off:

$$
SS = \frac{dV_{GS}}{d(\log_{10} I_D)} = \ln(10) \cdot \frac{kT}{q} \cdot n
$$

Where $n = 1 + C_{dep}/C_{ox}$ is the body factor.

The **ideal SS at room temperature** is approximately **60 mV/decade**, meaning a 60mV change in Vgs changes drain current by 10×.

::: info Why 60 mV/decade?
At T = 300K, $kT/q \approx 26$ mV. Multiplied by $\ln(10) \approx 2.3$, this gives $60$ mV. This is the theoretical minimum for conventional MOSFETs due to Boltzmann statistics of carrier injection.
:::

## Energy Band Diagram

Understanding the MOS band diagram is crucial for device physics. The diagram below shows the energy bands in inversion:

<BandDiagram bias="inversion" />

Different bias conditions create different band configurations:

| Bias Condition | Surface State | Band Bending |
|---------------|---------------|--------------|
| Accumulation | Majority carriers accumulate | Bands bend toward Ef |
| Flat-band | No band bending | Bands are flat |
| Depletion | Surface depleted | Bands bend away from Ef |
| Inversion | Minority carriers at surface | Strong bending, $\psi_s = 2\phi_F$ |

## Capacitance-Voltage Characteristics

The MOS capacitor exhibits three distinct regions in C-V measurements:

<CVChart :showRegions="true" />

### C-V Regions Explained

1. **Accumulation** ($V_G < V_{FB}$): Majority carriers pile up at the surface
   - $C = C_{ox}$ (maximum capacitance)

2. **Depletion** ($V_{FB} < V_G < V_{th}$): Surface depleted of carriers
   - $C = \frac{C_{ox} \cdot C_{dep}}{C_{ox} + C_{dep}}$ (series combination)

3. **Inversion** ($V_G > V_{th}$): Minority carriers form inversion layer
   - **High frequency**: Inversion charge can't follow AC signal, $C = C_{min}$
   - **Low frequency**: Inversion charge responds, $C \rightarrow C_{ox}$

## Material Parameters

### Silicon Properties at 300K

| Property | Symbol | Value | Unit |
|----------|--------|-------|------|
| Band gap | $E_g$ | 1.12 | eV |
| Dielectric constant | $\varepsilon_{Si}$ | 11.7 | - |
| Intrinsic carrier concentration | $n_i$ | $1.07 \times 10^{10}$ | cm⁻³ |
| Electron mobility | $\mu_n$ | 1400 | cm²/V·s |
| Hole mobility | $\mu_p$ | 450 | cm²/V·s |
| Electron saturation velocity | $v_{sat,n}$ | $1.0 \times 10^7$ | cm/s |
| Hole saturation velocity | $v_{sat,p}$ | $0.8 \times 10^7$ | cm/s |

### Gate Dielectric Materials

| Material | Dielectric Constant ($\kappa$) | Band Gap (eV) | EOT Factor |
|----------|-------------------------------|---------------|------------|
| SiO₂ | 3.9 | 9.0 | 1.0 |
| Si₃N₄ | 7.5 | 5.3 | 0.52 |
| HfO₂ | 25 | 5.8 | 0.16 |
| ZrO₂ | 25 | 5.8 | 0.16 |

::: tip High-k Dielectrics
High-k materials like HfO₂ allow thicker physical oxide for the same $C_{ox}$, reducing gate leakage while maintaining electrostatic control. The **Equivalent Oxide Thickness (EOT)** relates physical thickness to SiO₂ equivalent:

$$
EOT = t_{high-k} \cdot \frac{\kappa_{SiO_2}}{\kappa_{high-k}}
$$
:::

## Temperature Effects

Temperature significantly affects MOSFET characteristics:

| Parameter | Temperature Dependence |
|-----------|----------------------|
| $n_i$ | Increases exponentially with T |
| $\mu$ | Decreases with T (phonon scattering) |
| $V_{th}$ | Decreases ~2 mV/K |
| $I_{off}$ | Increases exponentially with T |
| $I_{on}$ | Decreases slightly with T |

The threshold voltage temperature coefficient is approximately:

$$
\frac{dV_{th}}{dT} \approx -2 \text{ mV/K}
$$

## Physics Model Levels

The simulator implements three levels of physics modeling:

| Level | Model Type | Speed | Accuracy | Use Case |
|-------|-----------|-------|----------|----------|
| **A** | Analytical | Fast | Basic | Learning, quick analysis |
| **B** | Semi-empirical | Fast | Good | Device design, SCE analysis |
| **C** | Numerical | Slow | High | Research, validation |

See the detailed documentation for each level:
- [Level A - Analytical Model](./level-a)
- [Level B - Semi-empirical Model](./level-b)
- [Level C - Numerical Model](./level-c)
