"use client";

import { useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, mag } from "./vectorMath";

export default function Chapter2() {
  const [ch2V1, setCh2V1] = useState<Vec2>({ x: 3, y: 1 });
  const [ch2V2, setCh2V2] = useState<Vec2>({ x: 1, y: 3 });

  // Calculate independence via Determinant (area of parallelogram)
  const ch2Det = ch2V1.x * ch2V2.y - ch2V2.x * ch2V1.y;
  // A non-zero determinant means vectors are independent (we use a small epsilon for floating point/UI margin)
  const isCh2Independent = Math.abs(ch2Det) > 0.5 && mag(ch2V1) > 0.15 && mag(ch2V2) > 0.15;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 2
        </span>
        <h2 className="text-2xl font-bold m-0">What Are Independent Vectors?</h2>
      </div>

      <blockquote className="border-l-4 border-accent pl-4 italic text-foreground-muted my-2">
        Question: When are two vectors truly different?
      </blockquote>

      <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
        Two vectors are linearly dependent if one can be created simply by scaling the other (<MathBlock tex="\vec{v}_2 = c \cdot \vec{v}_1" inline />).
        They are <strong>linearly independent</strong> if neither lies along the line formed by the other.
      </p>

      <div className="bg-surface/50 p-5 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-2">The Mathematics of Independence</h3>
        <p className="text-sm text-foreground-muted mb-2">
          In 2D space, we check if two vectors <MathBlock tex="\vec{v}_1 = \begin{bmatrix} a \\ c \end{bmatrix}" inline /> and <MathBlock tex="\vec{v}_2 = \begin{bmatrix} b \\ d \end{bmatrix}" inline /> are independent by computing their <strong>Determinant</strong>.
          The determinant represents the <strong>signed area</strong> of the parallelogram formed by the two vectors.
        </p>
        <div className="flex justify-center my-4">
          <MathBlock tex="\text{Det}(\vec{v}_1, \vec{v}_2) = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc" />
        </div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-muted">
          <li>If <strong>Determinant ≠ 0</strong>: The vectors are linearly independent (they enclose an area).</li>
          <li>If <strong>Determinant = 0</strong>: The vectors are linearly dependent (the parallelogram collapses into a flat line).</li>
        </ul>
      </div>

      <div className="widget-card">
        <div className="widget-card__title">Interactive: Independence &amp; Determinant Detector</div>
        <p className="text-xs text-foreground-muted mb-3">
          Drag vectors <span style={{ color: "#6366f1", fontWeight: 600 }}>v₁</span> and <span style={{ color: "#ec4899", fontWeight: 600 }}>v₂</span>. Notice how the determinant (area) shrinks to zero when they align!
        </p>

        <div className="flex justify-center overflow-x-auto py-2">
          <VectorCanvas
            width={600}
            height={360}
            gridRange={5}
            vectors={[
              { id: "v1", point: ch2V1, color: "#6366f1", draggable: true, label: "v₁" },
              { id: "v2", point: ch2V2, color: "#ec4899", draggable: true, label: "v₂" },
            ]}
            onVectorChange={(id, pt) => {
              if (id === "v1") setCh2V1(pt);
              if (id === "v2") setCh2V2(pt);
            }}
          >
            {/* Parallelogram for determinant area visualization */}
            <g style={{ opacity: 0.15, fill: isCh2Independent ? "#10b981" : "#f43f5e", transition: "fill 0.3s" }}>
              <polygon
                points={`
                  300,180
                  ${300 + ch2V1.x * 36},${180 - ch2V1.y * 36}
                  ${300 + (ch2V1.x + ch2V2.x) * 36},${180 - (ch2V1.y + ch2V2.y) * 36}
                  ${300 + ch2V2.x * 36},${180 - ch2V2.y * 36}
                `}
              />
            </g>
          </VectorCanvas>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Status Indicator:</span>
            <span className="text-xs text-foreground-muted font-mono mt-1">
              Det = ({ch2V1.x.toFixed(1)})( {ch2V2.y.toFixed(1)} ) - ({ch2V2.x.toFixed(1)})( {ch2V1.y.toFixed(1)} ) = {ch2Det.toFixed(2)}
            </span>
          </div>
          <div>
            {isCh2Independent ? (
              <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg border border-emerald-500/30">
                Independent ✅
              </span>
            ) : (
              <span className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold rounded-lg border border-rose-500/30">
                Dependent ❌
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-4">
        <strong className="text-accent">💡 Key Takeaway:</strong> Independent vectors provide <strong>new directions of information</strong> that cannot be synthesized from existing vectors.
      </div>
    </section>
  );
}
