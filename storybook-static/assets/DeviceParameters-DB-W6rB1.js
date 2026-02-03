import{j as n}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as r}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function i(s){const e={h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",strong:"strong",ul:"ul",...r(),...s.components};return n.jsxs(n.Fragment,{children:[n.jsx(e.h1,{id:"device-parameters",children:"Device Parameters"}),`
`,n.jsx(e.p,{children:"This guide explains all the device parameters available in the simulator."}),`
`,n.jsx(e.h2,{id:"gate-stack",children:"Gate Stack"}),`
`,n.jsx(e.h3,{id:"oxide-thickness-tox",children:"Oxide Thickness (tox)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 0.5 - 10 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 2 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Lower tox increases Cox, improves gate control, but may increase gate leakage"]}),`
`]}),`
`,n.jsx(e.h3,{id:"channel-length-leff",children:"Channel Length (Leff)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 20 - 500 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 45 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Shorter channels enable faster switching but suffer from short-channel effects"]}),`
`]}),`
`,n.jsx(e.h3,{id:"work-function",children:"Work Function"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 4.0 - 5.5 eV"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Adjusts flat-band voltage and threshold"]}),`
`]}),`
`,n.jsx(e.h2,{id:"channel",children:"Channel"}),`
`,n.jsx(e.h3,{id:"channel-doping-nch",children:"Channel Doping (Nch)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 10¹⁵ - 10¹⁹ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 10¹⁷ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Higher doping increases Vth and reduces DIBL, but degrades mobility"]}),`
`]}),`
`,n.jsx(e.h2,{id:"sourcedrain",children:"Source/Drain"}),`
`,n.jsx(e.h3,{id:"sd-doping-nsd",children:"S/D Doping (NSD)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 10¹⁸ - 10²¹ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 10²⁰ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Higher doping reduces contact resistance but increases junction capacitance"]}),`
`]}),`
`,n.jsx(e.h3,{id:"junction-depth-xj",children:"Junction Depth (xj)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 10 - 200 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 30 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Shallower junctions reduce short-channel effects"]}),`
`]}),`
`,n.jsx(e.h3,{id:"ldd-doping-nldd",children:"LDD Doping (NLDD)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 10¹⁷ - 10²⁰ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Reduces hot-carrier effects and gate-drain overlap capacitance"]}),`
`]}),`
`,n.jsx(e.h3,{id:"ldd-length-lldd",children:"LDD Length (LLDD)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 5 - 50 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Longer LDD reduces electric field at drain but increases Ron"]}),`
`]}),`
`,n.jsx(e.h2,{id:"substrate",children:"Substrate"}),`
`,n.jsx(e.h3,{id:"substrate-doping-nsub",children:"Substrate Doping (Nsub)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 10¹⁴ - 10¹⁸ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Default"}),": 10¹⁷ cm⁻³"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Sets body effect coefficient and depletion width"]}),`
`]}),`
`,n.jsx(e.h2,{id:"geometry",children:"Geometry"}),`
`,n.jsx(e.h3,{id:"channel-width-w",children:"Channel Width (W)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 100 - 10000 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Wider channel increases current proportionally"]}),`
`]}),`
`,n.jsx(e.h3,{id:"gate-sd-overlap",children:"Gate-S/D Overlap"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 0 - 20 nm"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Affects overlap capacitance and Miller effect"]}),`
`]}),`
`,n.jsx(e.h2,{id:"advanced-parameters",children:"Advanced Parameters"}),`
`,n.jsx(e.h3,{id:"fixed-oxide-charge-qf",children:"Fixed Oxide Charge (Qf)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": ±10¹² cm⁻²"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Shifts flat-band and threshold voltages"]}),`
`]}),`
`,n.jsx(e.h3,{id:"interface-trap-density-dit",children:"Interface Trap Density (Dit)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 0 - 10¹³ cm⁻² eV⁻¹"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Increases subthreshold swing, causes frequency dispersion"]}),`
`]}),`
`,n.jsx(e.h3,{id:"series-resistance-rs-rd",children:"Series Resistance (Rs, Rd)"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Range"}),": 0 - 1000 Ω"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Effect"}),": Reduces effective Vds, limits Ion"]}),`
`]})]})}function h(s={}){const{wrapper:e}={...r(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(i,{...s})}):i(s)}export{h as default};
