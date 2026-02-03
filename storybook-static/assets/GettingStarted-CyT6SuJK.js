import{j as e}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as i}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function r(s){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...i(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"getting-started",children:"Getting Started"}),`
`,e.jsx(n.p,{children:"This guide will help you start using the MOSFET Junction Simulator."}),`
`,e.jsx(n.h2,{id:"interface-overview",children:"Interface Overview"}),`
`,e.jsx(n.p,{children:"The application has a three-panel layout:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`┌──────────────────────────────────────────────────────┐
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
`,e.jsx(n.h2,{id:"toolbar-controls",children:"Toolbar Controls"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Control"}),e.jsx(n.th,{children:"Description"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Device"})}),e.jsx(n.td,{children:"Switch between nMOS and pMOS"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Level"})}),e.jsx(n.td,{children:"Select physics model (A/B/C)"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Mode"})}),e.jsx(n.td,{children:"Device or Process mode"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Tech"})}),e.jsx(n.td,{children:"Technology node preset"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"T"})}),e.jsx(n.td,{children:"Operating temperature"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"View"})}),e.jsx(n.td,{children:"Colormap mode"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Auto"})}),e.jsx(n.td,{children:"Auto-simulate on parameter change"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Reset"})}),e.jsx(n.td,{children:"Reset to default parameters"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"Theme"})}),e.jsx(n.td,{children:"Dark/Light mode toggle"})]})]})]}),`
`,e.jsx(n.h2,{id:"quick-start",children:"Quick Start"}),`
`,e.jsx(n.h3,{id:"step-1-select-device-type",children:"Step 1: Select Device Type"}),`
`,e.jsxs(n.p,{children:["Click ",e.jsx(n.strong,{children:"nMOS"})," or ",e.jsx(n.strong,{children:"pMOS"})," in the toolbar. This changes:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Substrate type (p-type for nMOS, n-type for pMOS)"}),`
`,e.jsx(n.li,{children:"Source/Drain type (n+ for nMOS, p+ for pMOS)"}),`
`,e.jsx(n.li,{children:"Bias polarities"}),`
`]}),`
`,e.jsx(n.h3,{id:"step-2-choose-physics-level",children:"Step 2: Choose Physics Level"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Level"}),e.jsx(n.th,{children:"Speed"}),e.jsx(n.th,{children:"Accuracy"}),e.jsx(n.th,{children:"Best For"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"A"})}),e.jsx(n.td,{children:"Fast"}),e.jsx(n.td,{children:"Basic"}),e.jsx(n.td,{children:"Learning, quick analysis"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"B"})}),e.jsx(n.td,{children:"Fast"}),e.jsx(n.td,{children:"Good"}),e.jsx(n.td,{children:"Device design"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"C"})}),e.jsx(n.td,{children:"Slow"}),e.jsx(n.td,{children:"High"}),e.jsx(n.td,{children:"Accurate simulation"})]})]})]}),`
`,e.jsx(n.h3,{id:"step-3-set-device-parameters",children:"Step 3: Set Device Parameters"}),`
`,e.jsx(n.p,{children:"Use the left sidebar to adjust:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Gate Stack"}),": Oxide thickness, channel length"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Channel"}),": Doping concentration"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Source/Drain"}),": Doping, junction depth"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Substrate"}),": Background doping"]}),`
`]}),`
`,e.jsx(n.h3,{id:"step-4-apply-bias",children:"Step 4: Apply Bias"}),`
`,e.jsxs(n.p,{children:["Use the ",e.jsx(n.strong,{children:"Bias Controls"})," section:"]}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Vgs"}),": Gate-to-source voltage"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Vds"}),": Drain-to-source voltage"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Vbs"}),": Body-to-source voltage"]}),`
`]}),`
`,e.jsx(n.h3,{id:"step-5-view-results",children:"Step 5: View Results"}),`
`,e.jsx(n.p,{children:"The right sidebar shows:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Device Metrics"}),": Vth, SS, Ion/Ioff"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"I-V Plots"}),": Output and transfer characteristics"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"C-V Plot"}),": Capacitance vs gate voltage"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Band Diagram"}),": Energy band structure"]}),`
`]}),`
`,e.jsx(n.h2,{id:"using-technology-presets",children:"Using Technology Presets"}),`
`,e.jsx(n.p,{children:"The Tech dropdown provides pre-configured parameters:"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Node"}),e.jsx(n.th,{children:"Gate Length"}),e.jsx(n.th,{children:"Vdd"}),e.jsx(n.th,{children:"tox"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"180nm"}),e.jsx(n.td,{children:"180 nm"}),e.jsx(n.td,{children:"1.8V"}),e.jsx(n.td,{children:"4 nm"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"90nm"}),e.jsx(n.td,{children:"90 nm"}),e.jsx(n.td,{children:"1.2V"}),e.jsx(n.td,{children:"2.5 nm"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"45nm"}),e.jsx(n.td,{children:"45 nm"}),e.jsx(n.td,{children:"1.0V"}),e.jsx(n.td,{children:"1.4 nm"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"28nm"}),e.jsx(n.td,{children:"28 nm"}),e.jsx(n.td,{children:"0.9V"}),e.jsx(n.td,{children:"1.2 nm"})]})]})]}),`
`,e.jsx(n.h2,{id:"viewing-results",children:"Viewing Results"}),`
`,e.jsx(n.h3,{id:"3d-view",children:"3D View"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Rotate"}),": Left-click drag"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Zoom"}),": Mouse wheel"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Pan"}),": Right-click drag"]}),`
`]}),`
`,e.jsx(n.h3,{id:"plots",children:"Plots"}),`
`,e.jsx(n.p,{children:"Each plot can be expanded/collapsed by clicking its header."})]})}function c(s={}){const{wrapper:n}={...i(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{c as default};
