# Device Parameters

This guide explains all the device parameters available in the simulator.

## Gate Stack

### Oxide Thickness ($t_{ox}$)
- **Range**: 0.5 - 10 nm
- **Default**: 2 nm
- **Effect**: Lower $t_{ox}$ increases $C_{ox}$, improves gate control, but may increase gate leakage

### Channel Length ($L_{eff}$)
- **Range**: 20 - 500 nm
- **Default**: 45 nm
- **Effect**: Shorter channels enable faster switching but suffer from short-channel effects

### Work Function
- **Range**: 4.0 - 5.5 eV
- **Effect**: Adjusts flat-band voltage and threshold

## Channel

### Channel Doping ($N_{ch}$)
- **Range**: $10^{15}$ - $10^{19}$ cm⁻³
- **Default**: $10^{17}$ cm⁻³
- **Effect**: Higher doping increases $V_{th}$ and reduces DIBL, but degrades mobility

## Source/Drain

### S/D Doping ($N_{SD}$)
- **Range**: $10^{18}$ - $10^{21}$ cm⁻³
- **Default**: $10^{20}$ cm⁻³
- **Effect**: Higher doping reduces contact resistance but increases junction capacitance

### Junction Depth ($x_j$)
- **Range**: 10 - 200 nm
- **Default**: 30 nm
- **Effect**: Shallower junctions reduce short-channel effects

### LDD Doping ($N_{LDD}$)
- **Range**: $10^{17}$ - $10^{20}$ cm⁻³
- **Effect**: Reduces hot-carrier effects and gate-drain overlap capacitance

### LDD Length ($L_{LDD}$)
- **Range**: 5 - 50 nm
- **Effect**: Longer LDD reduces electric field at drain but increases $R_{on}$

## Substrate

### Substrate Doping ($N_{sub}$)
- **Range**: $10^{14}$ - $10^{18}$ cm⁻³
- **Default**: $10^{17}$ cm⁻³
- **Effect**: Sets body effect coefficient and depletion width

## Geometry

### Channel Width ($W$)
- **Range**: 100 - 10000 nm
- **Effect**: Wider channel increases current proportionally

### Gate-S/D Overlap
- **Range**: 0 - 20 nm
- **Effect**: Affects overlap capacitance and Miller effect

## Advanced Parameters

### Fixed Oxide Charge ($Q_f$)
- **Range**: $\pm 10^{12}$ cm⁻²
- **Effect**: Shifts flat-band and threshold voltages

### Interface Trap Density ($D_{it}$)
- **Range**: 0 - $10^{13}$ cm⁻² eV⁻¹
- **Effect**: Increases subthreshold swing, causes frequency dispersion

### Series Resistance ($R_s$, $R_d$)
- **Range**: 0 - 1000 Ω
- **Effect**: Reduces effective $V_{ds}$, limits $I_{on}$
