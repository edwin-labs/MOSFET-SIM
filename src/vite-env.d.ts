/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'react-plotly.js' {
  import { Component } from 'react';
  import Plotly from 'plotly.js';

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    frames?: Plotly.Frame[];
    config?: Partial<Plotly.Config>;
    onInitialized?: (figure: Readonly<{
      data: Plotly.Data[];
      layout: Plotly.Layout;
    }>, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Readonly<{
      data: Plotly.Data[];
      layout: Plotly.Layout;
    }>, graphDiv: HTMLElement) => void;
    onPurge?: (figure: Readonly<{
      data: Plotly.Data[];
      layout: Plotly.Layout;
    }>, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    divId?: string;
    className?: string;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    revision?: number;
  }

  class Plot extends Component<PlotParams> {}

  export default Plot;
}
