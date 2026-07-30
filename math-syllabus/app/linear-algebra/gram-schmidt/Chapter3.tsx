"use client";

import { useEffect, useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2 } from "./vectorMath";

/* Canvas coordinate convention shared with the other chapters:
   600x360 canvas, gridRange 5, origin at (300,180), 36px per unit. */
function toXY(p: Vec2) {
  return { x: 300 + p.x * 36, y: 180 - p.y * 36 };
}

export default function Chapter3() {
  const [ch3V1, setCh3V1] = useState<Vec2>({ x: 2, y: 1 });
  const [ch3V2, setCh3V2] = useState<Vec2>({ x: -1, y: 2 });
  const [ch3A, setCh3A] = useState<number>(1.5);
  const [ch3B, setCh3B] = useState<number>(1.0);
  const [ch3Preset, setCh3Preset] = useState<"plane" | "line">("plane");
  const [ch3Trail, setCh3Trail] = useState<Vec2[]>([]);
  const [ch3Target, setCh3Target] = useState<Vec2>({ x: 3, y: 2.5 });

  const effectiveCh3V2 = ch3Preset === "line" ? { x: ch3V1.x * 1.5, y: ch3V1.y * 1.5 } : ch3V2;
  const ch3Comb = {
    x: ch3A * ch3V1.x + ch3B * effectiveCh3V2.x,
    y: ch3A * ch3V1.y + ch3B * effectiveCh3V2.y,
  };

  // Determinant tells us whether v1 & v2 span the whole plane or collapse to a line.
  const det = ch3V1.x * effectiveCh3V2.y - effectiveCh3V2.x * ch3V1.y;
  const isIndependent = Math.abs(det) > 1e-4;

  // Every time a/b change (or the vectors move), drop a breadcrumb so the
  // reachable region visibly "fills in" as the sliders get explored.
  useEffect(() => {
    setCh3Trail((prev) => {
      const next = [...prev, { x: ch3Comb.x, y: ch3Comb.y }];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch3A, ch3B, ch3V1.x, ch3V1.y, effectiveCh3V2.x, effectiveCh3V2.y]);

  // Reset the trail whenever the preset changes so old plane/line dots don't linger.
  useEffect(() => {
    setCh3Trail([]);
  }, [ch3Preset]);

  /* ---- Reachability challenge math ---- */
  let targetReachable: boolean;
  let solvedA = 0;
  let solvedB = 0;
  let nearestPoint: Vec2 = ch3Target;

  if (isIndependent) {
    targetReachable = true;
    solvedA = (ch3Target.x * effectiveCh3V2.y - ch3Target.y * effectiveCh3V2.x) / det;
    solvedB = (ch3V1.x * ch3Target.y - ch3V1.y * ch3Target.x) / det;
  } else {
    const v1MagSq = ch3V1.x * ch3V1.x + ch3V1.y * ch3V1.y;
    const cross = ch3Target.x * ch3V1.y - ch3Target.y * ch3V1.x;
    const crossTolerance = 0.12 * Math.sqrt(v1MagSq || 1);
    targetReachable = v1MagSq > 1e-6 && Math.abs(cross) < crossTolerance;
    const t = v1MagSq > 1e-6 ? (ch3Target.x * ch3V1.x + ch3Target.y * ch3V1.y) / v1MagSq : 0;
    solvedA = t;
    solvedB = 0;
    nearestPoint = { x: t * ch3V1.x, y: t * ch3V1.y };
  }

  /* ---- Background span visualization for the main canvas ---- */
  const spanBackground =
    ch3Preset === "plane"
      ? [-3, -2, -1, 0, 1, 2, 3].flatMap((k) => {
        // Lines parallel to v1, spaced out along v2 (and vice versa) —
        // together they tile the plane exactly the way a·v1 + b·v2 does.
        const baseA = { x: k * effectiveCh3V2.x, y: k * effectiveCh3V2.y };
        const a1 = toXY({ x: baseA.x - ch3V1.x * 6, y: baseA.y - ch3V1.y * 6 });
        const a2 = toXY({ x: baseA.x + ch3V1.x * 6, y: baseA.y + ch3V1.y * 6 });

        const baseB = { x: k * ch3V1.x, y: k * ch3V1.y };
        const b1 = toXY({ x: baseB.x - effectiveCh3V2.x * 6, y: baseB.y - effectiveCh3V2.y * 6 });
        const b2 = toXY({ x: baseB.x + effectiveCh3V2.x * 6, y: baseB.y + effectiveCh3V2.y * 6 });

        return [
          <line
            key={`a${k}`}
            x1={a1.x}
            y1={a1.y}
            x2={a2.x}
            y2={a2.y}
            stroke="#10b981"
            strokeWidth={k === 0 ? 1.5 : 0.75}
            opacity={k === 0 ? 0.4 : 0.15}
          />,
          <line
            key={`b${k}`}
            x1={b1.x}
            y1={b1.y}
            x2={b2.x}
            y2={b2.y}
            stroke="#6366f1"
            strokeWidth={k === 0 ? 1.5 : 0.75}
            opacity={k === 0 ? 0.4 : 0.15}
          />,
        ];
      })
      : (() => {
        const p1 = toXY({ x: -ch3V1.x * 6, y: -ch3V1.y * 6 });
        const p2 = toXY({ x: ch3V1.x * 6, y: ch3V1.y * 6 });
        return [
          <line
            key="line-span"
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6,4"
            opacity={0.55}
          />,
        ];
      })();

  const trailDots = ch3Trail.map((p, i) => {
    const c = toXY(p);
    const fade = 0.1 + (i / Math.max(1, ch3Trail.length - 1)) * 0.4;
    return <circle key={i} cx={c.x} cy={c.y} r={2.2} fill="#10b981" opacity={fade} />;
  });

  return (
    <section className="mb-14 border-t border-border pt-10">
      <div className="flex items-center gap-3 mb-3">
        <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 3
        </span>
        <h2 className="text-2xl font-semibold m-0">Span</h2>
      </div>

      <blockquote className="border-l-4 border-accent pl-4 italic text-foreground-muted my-3">
        Question: What can these vectors reach?
      </blockquote>

      <p className="mb-4">
        The <strong>span</strong> of a set of vectors is the entire set of points that can be reached by forming all possible linear combinations <MathBlock tex="a\vec{v}_1 + b\vec{v}_2" inline />.
      </p>

      <div className="bg-surface/50 p-5 rounded-xl border border-border mb-6">
        <h3 className="text-lg font-semibold mb-2">The Mathematics of Span & Linear Combinations</h3>
        <p className="mb-2 text-sm text-foreground-muted">
          Finding if a target vector <MathBlock tex="\vec{w} = \begin{bmatrix} x \\ y \end{bmatrix}" inline /> is in the span of <MathBlock tex="\vec{v}_1" inline /> and <MathBlock tex="\vec{v}_2" inline /> means solving a system of linear equations. We want to find scalars <MathBlock tex="a" inline /> and <MathBlock tex="b" inline /> such that:
        </p>
        <div className="flex justify-center my-4 overflow-x-auto">
          <MathBlock tex="\begin{bmatrix} v_{1x} & v_{2x} \\ v_{1y} & v_{2y} \end{bmatrix} \begin{bmatrix} a \\ b \end{bmatrix} = \begin{bmatrix} x \\ y \end{bmatrix}" />
        </div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-muted">
          <li>If the vectors are <strong>independent</strong> (Determinant ≠ 0), the matrix is invertible. You can reach <em>any</em> point in 2D space. The span is the entire <strong>2D plane</strong>.</li>
          <li>If the vectors are <strong>dependent</strong> (Determinant = 0), the matrix cannot be inverted. You are trapped! You can only reach points along a single <strong>1D line</strong>.</li>
        </ul>
      </div>

      <div className="flex gap-2 my-4 not-prose">
        <button
          onClick={() => setCh3Preset("plane")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${ch3Preset === "plane" ? "bg-accent text-white border-accent" : "bg-surface text-foreground-muted border-border"
            }`}
        >
          2 Independent Vectors → 2D Plane Span
        </button>
        <button
          onClick={() => setCh3Preset("line")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${ch3Preset === "line" ? "bg-accent text-white border-accent" : "bg-surface text-foreground-muted border-border"
            }`}
        >
          2 Dependent Vectors → 1D Line Span
        </button>
      </div>

      <div className="widget-card my-4">
        <div className="widget-card__title">Interactive: Linear Combination Explorer</div>
        <p className="text-xs text-foreground-muted mb-3">
          Drag the sliders below and watch the green trail — every point it touches is a point in the span. In <strong>plane mode</strong> the trail fills the whole grid; in <strong>line mode</strong> it can only ever paint the single dashed line, no matter how you set <MathBlock tex="a" inline /> and <MathBlock tex="b" inline />.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 not-prose">
          <div>
            <label className="text-xs font-semibold text-foreground-muted block mb-1">
              Scalar a: <span className="font-mono text-accent">{ch3A}</span>
            </label>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={ch3A}
              onChange={(e) => setCh3A(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground-muted block mb-1">
              Scalar b: <span className="font-mono text-pink-500">{ch3B}</span>
            </label>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={ch3B}
              onChange={(e) => setCh3B(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <VectorCanvas
          width={600}
          height={360}
          gridRange={5}
          vectors={[
            { id: "v1", point: ch3V1, color: "#6366f1", draggable: true, label: "v₁" },
            { id: "v2", point: effectiveCh3V2, color: "#ec4899", draggable: ch3Preset === "plane", label: "v₂" },
            { id: "comb", point: ch3Comb, color: "#10b981", draggable: false, label: "a·v₁ + b·v₂" },
          ]}
          onVectorChange={(id, pt) => {
            if (id === "v1") setCh3V1(pt);
            if (id === "v2") setCh3V2(pt);
          }}
        >
          {spanBackground}
          {trailDots}
        </VectorCanvas>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-mono text-emerald-500">
            Current Result: {ch3A} × ({ch3V1.x.toFixed(1)}, {ch3V1.y.toFixed(1)}) + {ch3B} × ({effectiveCh3V2.x.toFixed(1)}, {effectiveCh3V2.y.toFixed(1)}) = ({ch3Comb.x.toFixed(1)}, {ch3Comb.y.toFixed(1)})
          </div>
          <button
            onClick={() => setCh3Trail([])}
            className="px-2.5 py-1 bg-surface-hover border border-border text-[11px] font-semibold rounded text-foreground cursor-pointer"
          >
            ↺ Clear Trail
          </button>
        </div>
      </div>

      <div className="widget-card my-4">
        <div className="widget-card__title">Interactive: Is This Point Reachable?</div>
        <p className="text-xs text-foreground-muted mb-3">
          Drag the target point <span style={{ color: "#ec4899", fontWeight: 600 }}>w</span> anywhere. The widget solves <MathBlock tex="a\vec{v}_1 + b\vec{v}_2 = \vec{w}" inline /> live using your current <MathBlock tex="v_1" inline /> and <MathBlock tex="v_2" inline /> from above.
        </p>

        <VectorCanvas
          width={600}
          height={360}
          gridRange={5}
          vectors={[
            { id: "v1", point: ch3V1, color: "#6366f1", draggable: false, label: "v₁" },
            { id: "v2", point: effectiveCh3V2, color: "#ec4899", draggable: false, label: "v₂" },
            { id: "target", point: ch3Target, color: "#d946ef", draggable: true, label: "w" },
          ]}
          onVectorChange={(id, pt) => {
            if (id === "target") setCh3Target(pt);
          }}
        >
          {spanBackground}
          {!targetReachable && (
            <>
              <line
                x1={toXY(ch3Target).x}
                y1={toXY(ch3Target).y}
                x2={toXY(nearestPoint).x}
                y2={toXY(nearestPoint).y}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <circle cx={toXY(nearestPoint).x} cy={toXY(nearestPoint).y} r={4} fill="#ef4444" />
            </>
          )}
        </VectorCanvas>

        <div className="mt-3">
          {targetReachable ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="text-sm font-bold text-emerald-500 mb-1">✅ Reachable!</div>
              <p className="text-xs text-foreground-muted m-0">
                Solving the system gives <MathBlock tex={`a = ${solvedA.toFixed(2)}, \\ b = ${solvedB.toFixed(2)}`} inline />. Plugging these back in lands exactly on <MathBlock tex="w" inline />.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <div className="text-sm font-bold text-rose-500 mb-1">❌ Not reachable</div>
              <p className="text-xs text-foreground-muted m-0">
                Because <MathBlock tex="v_1" inline /> and <MathBlock tex="v_2" inline /> are dependent, their span is only the dashed line (shown in orange). The dashed red segment shows the shortest correction needed — the closest point you can actually reach is{" "}
                <span className="font-mono">({nearestPoint.x.toFixed(2)}, {nearestPoint.y.toFixed(2)})</span>, using <MathBlock tex={`a = ${solvedA.toFixed(2)}, \\ b = 0`} inline />.
              </p>
            </div>
          )}
          <div className="text-xs text-foreground-subtle mt-2">
            Try switching to <strong>2D Plane Span</strong> above — the same target instantly becomes reachable, because now every point in the grid is in the span.
          </div>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-4">
        <strong className="text-accent">💡 Key Takeaway:</strong> Vectors don't just exist in isolation—they <strong>generate spaces</strong> (subspaces like lines, planes, and hyperplanes). Whether a target point is reachable depends entirely on whether it lies inside that generated space.
      </div>
    </section>
  );
}