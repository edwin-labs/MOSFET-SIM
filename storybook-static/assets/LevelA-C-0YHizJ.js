import{j as n}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as l}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function s(i){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...l(),...i.components};return n.jsxs(n.Fragment,{children:[n.jsx(e.h1,{id:"level-a---analytical-model",children:"Level A - Analytical Model"}),`
`,n.jsxs(e.p,{children:["Level A implements the ",n.jsx(e.strong,{children:"classical Shockley MOSFET equations"})," with smooth subthreshold transition. It provides fast, analytical solutions ideal for understanding basic MOSFET behavior."]}),`
`,n.jsx(e.h2,{id:"drain-current-model",children:"Drain Current Model"}),`
`,n.jsx(e.h3,{id:"above-threshold-v_gs--v_th",children:"Above Threshold (V_GS > V_th)"}),`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Linear Region"})," (V_DS < V_GS - V_th):"]}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`I_D = μ × C_ox × (W/L) × [(V_GS - V_th) × V_DS - V_DS²/2]
`})}),`
`,n.jsxs(e.p,{children:[n.jsx(e.strong,{children:"Saturation Region"})," (V_DS ≥ V_GS - V_th):"]}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`I_D = (μ × C_ox / 2) × (W/L) × (V_GS - V_th)²
`})}),`
`,n.jsx(e.h3,{id:"subthreshold-region-v_gs--v_th",children:"Subthreshold Region (V_GS < V_th)"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`I_sub = I_0 × exp(V_GS / (n × V_T)) × [1 - exp(-V_DS / V_T)]
`})}),`
`,n.jsx(e.p,{children:"Where:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"n"}),": Subthreshold swing factor (~1.5)"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"V_T"}),": Thermal voltage (kT/q ≈ 26 mV at 300K)"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"I_0"}),": Pre-exponential current factor"]}),`
`]}),`
`,n.jsx(e.h2,{id:"threshold-voltage",children:"Threshold Voltage"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`V_th = V_FB + 2φ_F + γ√(2φ_F + V_SB)
`})}),`
`,n.jsx(e.p,{children:"Where:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"V_FB"}),": Flat-band voltage = φ_ms - Q_f/C_ox"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"φ_F"}),": Fermi potential = (kT/q) × ln(N_A/n_i)"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"γ"}),": Body effect coefficient = √(2qε_Si × N_A) / C_ox"]}),`
`]}),`
`,n.jsx(e.h2,{id:"capacitance-model",children:"Capacitance Model"}),`
`,n.jsx(e.p,{children:"The high-frequency MOS capacitance model:"}),`
`,n.jsx(e.p,{children:`| Region | Capacitance |
|--------|-------------|
| Accumulation | C = C_ox |
| Depletion | C = C_ox × C_dep / (C_ox + C_dep) |
| Inversion | C = C_min (HF) |`}),`
`,n.jsx(e.h2,{id:"limitations",children:"Limitations"}),`
`,n.jsx(e.p,{children:"Level A assumes:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Long-channel behavior (no velocity saturation)"}),`
`,n.jsx(e.li,{children:"No short-channel effects"}),`
`,n.jsx(e.li,{children:"Ideal mobility (no field dependence)"}),`
`,n.jsx(e.li,{children:"No DIBL or CLM"}),`
`]}),`
`,n.jsx(e.h2,{id:"when-to-use",children:"When to Use"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Quick parameter exploration"}),`
`,n.jsx(e.li,{children:"Understanding basic MOSFET physics"}),`
`,n.jsx(e.li,{children:"Educational purposes"}),`
`,n.jsx(e.li,{children:"Initial device sizing"}),`
`]})]})}function t(i={}){const{wrapper:e}={...l(),...i.components};return e?n.jsx(e,{...i,children:n.jsx(s,{...i})}):s(i)}export{t as default};
