import{j as n}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as i}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function r(s){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...i(),...s.components};return n.jsxs(n.Fragment,{children:[n.jsx(e.h1,{id:"getting-started",children:"Getting Started"}),`
`,n.jsx(e.p,{children:"This guide will help you start using the MOSFET Junction Simulator."}),`
`,n.jsx(e.h2,{id:"interface-overview",children:"Interface Overview"}),`
`,n.jsx(e.p,{children:"The application has a three-panel layout:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{children:`┌──────────────────────────────────────────────────────┐
│                     Toolbar                          │
├──────────┬─────────────────────────┬────────────────┤
│          │                         │                │
│  Left    │        Main View        │    Right       │
│ Sidebar  │    (3D + 2D Views)      │   Sidebar      │
│          │                         │                │
│(Params)  │                         │   (Plots)      │
│          │                         │                │
├──────────┴─────────────────────────┴────────────────┤
│                    Status Bar                        │
└──────────────────────────────────────────────────────┘
`})}),`
`,n.jsx(e.h2,{id:"toolbar-controls",children:"Toolbar Controls"}),`
`,n.jsxs(e.p,{children:[`| Control | Description |
|---------|-------------|
| `,n.jsx(e.strong,{children:"Device"}),` | Switch between nMOS and pMOS |
| `,n.jsx(e.strong,{children:"Level"}),` | Select physics model (A/B/C) |
| `,n.jsx(e.strong,{children:"Mode"}),` | Device or Process mode |
| `,n.jsx(e.strong,{children:"Tech"}),` | Technology node preset |
| `,n.jsx(e.strong,{children:"T"}),` | Operating temperature |
| `,n.jsx(e.strong,{children:"View"}),` | Colormap mode |
| `,n.jsx(e.strong,{children:"Auto"}),` | Auto-simulate on parameter change |
| `,n.jsx(e.strong,{children:"Reset"}),` | Reset to default parameters |
| `,n.jsx(e.strong,{children:"Theme"})," | Dark/Light mode toggle |"]}),`
`,n.jsx(e.h2,{id:"quick-start",children:"Quick Start"}),`
`,n.jsx(e.h3,{id:"step-1-select-device-type",children:"Step 1: Select Device Type"}),`
`,n.jsxs(e.p,{children:["Click ",n.jsx(e.strong,{children:"nMOS"})," or ",n.jsx(e.strong,{children:"pMOS"})," in the toolbar. This changes:"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsx(e.li,{children:"Substrate type (p-type for nMOS, n-type for pMOS)"}),`
`,n.jsx(e.li,{children:"Source/Drain type (n+ for nMOS, p+ for pMOS)"}),`
`,n.jsx(e.li,{children:"Bias polarities"}),`
`]}),`
`,n.jsx(e.h3,{id:"step-2-choose-physics-level",children:"Step 2: Choose Physics Level"}),`
`,n.jsxs(e.p,{children:[`| Level | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| `,n.jsx(e.strong,{children:"A"}),` | Fast | Basic | Learning, quick analysis |
| `,n.jsx(e.strong,{children:"B"}),` | Fast | Good | Device design |
| `,n.jsx(e.strong,{children:"C"})," | Slow | High | Accurate simulation |"]}),`
`,n.jsx(e.h3,{id:"step-3-set-device-parameters",children:"Step 3: Set Device Parameters"}),`
`,n.jsx(e.p,{children:"Use the left sidebar to adjust:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Gate Stack"}),": Oxide thickness, channel length"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Channel"}),": Doping concentration"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Source/Drain"}),": Doping, junction depth"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Substrate"}),": Background doping"]}),`
`]}),`
`,n.jsx(e.h3,{id:"step-4-apply-bias",children:"Step 4: Apply Bias"}),`
`,n.jsxs(e.p,{children:["Use the ",n.jsx(e.strong,{children:"Bias Controls"})," section:"]}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Vgs"}),": Gate-to-source voltage"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Vds"}),": Drain-to-source voltage"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Vbs"}),": Body-to-source voltage"]}),`
`]}),`
`,n.jsx(e.h3,{id:"step-5-view-results",children:"Step 5: View Results"}),`
`,n.jsx(e.p,{children:"The right sidebar shows:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Device Metrics"}),": Vth, SS, Ion/Ioff"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"I-V Plots"}),": Output and transfer characteristics"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"C-V Plot"}),": Capacitance vs gate voltage"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Band Diagram"}),": Energy band structure"]}),`
`]}),`
`,n.jsx(e.h2,{id:"using-technology-presets",children:"Using Technology Presets"}),`
`,n.jsx(e.p,{children:"The Tech dropdown provides pre-configured parameters:"}),`
`,n.jsx(e.p,{children:`| Node | Gate Length | Vdd | tox |
|------|-------------|-----|-----|
| 180nm | 180 nm | 1.8V | 4 nm |
| 90nm | 90 nm | 1.2V | 2.5 nm |
| 45nm | 45 nm | 1.0V | 1.4 nm |
| 28nm | 28 nm | 0.9V | 1.2 nm |`}),`
`,n.jsx(e.h2,{id:"viewing-results",children:"Viewing Results"}),`
`,n.jsx(e.h3,{id:"3d-view",children:"3D View"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Rotate"}),": Left-click drag"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Zoom"}),": Mouse wheel"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Pan"}),": Right-click drag"]}),`
`]}),`
`,n.jsx(e.h3,{id:"plots",children:"Plots"}),`
`,n.jsx(e.p,{children:"Each plot can be expanded/collapsed by clicking its header."})]})}function o(s={}){const{wrapper:e}={...i(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(r,{...s})}):r(s)}export{o as default};
