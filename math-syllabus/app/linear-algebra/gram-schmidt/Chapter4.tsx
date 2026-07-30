"use client";

import { useState, useMemo } from "react";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, angleBetween, computeConditionNumber } from "./vectorMath";

export default function Chapter4() {
  const [ch4V1, setCh4V1] = useState<Vec2>({ x: 4, y: 0 });
  const [ch4V2, setCh4V2] = useState<Vec2>({ x: 3.8, y: 0.6 });

  const ch4Angle = angleBetween(ch4V1, ch4V2);
  const ch4CondNum = useMemo(() => computeConditionNumber(ch4V1, ch4V2), [ch4V1, ch4V2]);

  return (
      <section className="mb-14 border-t border-border pt-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 font-semibold rounded-md text-xs uppercase tracking-wider">
            Chapter 4 ⚠️
          </span>
          <h2 className="text-2xl font-semibold m-0">Problems Before Gram–Schmidt</h2>
        </div>

        <blockquote className="border-l-4 border-amber-500 pl-4 italic text-foreground-muted my-3">
          Question: If independent vectors are enough, why invent Gram–Schmidt?
        </blockquote>

        <p>
          Most linear algebra textbooks jump straight to the Gram–Schmidt formulas without explaining <em>why</em> standard independent vectors aren't good enough.
          The answer lies in <strong>numerical stability</strong>.
        </p>

        <div className="bg-surface border border-border rounded-xl p-4 my-4">
          <p className="m-0 text-sm">
            Two vectors can be mathematically independent even if they are separated by an angle of just <strong>1°</strong>!
            When vectors are nearly parallel, computers suffer severe rounding errors, sensitive coordinate solutions, and extreme matrix <strong>condition numbers</strong>.
          </p>
        </div>

        <div className="widget-card my-4">
          <div className="widget-card__title">Interactive: The Instability Meter</div>
          <p className="text-xs text-foreground-muted mb-3">
            Drag <span style={{ color: "#ec4899", fontStyle: "italic" }}>v₂</span> closer to <span style={{ color: "#6366f1", fontStyle: "italic" }}>v₁</span> (reducing angle near 0°). Watch the <strong>Condition Number</strong> explode!
          </p>

          <VectorCanvas
            width={600}
            height={360}
            gridRange={5}
            vectors={[
              { id: "v1", point: ch4V1, color: "#6366f1", draggable: true, label: "v₁" },
              { id: "v2", point: ch4V2, color: "#ec4899", draggable: true, label: "v₂" },
            ]}
            onVectorChange={(id, pt) => {
              if (id === "v1") setCh4V1(pt);
              if (id === "v2") setCh4V2(pt);
            }}
          />

          <div className="mt-4 p-4 bg-surface border border-border rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-foreground-subtle uppercase tracking-wider font-semibold">Angle between vectors</div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: ch4Angle < 15 ? "#ef4444" : "#10b981" }}>
                {ch4Angle.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground-subtle uppercase tracking-wider font-semibold">Condition Number κ(A)</div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: ch4CondNum > 10 ? "#ef4444" : "#10b981" }}>
                {ch4CondNum > 900 ? "∞ (Ill-conditioned)" : ch4CondNum.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
          <strong className="text-amber-500">💡 Key Takeaway:</strong> Being linearly independent isn't enough for computation. We require <strong>orthogonal (90°)</strong> and preferably <strong>orthonormal</strong> vectors.
          <p className="text-xs text-foreground-muted mt-1.5 m-0">
            <em>In plain terms:</em> computers do math with limited precision, so vectors that point in almost the same direction make calculations wobbly and unreliable.
          </p>
        </div>
      </section>
  );
}
