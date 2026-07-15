"use client";

import { useState, useCallback } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { useProgress } from "@/components/layout/ProgressProvider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Op = "add" | "scalar" | "dot" | "cross";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VectorsPage() {
  const { markCompleted } = useProgress();
  const [activeOp, setActiveOp] = useState<Op>("add");

  // Vectors
  const [vecA, setVecA] = useState({ x: 3, y: 2 });
  const [vecB, setVecB] = useState({ x: -1, y: 3 });
  const [scalar, setScalar] = useState(2);

  // Derived values
  const sum = { x: vecA.x + vecB.x, y: vecA.y + vecB.y };
  const scaled = { x: vecA.x * scalar, y: vecA.y * scalar };
  const dot = vecA.x * vecB.x + vecA.y * vecB.y;
  const magA = Math.sqrt(vecA.x ** 2 + vecA.y ** 2);
  const magB = Math.sqrt(vecB.x ** 2 + vecB.y ** 2);
  const cosAngle = magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
  const cross2D = vecA.x * vecB.y - vecA.y * vecB.x; // z-component of 3D cross product

  // Build vectors for the canvas based on active operation
  const buildVectors = useCallback(() => {
    const baseVectors = [
      { id: "a", point: { x: vecA.x, y: vecA.y }, color: "#6366f1", label: "a", draggable: true },
      { id: "b", point: { x: vecB.x, y: vecB.y }, color: "#ec4899", label: "b", draggable: true },
    ];

    switch (activeOp) {
      case "add":
        return [
          ...baseVectors,
          { id: "sum", point: { x: sum.x, y: sum.y }, color: "#10b981", label: "a+b", draggable: false },
        ];
      case "scalar":
        return [
          baseVectors[0],
          { id: "scaled", point: { x: scaled.x, y: scaled.y }, color: "#f59e0b", label: `${scalar}a`, draggable: false },
        ];
      case "dot":
      case "cross":
        return baseVectors;
    }
  }, [vecA, vecB, activeOp, sum, scaled, scalar]);

  const handleVectorChange = (id: string, point: { x: number; y: number }) => {
    if (id === "a") setVecA({ x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 });
    if (id === "b") setVecB({ x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 });
  };

  const OPS: { key: Op; label: string; icon: string }[] = [
    { key: "add", label: "Addition", icon: "➕" },
    { key: "scalar", label: "Scalar Multiply", icon: "✖️" },
    { key: "dot", label: "Dot Product", icon: "·" },
    { key: "cross", label: "Cross Product", icon: "×" },
  ];

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <h1>Vectors</h1>
      <p>
        Vectors are the fundamental building blocks of linear algebra and machine learning.
        A 2D vector <MathBlock tex="\vec{v} = (v_x, v_y)" inline /> represents both a direction
        and a magnitude in the plane.
      </p>

      {/* Operation tabs */}
      <div className="flex flex-wrap gap-2 mb-4 not-prose">
        {OPS.map((op) => (
          <button
            key={op.key}
            onClick={() => setActiveOp(op.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: activeOp === op.key ? "var(--accent)" : "var(--surface)",
              color: activeOp === op.key ? "white" : "var(--foreground-muted)",
              border: `1px solid ${activeOp === op.key ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {op.icon} {op.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="widget-card">
        <div className="widget-card__title">Interactive Vector Canvas</div>
        <p className="text-sm text-foreground-muted mb-4" style={{ margin: "0 0 1rem 0" }}>
          Drag the arrowheads of <span style={{ color: "#6366f1", fontWeight: 600 }}>a</span> and{" "}
          <span style={{ color: "#ec4899", fontWeight: 600 }}>b</span> to explore.
        </p>
        <VectorCanvas
          width={600}
          height={400}
          gridRange={6}
          vectors={buildVectors()}
          onVectorChange={handleVectorChange}
        />
      </div>

      {/* Info panel */}
      <div className="widget-card" style={{ marginTop: "1rem" }}>
        <div className="grid gap-4 sm:grid-cols-2 not-prose">
          <div>
            <div className="text-xs text-foreground-subtle uppercase tracking-wider mb-2 font-semibold">
              Vector Values
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span style={{ color: "#6366f1", fontWeight: 600 }}>a</span> = ({vecA.x}, {vecA.y}),
                |a| = {magA.toFixed(2)}
              </div>
              <div>
                <span style={{ color: "#ec4899", fontWeight: 600 }}>b</span> = ({vecB.x}, {vecB.y}),
                |b| = {magB.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-foreground-subtle uppercase tracking-wider mb-2 font-semibold">
              Result
            </div>
            {activeOp === "add" && (
              <div className="text-sm">
                <MathBlock tex={`\\vec{a} + \\vec{b} = (${sum.x}, ${sum.y})`} inline />
                <p className="text-foreground-muted mt-1 text-xs" style={{ margin: "0.25rem 0 0" }}>
                  The sum vector follows the parallelogram rule.
                </p>
              </div>
            )}
            {activeOp === "scalar" && (
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-foreground-muted">k =</label>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={0.5}
                    value={scalar}
                    onChange={(e) => setScalar(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">{scalar}</span>
                </div>
                <MathBlock tex={`k \\cdot \\vec{a} = ${scalar} \\cdot (${vecA.x}, ${vecA.y}) = (${scaled.x}, ${scaled.y})`} inline />
              </div>
            )}
            {activeOp === "dot" && (
              <div className="text-sm">
                <MathBlock tex={`\\vec{a} \\cdot \\vec{b} = ${dot.toFixed(2)}`} inline />
                <br />
                <MathBlock tex={`\\theta = ${angle.toFixed(1)}°`} inline />
                <p className="text-foreground-muted mt-1 text-xs" style={{ margin: "0.25rem 0 0" }}>
                  {dot > 0 ? "Vectors point in similar directions." : dot < 0 ? "Vectors point in opposite directions." : "Vectors are perpendicular."}
                </p>
              </div>
            )}
            {activeOp === "cross" && (
              <div className="text-sm">
                <MathBlock tex={`\\vec{a} \\times \\vec{b} = ${cross2D.toFixed(2)} \\, \\hat{k}`} inline />
                <p className="text-foreground-muted mt-1 text-xs" style={{ margin: "0.25rem 0 0" }}>
                  The 2D cross product gives the signed area of the parallelogram.
                  {cross2D > 0 ? " (b is counter-clockwise from a)" : cross2D < 0 ? " (b is clockwise from a)" : " (Vectors are parallel)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Math formulas */}
      <h2>Formulas</h2>
      <div className="widget-card not-prose" style={{ fontSize: "0.9rem" }}>
        <div className="space-y-3">
          <div>
            <strong>Addition:</strong>
            <MathBlock tex="\vec{a} + \vec{b} = (a_x + b_x, \, a_y + b_y)" />
          </div>
          <div>
            <strong>Scalar Multiplication:</strong>
            <MathBlock tex="k\vec{a} = (k \cdot a_x, \, k \cdot a_y)" />
          </div>
          <div>
            <strong>Dot Product:</strong>
            <MathBlock tex="\vec{a} \cdot \vec{b} = a_x b_x + a_y b_y = |\vec{a}||\vec{b}|\cos\theta" />
          </div>
          <div>
            <strong>Cross Product (2D → scalar):</strong>
            <MathBlock tex="\vec{a} \times \vec{b} = a_x b_y - a_y b_x" />
          </div>
        </div>
      </div>

      {/* ML connection */}
      <h2>Why This Matters in ML</h2>
      <ul>
        <li><strong>Dot products</strong> are the core of neural network forward passes — every neuron computes <MathBlock tex="w \cdot x + b" inline />.</li>
        <li><strong>Vector addition</strong> is how we combine embeddings, gradients, and biases.</li>
        <li><strong>Cosine similarity</strong> (from the dot product) measures how similar two text/image embeddings are.</li>
      </ul>

      {/* Challenge */}
      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Can you position vectors <strong>a</strong> and <strong>b</strong> so that their dot product
          is exactly <strong>0</strong>? (Hint: they need to be perpendicular!)
        </p>
      </div>

      {/* Complete button */}
      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/linear-algebra/vectors")}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                     text-white cursor-pointer transition-all"
          style={{ background: "var(--success)" }}
        >
          ✓ Mark as Complete
        </button>
      </div>
    </div>
  );
}
