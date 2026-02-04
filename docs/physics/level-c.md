# Level C - Numerical Model

Level C provides **self-consistent numerical solution** of semiconductor device equations using 2D mesh-based simulation. This is the most accurate model but computationally intensive, suitable for research and validation purposes.

## Fundamental Equations

The simulator solves the **semiconductor device equations** self-consistently:

### 1. Poisson Equation

Relates electrostatic potential to charge density:

$$
\nabla^2 \psi = -\frac{\rho}{\varepsilon} = -\frac{q(p - n + N_D^+ - N_A^-)}{\varepsilon_{Si}}
$$

Where:
- $\psi$: Electrostatic potential (V)
- $n$, $p$: Electron and hole concentrations (cm⁻³)
- $N_D^+$, $N_A^-$: Ionized donor and acceptor concentrations
- $\varepsilon_{Si}$: Silicon permittivity

### 2. Continuity Equations

Conservation of carriers with generation/recombination:

**Electrons:**
$$
\frac{\partial n}{\partial t} = \frac{1}{q} \nabla \cdot \mathbf{J}_n + G - R
$$

**Holes:**
$$
\frac{\partial p}{\partial t} = -\frac{1}{q} \nabla \cdot \mathbf{J}_p + G - R
$$

For steady-state (DC) analysis: $\partial n/\partial t = \partial p/\partial t = 0$

### 3. Current Density (Drift-Diffusion)

$$
\mathbf{J}_n = q\mu_n n \mathbf{E} + qD_n \nabla n
$$

$$
\mathbf{J}_p = q\mu_p p \mathbf{E} - qD_p \nabla p
$$

Using Einstein relation: $D = \mu \cdot kT/q = \mu \cdot V_T$

::: tip Physical Interpretation
- **Drift**: Carriers move under electric field ($q\mu n E$)
- **Diffusion**: Carriers move from high to low concentration ($qD \nabla n$)
:::

## Mesh Generation

### Non-Uniform 2D Mesh

The simulator uses a non-uniform rectangular mesh with refinement in critical regions:

<MeshDiagram />

### Mesh Refinement Strategy

| Region | Typical Spacing | Reason |
|--------|-----------------|--------|
| Si/SiO₂ interface | 0.2-0.5 nm | Rapid potential variation |
| Junction edges | 1-2 nm | High field, carrier gradients |
| Channel center | 2-5 nm | Moderate variation |
| Bulk substrate | 5-20 nm | Slow variation |

### Mesh Quality Requirements

For accurate results:
- **Debye length criterion**: $\Delta x < \lambda_D = \sqrt{\varepsilon kT / q^2 N}$
- **Gradient criterion**: Adjacent cells should have < 2× potential difference
- **Aspect ratio**: Keep cell aspect ratio < 10:1

## Numerical Methods

### Scharfetter-Gummel Discretization

Standard finite-difference fails for drift-diffusion due to exponential carrier profiles. The **Scharfetter-Gummel** scheme uses exponential fitting:

$$
J_{n,i \to i+1} = \frac{qD_n}{\Delta x} \left[ n_{i+1} \cdot B\left(-\frac{\Delta\psi}{V_T}\right) - n_i \cdot B\left(\frac{\Delta\psi}{V_T}\right) \right]
$$

Where $B(x) = \frac{x}{e^x - 1}$ is the **Bernoulli function**.

::: details Why Scharfetter-Gummel?
Consider an exponential carrier profile $n(x) = n_0 e^{x/L_D}$.

Standard FD: $dn/dx \approx (n_{i+1} - n_i)/\Delta x$ → large error

SG scheme: Uses exact solution of drift-diffusion between mesh points → accurate for any $\Delta x$
:::

### Bernoulli Function Properties

$$
B(x) = \frac{x}{e^x - 1} = \begin{cases}
1 - x/2 + x^2/12 - ... & |x| < 1 \\
x \cdot e^{-x} & x \gg 1 \\
-x & x \ll -1
\end{cases}
$$

The function is computed carefully to avoid numerical overflow.

### Gummel Iteration

Self-consistent solution uses decoupled iteration:

```
1. Initial guess: ψ from Poisson with n,p from Boltzmann
2. LOOP until converged:
   a. Solve Poisson equation → update ψ
   b. Solve electron continuity → update n
   c. Solve hole continuity → update p
   d. Check: |Δψ|_max < tolerance?
3. Calculate currents from converged solution
```

::: warning Convergence Issues
Gummel iteration may fail to converge for:
- High forward bias (strong injection)
- Very fine mesh (stiff system)
- Poor initial guess

Solutions: Use Newton-Raphson for difficult cases, continuation methods.
:::

### Linear Solver: BiCGSTAB

Each Poisson/continuity solve requires solving a sparse linear system $Ax = b$.

The **BiCGSTAB** (Biconjugate Gradient Stabilized) algorithm is used:
- Handles non-symmetric matrices
- Good convergence for device equations
- Memory efficient (no matrix factorization)

Typical settings:
- Tolerance: $10^{-8}$
- Max iterations: 1000
- Preconditioner: Jacobi (diagonal)

## Boundary Conditions

### Contact Boundary Conditions

| Boundary | Type | Condition |
|----------|------|-----------|
| Gate | Dirichlet | $\psi = V_G - \phi_{ms}$ |
| Source/Drain (Ohmic) | Dirichlet | $\psi = V + V_{bi}$, $n = N_D$, $p = n_i^2/N_D$ |
| Substrate | Dirichlet | $\psi = V_B + \phi_F$, $p = N_A$ |

### Interface Conditions

**Oxide-Silicon interface:**
$$
\varepsilon_{ox} E_{ox} = \varepsilon_{Si} E_{Si} + Q_f
$$

**Open boundaries (Neumann):**
$$
\frac{\partial \psi}{\partial n} = 0
$$

## Convergence Behavior

### Typical Convergence

| Iteration | $|\Delta\psi|_{max}$ | Status |
|-----------|---------------------|--------|
| 1 | 0.5 V | Initial |
| 5 | 0.05 V | Converging |
| 10 | 0.001 V | Near solution |
| 15 | 1e-6 V | Converged |

### Convergence Tips

1. **Good initial guess**: Start from equilibrium, increment bias slowly
2. **Under-relaxation**: $\psi^{new} = \psi^{old} + \omega \cdot \Delta\psi$ with $\omega = 0.1-0.5$
3. **Voltage stepping**: For large bias, use intermediate steps
4. **Mesh refinement**: Coarse mesh first, then refine

## Computational Cost

### Single Bias Point

| Mesh Size | Unknowns | Iterations | Time |
|-----------|----------|------------|------|
| 50×50 | 7,500 | ~15 | ~0.5 s |
| 100×100 | 30,000 | ~20 | ~2 s |
| 200×200 | 120,000 | ~25 | ~8 s |

### I-V Sweep (25 points)

| Mesh Size | Total Time | Per Point |
|-----------|------------|-----------|
| 50×50 | ~10 s | 0.4 s |
| 100×100 | ~45 s | 1.8 s |
| 200×200 | ~4 min | 10 s |

::: info GPU Acceleration
WebGPU acceleration can provide 10-50× speedup for larger meshes. Currently experimental - see [GPU Acceleration Review](/GPU_ACCELERATION_REVIEW).
:::

## Output Quantities

Level C provides detailed 2D field distributions:

| Quantity | Symbol | Unit |
|----------|--------|------|
| Electrostatic potential | $\psi(x,z)$ | V |
| Electric field | $E_x$, $E_z$ | V/cm |
| Electron concentration | $n(x,z)$ | cm⁻³ |
| Hole concentration | $p(x,z)$ | cm⁻³ |
| Current density | $J_n$, $J_p$ | A/cm² |
| Recombination rate | $R(x,z)$ | cm⁻³/s |

### Derived Metrics

- **Terminal currents**: Integrated from current density at contacts
- **Inversion charge**: $Q_{inv} = q \int n(x,z) dx dz$
- **Depletion width**: From potential profile analysis
- **Threshold voltage**: Extrapolated from Id-Vgs

## Physical Models Included

### Carrier Statistics

**Boltzmann (default):**
$$
n = n_i \exp\left(\frac{\psi - \phi_n}{V_T}\right)
$$

**Fermi-Dirac (optional):**
$$
n = N_C \cdot F_{1/2}\left(\frac{E_F - E_C}{kT}\right)
$$

### Recombination Models

**Shockley-Read-Hall:**
$$
R_{SRH} = \frac{np - n_i^2}{\tau_p(n + n_1) + \tau_n(p + p_1)}
$$

**Auger (high injection):**
$$
R_{Auger} = (C_n n + C_p p)(np - n_i^2)
$$

### Mobility Models

**Doping-dependent:**
$$
\mu(N) = \mu_{min} + \frac{\mu_{max} - \mu_{min}}{1 + (N/N_{ref})^\alpha}
$$

**Field-dependent:**
$$
\mu(E) = \frac{\mu_0}{\left[1 + (\mu_0 E / v_{sat})^\beta\right]^{1/\beta}}
$$

## When to Use Level C

✅ **Good for:**
- Accurate device characterization
- Novel device structure analysis
- 2D field visualization
- Validating compact models
- Research applications
- Understanding internal physics

❌ **Not suitable for:**
- Quick parameter exploration (too slow)
- Circuit-level simulation
- Large design space sweeps
- Real-time interaction

## Comparison: All Levels

| Feature | Level A | Level B | Level C |
|---------|---------|---------|---------|
| Physics | Analytical | Semi-empirical | Numerical |
| Accuracy | Low | Medium | High |
| Speed | ~1 ms | ~2 ms | ~1-10 s |
| 2D fields | ❌ | ❌ | ✅ |
| SCE | ❌ | ✅ | ✅ (intrinsic) |
| Custom structures | ❌ | ❌ | ✅ |

## Implementation Details

### Code Structure

```
src/physics/levelC/
├── mesh.ts          # Mesh generation
├── poisson.ts       # Poisson solver
├── continuity.ts    # Continuity equations
├── gummel.ts        # Gummel iteration
├── bicgstab.ts      # Linear solver
├── materials.ts     # Material properties
└── worker.ts        # Web Worker interface
```

### Web Worker

Level C runs in a Web Worker to avoid blocking the UI:
- Main thread sends device parameters
- Worker performs simulation
- Results returned via postMessage
- Progress updates for long simulations
