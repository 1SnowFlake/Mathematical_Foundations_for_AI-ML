"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Plotly must be loaded client-side only — it accesses `window` on import
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-lg border border-border bg-surface"
      style={{ height: 400 }}>
      <div className="flex flex-col items-center gap-2 text-foreground-subtle">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground-subtle border-t-accent" />
        <span className="text-xs">Loading 3D surface…</span>
      </div>
    </div>
  ),
});

export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

interface Surface3DProps {
  /** Function to plot: f(x, y) → z */
  fn: (x: number, y: number) => number;
  /** X-axis range [min, max] */
  xRange?: [number, number];
  /** Y-axis range [min, max] */
  yRange?: [number, number];
  /** Grid resolution (number of points per axis) */
  resolution?: number;
  /** Show contour projection below the surface */
  showContour?: boolean;
  /** Animated path overlay (e.g. gradient descent trajectory) */
  paths?: PathPoint[];
  /** Height of the plot */
  height?: number;
  /** Optional CSS class */
  className?: string;
}

/**
 * 3D surface plot wrapping react-plotly.js.
 * Rotate/zoom/pan built in via Plotly's native 3D interaction.
 * Base primitive for calculus (gradients, partial derivatives)
 * and optimization (gradient descent) visualizations.
 */
export default function Surface3D({
  fn,
  xRange = [-3, 3],
  yRange = [-3, 3],
  resolution = 50,
  showContour = false,
  paths,
  height = 450,
  className = "",
}: Surface3DProps) {
  // Generate the mesh grid
  const { xGrid, yGrid, zGrid } = useMemo(() => {
    const xStep = (xRange[1] - xRange[0]) / (resolution - 1);
    const yStep = (yRange[1] - yRange[0]) / (resolution - 1);

    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];

    for (let i = 0; i < resolution; i++) {
      x.push(xRange[0] + i * xStep);
    }
    for (let j = 0; j < resolution; j++) {
      y.push(yRange[0] + j * yStep);
    }
    for (let j = 0; j < resolution; j++) {
      const row: number[] = [];
      for (let i = 0; i < resolution; i++) {
        row.push(fn(x[i], y[j]));
      }
      z.push(row);
    }

    return { xGrid: x, yGrid: y, zGrid: z };
  }, [fn, xRange, yRange, resolution]);

  // Build Plotly traces
  const traces = useMemo(() => {
    const result: Array<Record<string, unknown>> = [
      {
        type: "surface",
        x: xGrid,
        y: yGrid,
        z: zGrid,
        colorscale: "Viridis",
        opacity: 0.85,
        contours: showContour
          ? {
              z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#ffffff",
                project: { z: true },
              },
            }
          : undefined,
        showscale: false,
        hoverinfo: "x+y+z",
      },
    ];

    // Add path trace if provided (e.g., gradient descent trajectory)
    if (paths && paths.length > 0) {
      result.push({
        type: "scatter3d",
        x: paths.map((p) => p.x),
        y: paths.map((p) => p.y),
        z: paths.map((p) => p.z),
        mode: "lines+markers",
        marker: {
          size: 4,
          color: "#ef4444",
        },
        line: {
          color: "#ef4444",
          width: 3,
        },
        name: "Path",
        hoverinfo: "x+y+z",
      });
    }

    return result;
  }, [xGrid, yGrid, zGrid, showContour, paths]);

  const layout = useMemo(
    () => ({
      autosize: true,
      height,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      scene: {
        xaxis: {
          title: "x",
          gridcolor: "rgba(128,128,128,0.2)",
          zerolinecolor: "rgba(128,128,128,0.4)",
        },
        yaxis: {
          title: "y",
          gridcolor: "rgba(128,128,128,0.2)",
          zerolinecolor: "rgba(128,128,128,0.4)",
        },
        zaxis: {
          title: "z",
          gridcolor: "rgba(128,128,128,0.2)",
          zerolinecolor: "rgba(128,128,128,0.4)",
        },
        bgcolor: "rgba(0,0,0,0)",
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.2 },
        },
      },
      font: {
        size: 11,
      },
    }),
    [height]
  );

  return (
    <div className={`rounded-lg border border-border bg-surface overflow-hidden ${className}`}>
      <Plot
        data={traces}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
          displaylogo: false,
        }}
        style={{ width: "100%", height }}
        useResizeHandler
      />
    </div>
  );
}
