# Level B - Semi-empirical Model

Level B extends the analytical model with **short-channel effects (SCE)** and **semi-empirical corrections**. It provides more realistic results for modern scaled transistors while maintaining computational efficiency.

## Short-Channel Effects Overview

As MOSFET dimensions shrink, several non-ideal effects become significant:

| Effect | Physical Origin | Impact on Device |
|--------|-----------------|------------------|
| Velocity Saturation | High lateral field | Reduced current, earlier saturation |
| DIBL | Drain field penetration | Lower Vth, higher Ioff |
| CLM | Pinch-off movement | Non-zero output conductance |
| Mobility Degradation | Vertical field scattering | Reduced current |
| Hot Carriers | High-energy electrons | Reliability degradation |

## 1. Velocity Saturation

At high lateral electric fields ($E > E_{sat}$), carrier velocity saturates:

$$
v = \frac{\mu_0 E}{1 + E/E_{sat}} \rightarrow v_{sat} \text{ as } E \rightarrow \infty
$$

<ModelComparison effect="velocity" />

### Modified Saturation Voltage

With velocity saturation, the device saturates at a lower voltage:

$$
V_{dsat} = \frac{V_{ov} \cdot E_{sat} \cdot L}{E_{sat} \cdot L + V_{ov}}
$$

Where $E_{sat} = 2v_{sat}/\mu_0$ is the saturation field (~0.8 V/μm for electrons).

::: warning Short-Channel Impact
For a 45nm device with $V_{ov}$ = 0.4V:
- Long-channel: $V_{dsat} = V_{ov}$ = 0.4V
- With velocity sat: $V_{dsat}$ ≈ 0.25V

The device saturates **earlier** and at **lower current**.
:::

### Saturation Current

$$
I_{D,sat} = W \cdot C_{ox} \cdot v_{sat} \cdot (V_{GS} - V_{th} - V_{dsat})
$$

For very short channels, this approaches:
$$
I_{D,sat} \approx W \cdot C_{ox} \cdot v_{sat} \cdot (V_{GS} - V_{th})
$$

Note: Current becomes **linear** with $(V_{GS} - V_{th})$ instead of quadratic!

## 2. DIBL (Drain-Induced Barrier Lowering)

The drain electric field penetrates into the channel, lowering the source-channel barrier:

$$
V_{th}(V_{DS}) = V_{th,lin} - \eta \cdot V_{DS}
$$

Where $\eta$ is the DIBL coefficient (typically 20-200 mV/V).

<ModelComparison effect="dibl" />

### DIBL Scaling

DIBL worsens with shorter channels:

$$
\eta \propto \frac{1}{L} \cdot \exp\left(-\frac{L}{\lambda}\right)
$$

Where $\lambda$ is the characteristic length:

$$
\lambda = \sqrt{\frac{\varepsilon_{Si}}{\varepsilon_{ox}} \cdot t_{ox} \cdot x_j}
$$

::: tip Design Rule
To maintain good SCE control: $L > 5-10 \lambda$

For a 45nm process: $t_{ox}$ ≈ 1.5nm, $x_j$ ≈ 30nm → $\lambda$ ≈ 12nm
:::

## 3. Channel Length Modulation (CLM)

In saturation, the pinch-off point moves toward the source as $V_{DS}$ increases:

$$
I_D = I_{D,sat} \cdot (1 + \lambda_{CLM} \cdot V_{DS})
$$

<ModelComparison effect="clm" />

### Output Conductance

CLM causes non-zero output conductance in saturation:

$$
g_{ds} = \frac{\partial I_D}{\partial V_{DS}} = \lambda_{CLM} \cdot I_{D,sat}
$$

This limits voltage gain in analog circuits: $A_v = g_m / g_{ds} = g_m \cdot r_o$

### CLM Coefficient

$$
\lambda_{CLM} \approx \frac{1}{L_{eff} \cdot E_{crit}}
$$

Typical values: $\lambda$ = 0.05-0.2 V⁻¹ for 45nm technology.

## 4. Body Effect

Back-bias voltage $V_{SB}$ affects threshold voltage:

$$
V_{th}(V_{SB}) = V_{th0} + \gamma \left( \sqrt{2\phi_F + V_{SB}} - \sqrt{2\phi_F} \right)
$$

| $V_{SB}$ | Δ$V_{th}$ (γ=0.4) |
|----------|-------------------|
| 0 V | 0 mV |
| 0.5 V | 85 mV |
| 1.0 V | 150 mV |

::: info Reverse Body Bias
Applying $V_{SB} > 0$ increases $V_{th}$, which:
- Reduces leakage (good for standby)
- Decreases $I_{on}$ (bad for performance)

This is used for dynamic threshold adjustment in low-power designs.
:::

## 5. Mobility Degradation

### Vertical Field Effect

The gate electric field pushes carriers against the Si/SiO₂ interface, increasing scattering:

$$
\mu_{eff} = \frac{\mu_0}{1 + \theta (V_{GS} - V_{th})}
$$

Where $\theta \approx 0.1$ V⁻¹ for electrons.

### Combined Mobility Model

Level B uses a unified mobility model:

$$
\mu_{eff} = \frac{\mu_0}{(1 + \theta_1 V_{ov})(1 + \theta_2 V_{ov}^2)}
$$

- $\theta_1$: Coulomb scattering (dominant at low $V_{ov}$)
- $\theta_2$: Surface roughness (dominant at high $V_{ov}$)

## 6. Subthreshold Swing Degradation

Interface traps and short-channel effects increase SS:

$$
SS = \frac{kT}{q} \ln(10) \cdot n
$$

Where the body factor becomes:

$$
n = 1 + \frac{C_{dep}}{C_{ox}} + \frac{C_{it}}{C_{ox}} + \eta_{SCE}
$$

| Technology | Typical SS |
|------------|------------|
| 180nm | 80-90 mV/dec |
| 65nm | 90-100 mV/dec |
| 28nm | 100-110 mV/dec |

## Complete Level B Current Model

The full drain current model combines all effects:

$$
I_D = \frac{W}{L_{eff}} \mu_{eff} C_{ox} \frac{(V_{GS} - V_{th,eff})^2}{1 + (V_{GS} - V_{th,eff})/(E_{sat} L)} \cdot \frac{1}{2} \cdot (1 + \lambda V_{DS})
$$

Where:
- $V_{th,eff} = V_{th0} + \Delta V_{th,body} - \eta V_{DS}$
- $\mu_{eff}$ includes vertical field degradation
- $E_{sat}$ accounts for velocity saturation
- $\lambda$ models CLM

## Extracted Metrics

Level B provides additional device metrics:

| Metric | Definition | Typical Range |
|--------|------------|---------------|
| **DIBL** | $(V_{th,lin} - V_{th,sat})/\Delta V_{DS}$ | 50-150 mV/V |
| **SS** | $d V_{GS}/d(\log_{10} I_D)$ | 70-110 mV/dec |
| **$g_{m,max}$** | Peak transconductance | 0.5-2 mS/μm |
| **$r_o$** | Output resistance | 1-10 kΩ·μm |
| **$I_{on}/I_{off}$** | Current ratio | 10⁵-10⁷ |

## When to Use Level B

✅ **Good for:**
- Device design and optimization
- Short-channel device analysis (L > 20nm)
- Process technology comparisons
- Understanding SCE tradeoffs
- Circuit-level simulations
- Analog design insights

❌ **Not suitable for:**
- Ultra-short channels (L < 20nm)
- Accurate leakage prediction
- Hot carrier reliability
- Quantum effects analysis

## Comparison: Level A vs Level B

| Aspect | Level A | Level B |
|--------|---------|---------|
| Velocity saturation | ❌ | ✅ |
| DIBL | ❌ | ✅ |
| CLM | ❌ | ✅ |
| Body effect | ✅ (basic) | ✅ (enhanced) |
| Mobility degradation | ❌ | ✅ |
| Computation time | ~1 ms | ~2 ms |
| Accuracy (45nm) | Poor | Good |

For accurate device characterization of advanced nodes, consider [Level C - Numerical Model](./level-c).
