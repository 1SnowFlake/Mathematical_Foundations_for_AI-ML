"use client";

import { useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, useGramSchmidt } from "./vectorMath";
import GeometricNarrativeInline from "./GeometricNarrativeInline";

export default function Chapter5() {
  const [ch5V1, setCh5V1] = useState<Vec2>({ x: 4, y: 1 });
  const [ch5V2, setCh5V2] = useState<Vec2>({ x: 2, y: 3 });
  const [ch5Step, setCh5Step] = useState<0 | 1 | 2 | 3>(0);

  const gs5 = useGramSchmidt(ch5V1, ch5V2);
  const ch5U1 = gs5.u1;
  const ch5Proj = gs5.projection;
  const ch5U2Raw = gs5.u2;
  const ch5E1 = gs5.e1;
  const ch5E2 = gs5.e2;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 5 ✨
        </span>
        <h2 className="text-2xl font-bold m-0">The Gram–Schmidt Algorithm</h2>
      </div>

      <blockquote className="border-l-4 border-accent pl-4 italic text-foreground-muted my-2">
        Question: How do we convert any set of independent vectors into perpendicular ones?
      </blockquote>

      <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
        Gram–Schmidt fixes nearly-parallel vectors with three clear geometric steps:
        <strong> Projection → Subtract Overlap → Normalize</strong>.
      </p>

      {/* 2D Interactive Step-by-Step */}
      <div className="widget-card">
        <div className="widget-card__title">2D Step-by-Step Interactive Visualizer</div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCh5Step(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              ch5Step === 0 ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
            }`}
          >
            Step 0: Original Basis
          </button>
          <button
            onClick={() => setCh5Step(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              ch5Step === 1 ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
            }`}
          >
            Step 1: Compute Projection
          </button>
          <button
            onClick={() => setCh5Step(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              ch5Step === 2 ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
            }`}
          >
            Step 2: Subtract Overlap
          </button>
          <button
            onClick={() => setCh5Step(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              ch5Step === 3 ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
            }`}
          >
            Step 3: Normalize (Orthonormal)
          </button>
        </div>

        <div className="flex justify-center overflow-x-auto py-2">
          <VectorCanvas
            width={600}
            height={360}
            gridRange={5}
            vectors={[
              { id: "v1", point: ch5V1, color: "#6366f1", draggable: true, label: "v₁" },
              ...(ch5Step < 2
                ? [{ id: "v2", point: ch5V2, color: "#ec4899", draggable: true, label: "v₂" }]
                : []),
              ...(ch5Step === 1
                ? [{ id: "proj", point: ch5Proj, color: "#f59e0b", draggable: false, label: "proj_{v1}(v₂)" }]
                : []),
              ...(ch5Step === 2
                ? [{ id: "u2", point: ch5U2Raw, color: "#10b981", draggable: false, label: "u₂ = v₂ - proj" }]
                : []),
              ...(ch5Step === 3
                ? [
                    { id: "e1", point: ch5E1, color: "#6366f1", draggable: false, label: "e₁" },
                    { id: "e2", point: ch5E2, color: "#10b981", draggable: false, label: "e₂" },
                  ]
                : []),
            ]}
            onVectorChange={(id, pt) => {
              if (id === "v1") setCh5V1(pt);
              if (id === "v2") setCh5V2(pt);
            }}
          />
        </div>

        <div className="mt-4 p-4 bg-surface border border-border rounded-xl">
          {ch5Step === 0 && (
            <div className="text-sm">Start with raw independent vectors <MathBlock tex="v_1" inline /> and <MathBlock tex="v_2" inline />.</div>
          )}
          {ch5Step === 1 && (
            <div className="text-sm">
              Project <MathBlock tex="v_2" inline /> onto <MathBlock tex="v_1" inline />:
              <MathBlock tex="\text{proj}_{u_1}(v_2) = \frac{v_2 \cdot u_1}{\|u_1\|^2} u_1" />
            </div>
          )}
          {ch5Step === 2 && (
            <div className="text-sm">
              Subtract the shadow projection to isolate perpendicular component <MathBlock tex="u_2" inline />:
              <MathBlock tex="u_2 = v_2 - \text{proj}_{u_1}(v_2)" />
            </div>
          )}
          {ch5Step === 3 && (
            <div className="text-sm">
              Divide each vector by its length to get unit vectors:
              <MathBlock tex="e_1 = \frac{u_1}{\|u_1\|}, \quad e_2 = \frac{u_2}{\|u_2\|}" />
            </div>
          )}
        </div>
      </div>

      {/* 3D Isometric Geometric Narrative */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">3D Geometric Walkthrough &amp; Space Preservation</h3>
        <p className="text-sm text-foreground-muted mb-4">
          Follow the 3D step-by-step isometric transformation from skewed basis vectors <MathBlock tex="a_1, a_2, a_3" inline /> to orthonormal basis <MathBlock tex="q_1, q_2, q_3" inline />.
        </p>
        <GeometricNarrativeInline />
      </div>
    </section>
  );
}
