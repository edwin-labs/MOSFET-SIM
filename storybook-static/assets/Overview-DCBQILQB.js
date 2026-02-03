import{j as e}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as t}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function i(r){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...t(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"physics-overview",children:"Physics Overview"}),`
`,e.jsx(n.h2,{id:"mosfet-operating-principles",children:"MOSFET Operating Principles"}),`
`,e.jsxs(n.p,{children:["The MOSFET controls current flow through a ",e.jsx(n.strong,{children:"channel"})," region between source and drain. The channel conductivity is modulated by the electric field from the gate electrode, separated from the channel by a thin gate oxide."]}),`
`,e.jsx(n.h2,{id:"key-concepts",children:"Key Concepts"}),`
`,e.jsx(n.h3,{id:"threshold-voltage-vth",children:"Threshold Voltage (Vth)"}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.strong,{children:"threshold voltage"})," is the gate voltage required to create a conductive channel. It depends on:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Flat-band voltage"}),": V_FB = φ_ms - Q_f/C_ox"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Surface potential"}),": 2φ_F (for inversion)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Body effect"}),": γ√(2φ_F + V_SB)"]}),`
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`V_th = V_FB + 2φ_F + γ√(2φ_F + V_SB)
`})}),`
`,e.jsx(n.h3,{id:"operating-regions",children:"Operating Regions"}),`
`,e.jsxs(n.p,{children:[`| Region | Condition | Current |
|--------|-----------|---------|
| `,e.jsx(n.strong,{children:"Cutoff"}),` | V_GS < V_th | ≈ 0 (subthreshold) |
| `,e.jsx(n.strong,{children:"Linear"}),` | V_GS > V_th, V_DS < V_GS - V_th | Ohmic |
| `,e.jsx(n.strong,{children:"Saturation"})," | V_GS > V_th, V_DS ≥ V_GS - V_th | Pinch-off |"]}),`
`,e.jsx(n.h3,{id:"subthreshold-conduction",children:"Subthreshold Conduction"}),`
`,e.jsxs(n.p,{children:["Below threshold, the current doesn't go to zero immediately. The ",e.jsx(n.strong,{children:"subthreshold swing (SS)"})," characterizes how sharply the transistor turns off:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`SS = (dV_GS)/(d log₁₀ I_D) ≈ 2.3 × (kT/q) × n
`})}),`
`,e.jsxs(n.p,{children:["The ideal SS at room temperature is ",e.jsx(n.strong,{children:"60 mV/decade"}),"."]}),`
`,e.jsx(n.h2,{id:"material-parameters",children:"Material Parameters"}),`
`,e.jsx(n.h3,{id:"silicon-properties",children:"Silicon Properties"}),`
`,e.jsx(n.p,{children:`| Property | Symbol | Value (300K) |
|----------|--------|--------------|
| Band gap | E_g | 1.12 eV |
| Dielectric constant | ε_Si | 11.7 |
| Intrinsic carrier concentration | n_i | 1.07×10¹⁰ cm⁻³ |
| Electron mobility | μ_n | ~1400 cm²/V·s |
| Hole mobility | μ_p | ~450 cm²/V·s |`}),`
`,e.jsx(n.h3,{id:"gate-oxide-materials",children:"Gate Oxide Materials"}),`
`,e.jsx(n.p,{children:`| Material | Dielectric Constant | Band Gap |
|----------|---------------------|----------|
| SiO₂ | 3.9 | 9.0 eV |
| HfO₂ | 25 | 5.8 eV |`}),`
`,e.jsx(n.h2,{id:"capacitance-voltage-characteristics",children:"Capacitance-Voltage Characteristics"}),`
`,e.jsx(n.p,{children:"The MOS capacitor exhibits three regions in C-V:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Accumulation"}),": C = C_ox (majority carriers at surface)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Depletion"}),": C < C_ox (surface depleted)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Inversion"}),": C = C_ox × C_dep / (C_ox + C_dep) (high frequency)"]}),`
`]})]})}function h(r={}){const{wrapper:n}={...t(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(i,{...r})}):i(r)}export{h as default};
