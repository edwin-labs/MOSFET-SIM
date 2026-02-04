# Level A - Analytical Model

Level A implements the **classical Shockley MOSFET equations** with smooth subthreshold transition. It provides fast, analytical solutions ideal for understanding basic MOSFET behavior and quick parameter exploration.

## Drain Current Model

### Long-Channel Current Equations

The classical long-channel MOSFET model is derived from gradual channel approximation:

**Linear Region** ($V_{DS} < V_{GS} - V_{th}$):

$$
I_D = \mu_n C_{ox} \frac{W}{L} \left[ (V_{GS} - V_{th}) V_{DS} - \frac{V_{DS}^2}{2} \right]
$$

**Saturation Region** ($V_{DS} \geq V_{GS} - V_{th}$):

$$
I_D = \frac{\mu_n C_{ox}}{2} \frac{W}{L} (V_{GS} - V_{th})^2
$$

Where:
- $\mu_n$: Electron mobility (cm²/V·s)
- $C_{ox} = \varepsilon_{ox}/t_{ox}$: Gate oxide capacitance (F/cm²)
- $W$: Channel width
- $L$: Channel length
- $V_{th}$: Threshold voltage

### Output Characteristics

The following chart shows ideal long-channel output characteristics:

<IVChart type="output" :vth="0.4" />

Notice how:
- Current increases linearly with $V_{DS}$ in the linear region
- Current saturates when $V_{DS} = V_{GS} - V_{th}$ (pinch-off)
- In saturation, current is independent of $V_{DS}$ (ideal case)

### Subthreshold Region

Below threshold ($V_{GS} < V_{th}$), current is dominated by diffusion:

$$
I_{sub} = I_0 \exp\left(\frac{V_{GS} - V_{th}}{n V_T}\right) \left[1 - \exp\left(-\frac{V_{DS}}{V_T}\right)\right]
$$

Where:
- $n$: Subthreshold swing factor (typically 1.3-1.5)
- $V_T = kT/q$: Thermal voltage (~26 mV at 300K)
- $I_0$: Pre-exponential current factor

::: info Subthreshold Swing
The subthreshold swing $SS = n \cdot V_T \cdot \ln(10) \approx 60n$ mV/decade determines how sharply the device turns off. Smaller SS means better switching efficiency.
:::

### Transfer Characteristics

The transfer curve shows both linear and logarithmic current scales:

<IVChart type="transfer" />

Key observations:
- **Linear scale** (blue): Shows quadratic increase above threshold
- **Log scale** (red): Shows exponential subthreshold behavior
- **Transition region**: Smooth interpolation near $V_{th}$

## Threshold Voltage Calculation

The threshold voltage is calculated from device parameters:

$$
V_{th} = V_{FB} + 2\phi_F + \gamma\sqrt{2\phi_F + V_{SB}}
$$

### Component Breakdown

| Component | Formula | Physical Meaning |
|-----------|---------|------------------|
| Flat-band voltage | $V_{FB} = \phi_{ms} - Q_f/C_{ox}$ | Work function difference + fixed charge |
| Surface potential | $2\phi_F$ | Condition for strong inversion |
| Body effect | $\gamma\sqrt{2\phi_F + V_{SB}}$ | Back-bias sensitivity |

### Fermi Potential

$$
\phi_F = \frac{kT}{q} \ln\left(\frac{N_A}{n_i}\right) \quad \text{(p-type)}
$$

$$
\phi_F = \frac{kT}{q} \ln\left(\frac{N_D}{n_i}\right) \quad \text{(n-type)}
$$

### Body Effect Coefficient

$$
\gamma = \frac{\sqrt{2 q \varepsilon_{Si} N_A}}{C_{ox}}
$$

Typical values: $\gamma \approx 0.3-0.5$ V^1/2 for modern technologies.

## Capacitance Model

Level A includes a high-frequency MOS capacitance model:

| Region | Condition | Capacitance |
|--------|-----------|-------------|
| Accumulation | $V_G < V_{FB}$ | $C = C_{ox}$ |
| Depletion | $V_{FB} < V_G < V_{th}$ | $C = \frac{C_{ox} C_{dep}}{C_{ox} + C_{dep}}$ |
| Inversion | $V_G > V_{th}$ | $C = C_{min}$ (HF) |

<CVChart />

### Depletion Capacitance

$$
C_{dep} = \frac{\varepsilon_{Si}}{x_d}
$$

Where the depletion width is:

$$
x_d = \sqrt{\frac{2\varepsilon_{Si}(|\psi_s| + V_{SB})}{qN_A}}
$$

## Transconductance

The transconductance $g_m$ measures output current sensitivity to gate voltage:

**Linear Region:**
$$
g_m = \mu_n C_{ox} \frac{W}{L} V_{DS}
$$

**Saturation Region:**
$$
g_m = \mu_n C_{ox} \frac{W}{L} (V_{GS} - V_{th}) = \sqrt{2\mu_n C_{ox} \frac{W}{L} I_D}
$$

::: tip Design Insight
In saturation, $g_m \propto \sqrt{I_D}$, so doubling $g_m$ requires 4× the current. This is a fundamental trade-off in analog circuit design.
:::

## Model Assumptions & Limitations

Level A makes several simplifying assumptions:

### Assumptions
- Gradual channel approximation (field along channel << field across oxide)
- Constant mobility (no field dependence)
- Abrupt depletion approximation
- Complete ionization of dopants
- No short-channel effects

### What's NOT Included

| Effect | Impact | Why Missing |
|--------|--------|-------------|
| Velocity saturation | Reduces $I_{on}$ | Requires field-dependent mobility |
| DIBL | Lowers $V_{th}$ at high $V_{DS}$ | 2D electrostatics needed |
| CLM | Non-zero output conductance | Pinch-off point movement |
| Mobility degradation | Reduces current | Vertical field effect |
| Quantum effects | Increases $V_{th}$ | Carrier confinement |

## When to Use Level A

✅ **Good for:**
- Understanding basic MOSFET physics
- Quick parameter exploration
- Educational purposes
- Initial device sizing
- Long-channel devices (L > 1 μm)

❌ **Not suitable for:**
- Short-channel devices (L < 100 nm)
- Accurate analog design
- Predicting leakage currents
- Process variation analysis

## Implementation Notes

The simulator smoothly interpolates between regions to avoid discontinuities:

```
if Vov <= -3*n*Vt:
    Id = subthreshold only
elif Vov >= 3*n*Vt:
    Id = above-threshold only
else:
    Id = smooth interpolation
```

This ensures continuous $I_D$, $g_m$, and $g_{ds}$ across all bias conditions.
