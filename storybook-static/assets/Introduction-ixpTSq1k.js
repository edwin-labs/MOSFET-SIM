import{j as n}from"./jsx-runtime-Dr09uJeB.js";import{useMDXComponents as t}from"./index-B-17l0hQ.js";import"./index-B_0np5cU.js";function s(i){const e={h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",strong:"strong",ul:"ul",...t(),...i.components};return n.jsxs(n.Fragment,{children:[n.jsx(e.h1,{id:"mosfet-junction-simulator",children:"MOSFET Junction Simulator"}),`
`,n.jsx(e.p,{children:"Welcome to the MOSFET Junction Simulator documentation. This interactive web application allows you to explore MOSFET device physics through simulation and visualization."}),`
`,n.jsx(e.h2,{id:"what-is-mosfet",children:"What is MOSFET?"}),`
`,n.jsxs(e.p,{children:["A ",n.jsx(e.strong,{children:"Metal-Oxide-Semiconductor Field-Effect Transistor (MOSFET)"})," is the fundamental building block of modern integrated circuits. It acts as an electrically controlled switch that controls current flow between the ",n.jsx(e.strong,{children:"source"})," and ",n.jsx(e.strong,{children:"drain"})," terminals based on the voltage applied to the ",n.jsx(e.strong,{children:"gate"})," terminal."]}),`
`,n.jsx(e.h2,{id:"simulator-features",children:"Simulator Features"}),`
`,n.jsx(e.h3,{id:"multi-level-physics",children:"Multi-Level Physics"}),`
`,n.jsx(e.p,{children:"The simulator provides three levels of physics models:"}),`
`,n.jsxs(e.p,{children:[`| Level | Model Type | Description | Use Case |
|-------|------------|-------------|----------|
| `,n.jsx(e.strong,{children:"A"}),` | Analytical | Classical Shockley equations | Quick analysis, learning |
| `,n.jsx(e.strong,{children:"B"}),` | Semi-empirical | Short-channel effects | Device design exploration |
| `,n.jsx(e.strong,{children:"C"})," | Numerical | 2D Poisson + Drift-Diffusion | Accurate simulation |"]}),`
`,n.jsx(e.h3,{id:"visualization",children:"Visualization"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"3D View"}),": Interactive MOSFET structure with rotation and zoom"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"2D Views"}),": Front, Top, and Side cross-sections"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Doping Colormap"}),": Visualize dopant distribution"]}),`
`]}),`
`,n.jsx(e.h3,{id:"analysis",children:"Analysis"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"I-V Characteristics"}),": Output (Id vs Vds) and Transfer (Id vs Vgs)"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"C-V Characteristics"}),": Gate capacitance vs voltage"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Band Diagram"}),": Energy band structure"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Device Metrics"}),": Vth, SS, Ion/Ioff, DIBL, gm"]}),`
`]}),`
`,n.jsx(e.h2,{id:"getting-started",children:"Getting Started"}),`
`,n.jsxs(e.ol,{children:[`
`,n.jsxs(e.li,{children:["Select device type: ",n.jsx(e.strong,{children:"nMOS"})," or ",n.jsx(e.strong,{children:"pMOS"})]}),`
`,n.jsxs(e.li,{children:["Choose physics level: ",n.jsx(e.strong,{children:"A"}),", ",n.jsx(e.strong,{children:"B"}),", or ",n.jsx(e.strong,{children:"C"})]}),`
`,n.jsx(e.li,{children:"Adjust device parameters in the left sidebar"}),`
`,n.jsx(e.li,{children:"View results in the 3D/2D views and plots"}),`
`]}),`
`,n.jsx(e.h2,{id:"navigation",children:"Navigation"}),`
`,n.jsx(e.p,{children:"Use the sidebar on the left to explore:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Physics"}),": Deep dive into the simulation models"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"User Guide"}),": Step-by-step usage instructions"]}),`
`]})]})}function c(i={}){const{wrapper:e}={...t(),...i.components};return e?n.jsx(e,{...i,children:n.jsx(s,{...i})}):s(i)}export{c as default};
