import{j as e}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as s}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function r(i){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...s(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"level-b---semi-empirical-model",children:"Level B - Semi-empirical Model"}),`
`,e.jsxs(n.p,{children:["Level B extends the analytical model with ",e.jsx(n.strong,{children:"short-channel effects"})," and ",e.jsx(n.strong,{children:"semi-empirical corrections"}),". It provides more realistic results for modern scaled transistors."]}),`
`,e.jsx(n.h2,{id:"additional-physics-effects",children:"Additional Physics Effects"}),`
`,e.jsx(n.h3,{id:"1-velocity-saturation",children:"1. Velocity Saturation"}),`
`,e.jsx(n.p,{children:"At high lateral electric fields, carrier velocity saturates at v_sat:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`μ_eff = μ_0 / (1 + μ_0 × E / v_sat)
`})}),`
`,e.jsx(n.p,{children:"This modifies the saturation voltage:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`V_dsat = (V_ov × E_sat × L) / (E_sat × L + V_ov)
`})}),`
`,e.jsx(n.p,{children:"Where E_sat = 2 × v_sat / μ is the saturation field."}),`
`,e.jsx(n.h3,{id:"2-dibl-drain-induced-barrier-lowering",children:"2. DIBL (Drain-Induced Barrier Lowering)"}),`
`,e.jsx(n.p,{children:"The drain voltage reduces the source-channel barrier, lowering threshold:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`ΔV_th = -η × V_DS
`})}),`
`,e.jsx(n.p,{children:"Where η is the DIBL coefficient (typically 20-200 mV/V for short channels)."}),`
`,e.jsx(n.h3,{id:"3-channel-length-modulation-clm",children:"3. Channel Length Modulation (CLM)"}),`
`,e.jsx(n.p,{children:"In saturation, the channel pinch-off point moves toward the source as V_DS increases:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`I_D = I_D,sat × (1 + λ × V_DS)
`})}),`
`,e.jsx(n.p,{children:"Where λ ∝ 1/L is the CLM parameter."}),`
`,e.jsx(n.h3,{id:"4-body-effect",children:"4. Body Effect"}),`
`,e.jsx(n.p,{children:"Back-bias affects threshold voltage:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`V_th(V_SB) = V_th0 + γ × (√(2φ_F + V_SB) - √(2φ_F))
`})}),`
`,e.jsx(n.h3,{id:"5-mobility-degradation",children:"5. Mobility Degradation"}),`
`,e.jsx(n.p,{children:"Vertical field from gate oxide degrades mobility:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`μ_eff = μ_0 / (1 + θ × (V_GS - V_th))
`})}),`
`,e.jsx(n.p,{children:"Where θ is the mobility degradation coefficient (~0.1 V⁻¹)."}),`
`,e.jsx(n.h3,{id:"6-non-ideal-subthreshold-swing",children:"6. Non-ideal Subthreshold Swing"}),`
`,e.jsx(n.p,{children:"Interface traps and depletion capacitance increase SS:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`SS = (kT/q) × ln(10) × (1 + C_dep/C_ox + C_it/C_ox)
`})}),`
`,e.jsx(n.h2,{id:"short-channel-v_th-roll-off",children:"Short-Channel V_th Roll-off"}),`
`,e.jsx(n.p,{children:"Charge sharing between source/drain reduces effective channel charge:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`ΔV_th,sc ≈ -(x_j + x_d)/(2L) × 2φ_F
`})}),`
`,e.jsx(n.h2,{id:"additional-metrics",children:"Additional Metrics"}),`
`,e.jsx(n.p,{children:"Level B extracts additional metrics:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"DIBL"}),": Measured as (V_th@low_Vds - V_th@high_Vds) / ΔV_DS"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"gm_max"}),": Peak transconductance"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"V_dsat"}),": Saturation voltage with velocity saturation"]}),`
`]}),`
`,e.jsx(n.h2,{id:"when-to-use",children:"When to Use"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Device design and optimization"}),`
`,e.jsx(n.li,{children:"Short-channel device analysis"}),`
`,e.jsx(n.li,{children:"Process technology comparisons"}),`
`,e.jsx(n.li,{children:"Understanding SCE impact"}),`
`]})]})}function c(i={}){const{wrapper:n}={...s(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(r,{...i})}):r(i)}export{c as default};
