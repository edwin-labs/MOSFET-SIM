# Level B - Semi-empirical Model

Level B extends the analytical model with **short-channel effects** and **semi-empirical corrections**. It provides more realistic results for modern scaled transistors.

## Additional Physics Effects

### 1. Velocity Saturation

At high lateral electric fields, carrier velocity saturates at $v_{sat}$:

$$
\mu_{eff} = \frac{\mu_0}{1 + \mu_0 E / v_{sat}}
$$

This modifies the saturation voltage:

$$
V_{dsat} = \frac{V_{ov} \cdot E_{sat} \cdot L}{E_{sat} \cdot L + V_{ov}}
$$

Where $E_{sat} = 2 v_{sat} / \mu$ is the saturation field.

### 2. DIBL (Drain-Induced Barrier Lowering)

The drain voltage reduces the source-channel barrier, lowering threshold:

$$
\Delta V_{th} = -\eta \cdot V_{DS}
$$

Where $\eta$ is the DIBL coefficient (typically 20-200 mV/V for short channels).

### 3. Channel Length Modulation (CLM)

In saturation, the channel pinch-off point moves toward the source as $V_{DS}$ increases:

$$
I_D = I_{D,sat} \cdot (1 + \lambda V_{DS})
$$

Where $\lambda \propto 1/L$ is the CLM parameter.

### 4. Body Effect

Back-bias affects threshold voltage:

$$
V_{th}(V_{SB}) = V_{th0} + \gamma \left( \sqrt{2\phi_F + V_{SB}} - \sqrt{2\phi_F} \right)
$$

### 5. Mobility Degradation

Vertical field from gate oxide degrades mobility:

$$
\mu_{eff} = \frac{\mu_0}{1 + \theta (V_{GS} - V_{th})}
$$

Where $\theta$ is the mobility degradation coefficient (~0.1 V⁻¹).

### 6. Non-ideal Subthreshold Swing

Interface traps and depletion capacitance increase SS:

$$
SS = \frac{kT}{q} \ln(10) \left(1 + \frac{C_{dep}}{C_{ox}} + \frac{C_{it}}{C_{ox}}\right)
$$

## Short-Channel $V_{th}$ Roll-off

Charge sharing between source/drain reduces effective channel charge:

$$
\Delta V_{th,sc} \approx -\frac{x_j + x_d}{2L} \cdot 2\phi_F
$$

## Additional Metrics

Level B extracts additional metrics:
- **DIBL**: Measured as $(V_{th}|_{low V_{ds}} - V_{th}|_{high V_{ds}}) / \Delta V_{DS}$
- **$g_{m,max}$**: Peak transconductance
- **$V_{dsat}$**: Saturation voltage with velocity saturation

## When to Use

- Device design and optimization
- Short-channel device analysis
- Process technology comparisons
- Understanding SCE impact
