import{j as e}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as s}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function t(r){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...s(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"physics-overview",children:"Physics Overview"}),`
`,e.jsx(n.h2,{id:"mosfet-operating-principles",children:"MOSFET Operating Principles"}),`
`,e.jsxs(n.p,{children:["The MOSFET controls current flow through a ",e.jsx(n.strong,{children:"channel"})," region between source and drain. The channel conductivity is modulated by the electric field from the gate electrode, separated from the channel by a thin gate oxide."]}),`
`,e.jsx(n.h2,{id:"key-concepts",children:"Key Concepts"}),`
`,e.jsx(n.h3,{id:"threshold-voltage-v_th",children:"Threshold Voltage (V_th)"}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.strong,{children:"threshold voltage"})," is the gate voltage required to create a conductive channel. It depends on:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Flat-band voltage"}),": V_FB = φ_ms - Q_f/C_ox"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Surface potential"}),": 2φ_F (for inversion)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Body effect"}),": γ√(2φ_F + V_SB)"]}),`
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`V_th = V_FB + 2φ_F + γ√(2φ_F + V_SB)
`})}),`
`,e.jsx(n.h3,{id:"operating-regions",children:"Operating Regions"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Region"}),e.jsx(n.th,{children:"Condition"}),e.jsx(n.th,{children:"Current"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Cutoff"})}),e.jsx(n.td,{children:"V_GS < V_th"}),e.jsx(n.td,{children:"≈ 0 (subthreshold)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Linear"})}),e.jsx(n.td,{children:"V_GS > V_th, V_DS < V_GS - V_th"}),e.jsx(n.td,{children:"Ohmic"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Saturation"})}),e.jsx(n.td,{children:"V_GS > V_th, V_DS ≥ V_GS - V_th"}),e.jsx(n.td,{children:"Pinch-off"})]})]})]}),`
`,e.jsx(n.h3,{id:"subthreshold-conduction",children:"Subthreshold Conduction"}),`
`,e.jsxs(n.p,{children:["Below threshold, the current doesn't go to zero immediately. The ",e.jsx(n.strong,{children:"subthreshold swing (SS)"})," characterizes how sharply the transistor turns off:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`SS = (dV_GS)/(d log₁₀ I_D) ≈ 2.3 × (kT/q) × n
`})}),`
`,e.jsxs(n.p,{children:["The ideal SS at room temperature is ",e.jsx(n.strong,{children:"60 mV/decade"}),"."]}),`
`,e.jsx(n.h2,{id:"material-parameters",children:"Material Parameters"}),`
`,e.jsx(n.h3,{id:"silicon-properties",children:"Silicon Properties"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Property"}),e.jsx(n.th,{children:"Symbol"}),e.jsx(n.th,{children:"Value (300K)"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Band gap"}),e.jsx(n.td,{children:"E_g"}),e.jsx(n.td,{children:"1.12 eV"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Dielectric constant"}),e.jsx(n.td,{children:"ε_Si"}),e.jsx(n.td,{children:"11.7"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Intrinsic carrier concentration"}),e.jsx(n.td,{children:"n_i"}),e.jsx(n.td,{children:"1.07×10¹⁰ cm⁻³"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Electron mobility"}),e.jsx(n.td,{children:"μ_n"}),e.jsx(n.td,{children:"~1400 cm²/V·s"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"Hole mobility"}),e.jsx(n.td,{children:"μ_p"}),e.jsx(n.td,{children:"~450 cm²/V·s"})]})]})]}),`
`,e.jsx(n.h3,{id:"gate-oxide-materials",children:"Gate Oxide Materials"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Material"}),e.jsx(n.th,{children:"Dielectric Constant"}),e.jsx(n.th,{children:"Band Gap"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"SiO₂"}),e.jsx(n.td,{children:"3.9"}),e.jsx(n.td,{children:"9.0 eV"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"HfO₂"}),e.jsx(n.td,{children:"25"}),e.jsx(n.td,{children:"5.8 eV"})]})]})]}),`
`,e.jsx(n.h2,{id:"capacitance-voltage-characteristics",children:"Capacitance-Voltage Characteristics"}),`
`,e.jsx(n.p,{children:"The MOS capacitor exhibits three regions in C-V:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Accumulation"}),": C = C_ox (majority carriers at surface)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Depletion"}),": C < C_ox (surface depleted)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Inversion"}),": C = C_ox × C_dep / (C_ox + C_dep) (high frequency)"]}),`
`]})]})}function c(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(t,{...r})}):t(r)}export{c as default};
