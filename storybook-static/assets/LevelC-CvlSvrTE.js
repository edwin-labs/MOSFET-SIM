import{j as n}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as s}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function r(i){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...s(),...i.components};return n.jsxs(n.Fragment,{children:[n.jsx(e.h1,{id:"level-c---numerical-model",children:"Level C - Numerical Model"}),`
`,n.jsxs(e.p,{children:["Level C provides ",n.jsx(e.strong,{children:"self-consistent numerical solution"})," of semiconductor device equations using 2D mesh-based simulation. This is the most accurate model but computationally intensive."]}),`
`,n.jsx(e.h2,{id:"fundamental-equations",children:"Fundamental Equations"}),`
`,n.jsx(e.h3,{id:"1-poisson-equation",children:"1. Poisson Equation"}),`
`,n.jsx(e.p,{children:"Relates electrostatic potential to charge density:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`∇²ψ = -ρ/ε = -q(p - n + N_D⁺ - N_A⁻)/ε_Si
`})}),`
`,n.jsx(e.p,{children:"Where:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"ψ"}),": Electrostatic potential"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"n, p"}),": Electron and hole concentrations"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"N_D⁺, N_A⁻"}),": Ionized donor and acceptor concentrations"]}),`
`]}),`
`,n.jsx(e.h3,{id:"2-continuity-equations",children:"2. Continuity Equations"}),`
`,n.jsx(e.p,{children:"Conservation of carriers with generation/recombination:"}),`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Electrons"}),":"]}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`∂n/∂t = (1/q) × ∇·J_n + G - R
`})}),`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Holes"}),":"]}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`∂p/∂t = -(1/q) × ∇·J_p + G - R
`})}),`
`,n.jsx(e.h3,{id:"3-drift-diffusion-current",children:"3. Drift-Diffusion Current"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`J_n = qμ_n × n × E + qD_n × ∇n
J_p = qμ_p × p × E - qD_p × ∇p
`})}),`
`,n.jsx(e.p,{children:"Using Einstein relation: D = μ × kT/q"}),`
`,n.jsx(e.h2,{id:"numerical-methods",children:"Numerical Methods"}),`
`,n.jsx(e.h3,{id:"mesh-generation",children:"Mesh Generation"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Non-uniform 2D rectangular mesh"}),`
`,n.jsx(e.li,{children:"Fine mesh near interfaces (~0.5 nm)"}),`
`,n.jsx(e.li,{children:"Coarser mesh in bulk regions"}),`
`]}),`
`,n.jsx(e.h3,{id:"scharfetter-gummel-discretization",children:"Scharfetter-Gummel Discretization"}),`
`,n.jsx(e.p,{children:"For stable discretization of current density:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`J_n = (qD_n/Δx) × [n_{i+1} × B(-Δψ/V_T) - n_i × B(Δψ/V_T)]
`})}),`
`,n.jsx(e.p,{children:"Where B(x) = x/(e^x - 1) is the Bernoulli function."}),`
`,n.jsx(e.h3,{id:"gummel-iteration",children:"Gummel Iteration"}),`
`,n.jsx(e.p,{children:"Self-consistent solution algorithm:"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Solve Poisson"}),": ψ from current n, p"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Solve n-continuity"}),": Update n from ψ"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Solve p-continuity"}),": Update p from ψ"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Check convergence"}),": |Δψ| < tolerance"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Repeat"})," if not converged"]}),`
`]}),`
`,n.jsx(e.h3,{id:"linear-solver",children:"Linear Solver"}),`
`,n.jsx(e.p,{children:"BiCGSTAB with Jacobi preconditioning for sparse matrix solution."}),`
`,n.jsx(e.h2,{id:"boundary-conditions",children:"Boundary Conditions"}),`
`,n.jsx(e.p,{children:`| Boundary | Condition |
|----------|-----------|
| Gate | Dirichlet: ψ = V_G - φ_ms |
| Ohmic contacts | Dirichlet: ψ = V + φ_F |
| Oxide-Si interface | Continuity: ε_ox × E_ox = ε_Si × E_Si |
| Open boundaries | Neumann: ∇ψ = 0 |`}),`
`,n.jsx(e.h2,{id:"convergence",children:"Convergence"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Typical convergence: 10-50 iterations"}),`
`,n.jsx(e.li,{children:"Under-relaxation: ω = 0.1-0.5"}),`
`,n.jsx(e.li,{children:"Tolerance: |Δψ| < 10⁻⁶ V"}),`
`]}),`
`,n.jsx(e.h2,{id:"computational-cost",children:"Computational Cost"}),`
`,n.jsx(e.p,{children:`| Mesh Size | Single Point | 25-Point Sweep |
|-----------|-------------|----------------|
| 50×50 | ~0.5 s | ~10 s |
| 100×100 | ~2 s | ~30-60 s |
| 200×200 | ~8 s | ~3-4 min |`}),`
`,n.jsx(e.h2,{id:"when-to-use",children:"When to Use"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Accurate device characterization"}),`
`,n.jsx(e.li,{children:"Novel device structure analysis"}),`
`,n.jsx(e.li,{children:"Validating compact models"}),`
`,n.jsx(e.li,{children:"Research applications"}),`
`]})]})}function l(i={}){const{wrapper:e}={...s(),...i.components};return e?n.jsx(e,{...i,children:n.jsx(r,{...i})}):r(i)}export{l as default};
