"use client";

import { useState, useCallback, useMemo } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import ParamPanel from "@/components/primitives/ParamPanel";
import type { ParamSchema } from "@/components/primitives/ParamPanel";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import type { VectorDef } from "@/components/primitives/VectorCanvas";
import GraphEditor, { useAlgorithmPlayback } from "@/components/primitives/GraphEditor";
import type { GENode, GEEdge } from "@/components/primitives/GraphEditor";
import Surface3D from "@/components/primitives/Surface3D";
import EmbedFrame from "@/components/primitives/EmbedFrame";
import { bfs } from "@/lib/graphAlgorithms";
import { dot, magnitude, angleBetween } from "@/lib/matrix";
import type { Vector2D } from "@/lib/matrix";

// ──────────────────────────────────────────────────
// Demo data
// ──────────────────────────────────────────────────

const DEMO_GRAPH_NODES: GENode[] = [
  { id: "A", label: "A", x: 100, y: 80 },
  { id: "B", label: "B", x: 250, y: 60 },
  { id: "C", label: "C", x: 400, y: 100 },
  { id: "D", label: "D", x: 150, y: 220 },
  { id: "E", label: "E", x: 320, y: 250 },
];

const DEMO_GRAPH_EDGES: GEEdge[] = [
  { id: "eAB", source: "A", target: "B" },
  { id: "eBC", source: "B", target: "C" },
  { id: "eAD", source: "A", target: "D" },
  { id: "eBE", source: "B", target: "E" },
  { id: "eDE", source: "D", target: "E" },
  { id: "eCE", source: "C", target: "E" },
];

// ──────────────────────────────────────────────────
// Dev Page
// ──────────────────────────────────────────────────

export default function DevComponentsPage() {
  return (
    <div className="space-y-12">
      <div className="prose">
        <h1>🧪 Component Primitives</h1>
        <p>
          Internal QA page — one working demo of each reusable primitive.
          These are the building blocks for all interactive lesson widgets.
        </p>
      </div>

      <DemoSection title="1. MathBlock" description="KaTeX wrapper for inline and block math">
        <MathBlockDemo />
      </DemoSection>

      <DemoSection title="2. ParamPanel" description="Leva-backed parameter controls with project theming">
        <ParamPanelDemo />
      </DemoSection>

      <DemoSection title="3. VectorCanvas" description="SVG canvas with draggable vector endpoints">
        <VectorCanvasDemo />
      </DemoSection>

      <DemoSection title="4. GraphEditor" description="Graph editor with algorithm step replay">
        <GraphEditorDemo />
      </DemoSection>

      <DemoSection title="5. Surface3D" description="Interactive 3D surface plot via Plotly">
        <Surface3DDemo />
      </DemoSection>

      <DemoSection title="6. EmbedFrame" description="Consistent iframe wrapper with attribution">
        <EmbedFrameDemo />
      </DemoSection>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Demo wrapper
// ──────────────────────────────────────────────────

function DemoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="widget-card">
      <div className="widget-card__title">{title}</div>
      <p className="mb-4 text-sm text-foreground-muted">{description}</p>
      {children}
    </section>
  );
}

// ──────────────────────────────────────────────────
// 1. MathBlock Demo
// ──────────────────────────────────────────────────

function MathBlockDemo() {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-mono text-foreground-subtle">Block math:</span>
        <MathBlock tex={String.raw`\int_0^\infty e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}`} />
      </div>
      <div>
        <span className="text-xs font-mono text-foreground-subtle">Inline math:</span>
        <p className="text-sm text-foreground">
          The quadratic formula is{" "}
          <MathBlock tex={String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`} inline />{" "}
          where <MathBlock tex={String.raw`a \neq 0`} inline />.
        </p>
      </div>
      <div>
        <span className="text-xs font-mono text-foreground-subtle">Matrix:</span>
        <MathBlock tex={String.raw`\begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} x' \\ y' \end{bmatrix}`} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 2. ParamPanel Demo
// ──────────────────────────────────────────────────

const paramSchema = {
  radius: { type: "slider" as const, label: "Radius", value: 40, min: 10, max: 100, step: 1 },
  color: { type: "color" as const, label: "Color", value: "#6366f1" },
  filled: { type: "boolean" as const, label: "Filled", value: true },
} satisfies ParamSchema;

function ParamPanelDemo() {
  const [params, setParams] = useState({
    radius: 40,
    color: "#6366f1",
    filled: true,
  });

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="flex-1">
        <ParamPanel schema={paramSchema} onChange={setParams} />
      </div>
      <div className="flex items-center justify-center flex-1">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={params.radius}
            fill={params.filled ? params.color : "none"}
            stroke={params.color}
            strokeWidth="2"
            fillOpacity={params.filled ? 0.3 : 0}
          />
        </svg>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 3. VectorCanvas Demo
// ──────────────────────────────────────────────────

function VectorCanvasDemo() {
  const [vectors, setVectors] = useState<VectorDef[]>([
    { id: "a", point: { x: 3, y: 2 }, color: "#6366f1", draggable: true, label: "a" },
    { id: "b", point: { x: -1, y: 3 }, color: "#10b981", draggable: true, label: "b" },
  ]);

  const handleVectorChange = useCallback((id: string, point: Vector2D) => {
    setVectors((prev) => prev.map((v) => (v.id === id ? { ...v, point } : v)));
  }, []);

  const a = vectors.find((v) => v.id === "a")!.point;
  const b = vectors.find((v) => v.id === "b")!.point;
  const dotProduct = dot(a, b);
  const angle = (angleBetween(a, b) * 180) / Math.PI;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <VectorCanvas vectors={vectors} onVectorChange={handleVectorChange} />
      <div className="space-y-2 text-sm font-mono">
        <div className="text-foreground-muted">
          <MathBlock tex={`\\vec{a} = (${a.x}, ${a.y})`} inline />
        </div>
        <div className="text-foreground-muted">
          <MathBlock tex={`\\vec{b} = (${b.x}, ${b.y})`} inline />
        </div>
        <div className="text-foreground-muted">
          <MathBlock tex={`\\vec{a} \\cdot \\vec{b} = ${dotProduct.toFixed(1)}`} inline />
        </div>
        <div className="text-foreground-muted">
          <MathBlock tex={`|\\vec{a}| = ${magnitude(a).toFixed(2)}`} inline />
        </div>
        <div className="text-foreground-muted">
          <MathBlock tex={`|\\vec{b}| = ${magnitude(b).toFixed(2)}`} inline />
        </div>
        <div className="text-foreground-muted">
          <MathBlock tex={`\\theta = ${angle.toFixed(1)}°`} inline />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 4. GraphEditor Demo
// ──────────────────────────────────────────────────

function GraphEditorDemo() {
  const [graphNodes, setGraphNodes] = useState(DEMO_GRAPH_NODES);
  const [graphEdges, setGraphEdges] = useState(DEMO_GRAPH_EDGES);

  const steps = useMemo(
    () => bfs(graphNodes, graphEdges, "A"),
    [graphNodes, graphEdges]
  );

  const { currentStep, currentStepIndex, totalSteps, isPlaying, play, pause, stepForward, stepBackward, reset } =
    useAlgorithmPlayback(steps, 600);

  return (
    <div className="space-y-4">
      <GraphEditor
        initialNodes={DEMO_GRAPH_NODES}
        initialEdges={DEMO_GRAPH_EDGES}
        algorithmStep={currentStep}
        onGraphChange={(nodes, edges) => {
          setGraphNodes(nodes);
          setGraphEdges(edges);
        }}
        editable
      />

      {/* Playback controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={reset} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors">
          Reset
        </button>
        <button onClick={stepBackward} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors">
          ◀ Step
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="rounded-md bg-accent px-4 py-1.5 text-xs text-white hover:bg-accent-hover transition-colors"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play BFS"}
        </button>
        <button onClick={stepForward} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors">
          Step ▶
        </button>
        <span className="text-xs text-foreground-subtle ml-2">
          Step {Math.max(0, currentStepIndex + 1)} / {totalSteps}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 5. Surface3D Demo
// ──────────────────────────────────────────────────

function Surface3DDemo() {
  const [showContour, setShowContour] = useState(false);

  const fn = useCallback((x: number, y: number) => Math.sin(x) * Math.cos(y), []);

  return (
    <div className="space-y-3">
      <Surface3D fn={fn} showContour={showContour} />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
          <input
            type="checkbox"
            checked={showContour}
            onChange={(e) => setShowContour(e.target.checked)}
            className="rounded"
          />
          Show contour projection
        </label>
        <span className="text-xs text-foreground-subtle font-mono">
          f(x, y) = sin(x) · cos(y)
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 6. EmbedFrame Demo
// ──────────────────────────────────────────────────

function EmbedFrameDemo() {
  return (
    <EmbedFrame
      src="https://www.desmos.com/calculator"
      title="Desmos Graphing Calculator"
      attribution={{
        name: "Desmos",
        url: "https://www.desmos.com",
      }}
      aspectRatio="16:9"
    />
  );
}
