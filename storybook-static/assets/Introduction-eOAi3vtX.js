import{j as e}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as t}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function i(s){const n={h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...t(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"mosfet-junction-simulator",children:"MOSFET Junction Simulator"}),`
`,e.jsx(n.p,{children:"Welcome to the MOSFET Junction Simulator documentation. This interactive web application allows you to explore MOSFET device physics through simulation and visualization."}),`
`,e.jsx(n.h2,{id:"what-is-mosfet",children:"What is MOSFET?"}),`
`,e.jsxs(n.p,{children:["A ",e.jsx(n.strong,{children:"Metal-Oxide-Semiconductor Field-Effect Transistor (MOSFET)"})," is the fundamental building block of modern integrated circuits. It acts as an electrically controlled switch that controls current flow between the ",e.jsx(n.strong,{children:"source"})," and ",e.jsx(n.strong,{children:"drain"})," terminals based on the voltage applied to the ",e.jsx(n.strong,{children:"gate"})," terminal."]}),`
`,e.jsx(n.h2,{id:"simulator-features",children:"Simulator Features"}),`
`,e.jsx(n.h3,{id:"multi-level-physics",children:"Multi-Level Physics"}),`
`,e.jsx(n.p,{children:"The simulator provides three levels of physics models:"}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Level"}),e.jsx(n.th,{children:"Model Type"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Use Case"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"A"})}),e.jsx(n.td,{children:"Analytical"}),e.jsx(n.td,{children:"Classical Shockley equations"}),e.jsx(n.td,{children:"Quick analysis, learning"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"B"})}),e.jsx(n.td,{children:"Semi-empirical"}),e.jsx(n.td,{children:"Short-channel effects"}),e.jsx(n.td,{children:"Device design exploration"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:e.jsx(n.strong,{children:"C"})}),e.jsx(n.td,{children:"Numerical"}),e.jsx(n.td,{children:"2D Poisson + Drift-Diffusion"}),e.jsx(n.td,{children:"Accurate simulation"})]})]})]}),`
`,e.jsx(n.h3,{id:"visualization",children:"Visualization"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"3D View"}),": Interactive MOSFET structure with rotation and zoom"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"2D Views"}),": Front, Top, and Side cross-sections"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Doping Colormap"}),": Visualize dopant distribution"]}),`
`]}),`
`,e.jsx(n.h3,{id:"analysis",children:"Analysis"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"I-V Characteristics"}),": Output (Id vs Vds) and Transfer (Id vs Vgs)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"C-V Characteristics"}),": Gate capacitance vs voltage"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Band Diagram"}),": Energy band structure"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Device Metrics"}),": Vth, SS, Ion/Ioff, DIBL, gm"]}),`
`]}),`
`,e.jsx(n.h2,{id:"getting-started",children:"Getting Started"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["Select device type: ",e.jsx(n.strong,{children:"nMOS"})," or ",e.jsx(n.strong,{children:"pMOS"})]}),`
`,e.jsxs(n.li,{children:["Choose physics level: ",e.jsx(n.strong,{children:"A"}),", ",e.jsx(n.strong,{children:"B"}),", or ",e.jsx(n.strong,{children:"C"})]}),`
`,e.jsx(n.li,{children:"Adjust device parameters in the left sidebar"}),`
`,e.jsx(n.li,{children:"View results in the 3D/2D views and plots"}),`
`]}),`
`,e.jsx(n.h2,{id:"navigation",children:"Navigation"}),`
`,e.jsx(n.p,{children:"Use the sidebar on the left to explore:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Physics"}),": Deep dive into the simulation models"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"User Guide"}),": Step-by-step usage instructions"]}),`
`]})]})}function c(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}export{c as default};
