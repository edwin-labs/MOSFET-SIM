# Level A - Analytical Model

Level A implements the **classical Shockley MOSFET equations** with smooth subthreshold transition. It provides fast, analytical solutions ideal for understanding basic MOSFET behavior.

## Drain Current Model

### Above Threshold ($V_{GS} > V_{th}$)

**Linear Region** ($V_{DS} < V_{GS} - V_{th}$):

$$
I_D = \mu C_{ox} \frac{W}{L} \left[ (V_{GS} - V_{th}) V_{DS} - \frac{V_{DS}^2}{2} \right]
$$

**Saturation Region** ($V_{DS} \geq V_{GS} - V_{th}$):

$$
I_D = \frac{\mu C_{ox}}{2} \frac{W}{L} (V_{GS} - V_{th})^2
$$

### Subthreshold Region ($V_{GS} < V_{th}$)

$$
I_{sub} = I_0 \exp\left(\frac{V_{GS}}{n V_T}\right) \left[1 - \exp\left(-\frac{V_{DS}}{V_T}\right)\right]
$$

Where:
- $n$: Subthreshold swing factor (~1.5)
- $V_T$: Thermal voltage ($kT/q \approx 26$ mV at 300K)
- $I_0$: Pre-exponential current factor

## Threshold Voltage

$$
V_{th} = V_{FB} + 2\phi_F + \gamma\sqrt{2\phi_F + V_{SB}}
$$

Where:
- $V_{FB}$: Flat-band voltage $= \phi_{ms} - Q_f/C_{ox}$
- $\phi_F$: Fermi potential $= (kT/q) \ln(N_A/n_i)$
- $\gamma$: Body effect coefficient $= \sqrt{2q\varepsilon_{Si} N_A} / C_{ox}$

## Capacitance Model

The high-frequency MOS capacitance model:

| Region | Capacitance |
|--------|-------------|
| Accumulation | $C = C_{ox}$ |
| Depletion | $C = \frac{C_{ox} \cdot C_{dep}}{C_{ox} + C_{dep}}$ |
| Inversion | $C = C_{min}$ (HF) |

## Limitations

Level A assumes:
- Long-channel behavior (no velocity saturation)
- No short-channel effects
- Ideal mobility (no field dependence)
- No DIBL or CLM

## When to Use

- Quick parameter exploration
- Understanding basic MOSFET physics
- Educational purposes
- Initial device sizing
