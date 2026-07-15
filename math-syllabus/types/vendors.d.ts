declare module "react-katex" {
  import type { ComponentType } from "react";

  interface KaTeXProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }

  export const InlineMath: ComponentType<KaTeXProps>;
  export const BlockMath: ComponentType<KaTeXProps>;
}

declare module "react-plotly.js" {
  import type { ComponentType } from "react";

  interface PlotParams {
    data: Array<Record<string, unknown>>;
    layout?: Record<string, unknown>;
    config?: Record<string, unknown>;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    onInitialized?: (figure: Record<string, unknown>, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Record<string, unknown>, graphDiv: HTMLElement) => void;
  }

  const Plot: ComponentType<PlotParams>;
  export default Plot;
}
