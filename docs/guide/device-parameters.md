# Device Parameters

This guide explains all the device parameters available in the simulator and their effects on device performance.

## Gate Stack

### Oxide Thickness ($t_{ox}$)

| Property | Value |
|----------|-------|
| **Range** | 0.5 - 10 nm |
| **Default** | 2 nm |
| **Unit** | nm |

**Physical Significance:**

The gate oxide thickness directly affects oxide capacitance:

$$
C_{ox} = \frac{\varepsilon_{ox}}{t_{ox}}
$$

**Effects:**

| Lower $t_{ox}$ | Higher $t_{ox}$ |
|----------------|-----------------|
| ↑ Gate capacitance | ↓ Gate capacitance |
| ↑ Drive current | ↓ Drive current |
| ↓ Threshold voltage | ↑ Threshold voltage |
| ↑ Gate leakage | ↓ Gate leakage |
| Better SCE control | Worse SCE control |

::: warning Scaling Limits
Below ~1.5nm (SiO₂), direct tunneling becomes significant. Modern processes use high-k dielectrics (HfO₂) to maintain physical thickness while achieving low EOT.
:::

### Channel Length ($L_{eff}$)

| Property | Value |
|----------|-------|
| **Range** | 20 - 500 nm |
| **Default** | 90 nm |
| **Unit** | nm |

**Physical Significance:**

Channel length determines current capacity and short-channel susceptibility:

$$
I_D \propto \frac{W}{L} \quad \text{(long-channel)}
$$

$$
I_D \propto W \cdot v_{sat} \quad \text{(short-channel)}
$$

**Effects:**

| Shorter L | Longer L |
|-----------|----------|
| ↑ Current density | ↓ Current density |
| ↑ Speed (lower RC) | ↓ Speed |
| ↑ SCE (DIBL, Vth roll-off) | ↓ SCE |
| ↑ Leakage | ↓ Leakage |

### Gate Work Function ($\Phi_M$)

| Property | Value |
|----------|-------|
| **Range** | 4.0 - 5.5 eV |
| **Default** | 4.15 eV (n+ poly), 5.25 eV (p+ poly) |
| **Unit** | eV |

**Common Materials:**

| Material | Work Function (eV) | Use |
|----------|-------------------|-----|
| n+ poly-Si | 4.05 - 4.15 | nMOS |
| p+ poly-Si | 5.15 - 5.25 | pMOS |
| TiN | 4.4 - 4.6 | nMOS (HKMG) |
| TaN | 4.8 - 5.0 | pMOS (HKMG) |

**Effect on Threshold:**

$$
V_{th} = \Phi_M - \chi_{Si} - \frac{E_g}{2q} - \phi_F + \frac{Q_{dep}}{C_{ox}}
$$

Adjusting $\Phi_M$ shifts $V_{th}$ approximately 1:1.

## Channel

### Channel Doping ($N_{ch}$)

| Property | Value |
|----------|-------|
| **Range** | 10¹⁵ - 10¹⁹ cm⁻³ |
| **Default** | 5×10¹⁷ cm⁻³ |
| **Unit** | cm⁻³ |

**Physical Significance:**

Channel doping sets the body charge that must be depleted to form an inversion layer:

$$
V_{th} \propto \sqrt{N_{ch}} \quad \text{(body effect term)}
$$

**Effects:**

| Higher $N_{ch}$ | Lower $N_{ch}$ |
|-----------------|----------------|
| ↑ Threshold voltage | ↓ Threshold voltage |
| ↓ DIBL | ↑ DIBL |
| ↓ Mobility (scattering) | ↑ Mobility |
| ↑ Body effect | ↓ Body effect |
| ↓ Depletion width | ↑ Depletion width |

::: tip Design Trade-off
High channel doping improves SCE control but degrades mobility. Modern devices use **retrograde doping** (low surface, high subsurface) for optimal trade-off.
:::

### Doping Profile Type

| Option | Description |
|--------|-------------|
| **Uniform** | Constant doping throughout channel |
| **Retrograde** | Low surface doping, peak below surface |
| **SSR** | Super-steep retrograde |

## Source/Drain

### S/D Doping ($N_{SD}$)

| Property | Value |
|----------|-------|
| **Range** | 10¹⁸ - 10²¹ cm⁻³ |
| **Default** | 10²⁰ cm⁻³ |
| **Unit** | cm⁻³ |

**Physical Significance:**

High S/D doping reduces:
- Contact resistance
- Series resistance
- Junction built-in potential

$$
R_{contact} \propto \frac{1}{\sqrt{N_{SD}}}
$$

**Effects:**

| Higher $N_{SD}$ | Lower $N_{SD}$ |
|-----------------|----------------|
| ↓ Series resistance | ↑ Series resistance |
| ↓ Contact resistance | ↑ Contact resistance |
| ↑ Junction capacitance | ↓ Junction capacitance |
| ↑ Band-to-band tunneling | ↓ Tunneling |

### Junction Depth ($x_j$)

| Property | Value |
|----------|-------|
| **Range** | 10 - 200 nm |
| **Default** | 50 nm |
| **Unit** | nm |

**Physical Significance:**

Junction depth affects the characteristic length:

$$
\lambda = \sqrt{\frac{\varepsilon_{Si}}{\varepsilon_{ox}} \cdot t_{ox} \cdot x_j}
$$

Good SCE control requires $L > 5\lambda$.

**Effects:**

| Shallower $x_j$ | Deeper $x_j$ |
|-----------------|--------------|
| ↓ SCE | ↑ SCE |
| ↑ Series resistance | ↓ Series resistance |
| ↓ Junction capacitance | ↑ Junction capacitance |

### LDD Doping ($N_{LDD}$)

| Property | Value |
|----------|-------|
| **Range** | 10¹⁷ - 10²⁰ cm⁻³ |
| **Default** | 5×10¹⁸ cm⁻³ |
| **Unit** | cm⁻³ |

**Purpose:**

Lightly Doped Drain (LDD) extensions:
- Reduce peak electric field at drain
- Mitigate hot carrier effects
- Improve reliability

### LDD Length ($L_{LDD}$)

| Property | Value |
|----------|-------|
| **Range** | 5 - 50 nm |
| **Default** | 20 nm |
| **Unit** | nm |

**Trade-offs:**

| Longer LDD | Shorter LDD |
|------------|-------------|
| ↓ Peak E-field | ↑ Peak E-field |
| ↑ Series resistance | ↓ Series resistance |
| Better HCI immunity | Worse HCI immunity |

## Substrate

### Substrate Doping ($N_{sub}$)

| Property | Value |
|----------|-------|
| **Range** | 10¹⁴ - 10¹⁸ cm⁻³ |
| **Default** | 10¹⁷ cm⁻³ |
| **Unit** | cm⁻³ |

**Physical Significance:**

Sets the body effect coefficient:

$$
\gamma = \frac{\sqrt{2q\varepsilon_{Si}N_{sub}}}{C_{ox}}
$$

And depletion width:

$$
x_{dep} = \sqrt{\frac{2\varepsilon_{Si}(2\phi_F + V_{SB})}{qN_{sub}}}
$$

## Geometry

### Channel Width ($W$)

| Property | Value |
|----------|-------|
| **Range** | 50 - 2000 nm |
| **Default** | 360 nm (nMOS), 720 nm (pMOS) |
| **Unit** | nm |

**Physical Significance:**

Width directly scales current:

$$
I_D \propto W
$$

$$
g_m \propto W
$$

::: info PMOS Sizing
PMOS is typically 2× wider than NMOS to compensate for lower hole mobility:
$$
\frac{W_P}{W_N} \approx \frac{\mu_n}{\mu_p} \approx 2-3
$$
:::

### Gate-S/D Overlap ($L_{ov}$)

| Property | Value |
|----------|-------|
| **Range** | 0 - 20 nm |
| **Default** | 5 nm |
| **Unit** | nm |

**Effects:**

- Contributes to overlap capacitance: $C_{ov} = C_{ox} \cdot W \cdot L_{ov}$
- Affects Miller effect in switching
- Reduces effective channel length

## Advanced Parameters

### Fixed Oxide Charge ($Q_f$)

| Property | Value |
|----------|-------|
| **Range** | ±10¹² cm⁻² |
| **Default** | 0 |
| **Unit** | cm⁻² |

**Effect:**

Shifts flat-band and threshold voltage:

$$
\Delta V_{FB} = -\frac{Q_f}{C_{ox}}
$$

Positive charge shifts $V_{th}$ negative.

### Interface Trap Density ($D_{it}$)

| Property | Value |
|----------|-------|
| **Range** | 0 - 10¹³ cm⁻² eV⁻¹ |
| **Default** | 0 |
| **Unit** | cm⁻² eV⁻¹ |

**Effects:**

- Increases subthreshold swing
- Causes frequency dispersion in C-V
- Degrades mobility (Coulomb scattering)

$$
SS = 60 \text{ mV/dec} \times \left(1 + \frac{C_{dep} + C_{it}}{C_{ox}}\right)
$$

### Series Resistance ($R_S$, $R_D$)

| Property | Value |
|----------|-------|
| **Range** | 0 - 1000 Ω |
| **Default** | 0 |
| **Unit** | Ω |

**Effects:**

- Reduces effective $V_{DS}$: $V_{DS,eff} = V_{DS} - I_D(R_S + R_D)$
- Limits maximum current
- Causes negative feedback

**Components:**
- Contact resistance
- Silicide resistance
- LDD resistance
- Spreading resistance

## Parameter Scaling Guidelines

For scaling to a new technology node:

| Parameter | Scaling Factor | 45nm → 28nm |
|-----------|----------------|-------------|
| $L$ | 0.7× | 45 → 28 nm |
| $W$ | 0.7× | 180 → 120 nm |
| $t_{ox}$ | 0.8× | 1.5 → 1.2 nm |
| $V_{DD}$ | 0.9× | 1.0 → 0.9 V |
| $x_j$ | 0.7× | 30 → 20 nm |
| $N_{ch}$ | 1.4× | 10¹⁸ → 2×10¹⁸ cm⁻³ |

::: warning Non-Ideal Scaling
Real scaling is constrained by:
- Gate leakage (can't scale $t_{ox}$ indefinitely)
- Threshold variation (limits $V_{DD}$ scaling)
- Power density (thermal limits)
:::
