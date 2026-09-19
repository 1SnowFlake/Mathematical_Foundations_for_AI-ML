"use client";

import { useState, useMemo } from "react";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, dot, angleBetween, computeConditionNumber, useGramSchmidt } from "./vectorMath";

export default function Chapter6() {
  const [ch6V1, setCh6V1] = useState<Vec2>({ x: 4, y: 1 });
  const [ch6V2, setCh6V2] = useState<Vec2>({ x: 3, y: 3 });

  const gs6 = useGramSchmidt(ch6V1, ch6V2);
  const ch6GS_E1 = gs6.e1;
  const ch6GS_E2 = gs6.e2;

  const ch6OrigAngle = angleBetween(ch6V1, ch6V2);
  const ch6GSAngle = gs6.angle;

  const ch6OrigCond = useMemo(() => computeConditionNumber(ch6V1, ch6V2), [ch6V1, ch6V2]);
  const ch6GSCond = useMemo(() => computeConditionNumber(ch6GS_E1, ch6GS_E2), [ch6GS_E1, ch6GS_E2]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 6 🎮
        </span>
        <h2 className="text-2xl font-bold m-0">Compare Both Worlds</h2>
      </div>

      <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
        Side-by-side comparison: Drag vectors on the left to instantly observe how Gram–Schmidt turns a skewed coordinate system into a perfectly stable, orthogonal basis.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
        <div className="widget-card m-0 flex flex-col justify-between">
          <div>
            <div className="widget-card__title text-rose-400">Original Basis</div>
            <div className="flex justify-center overflow-x-auto py-2">
              <VectorCanvas
                width={350}
                height={260}
                gridRange={5}
                vectors={[
                  { id: "v1", point: ch6V1, color: "#6366f1", draggable: true, label: "v₁" },
                  { id: "v2", point: ch6V2, color: "#ec4899", draggable: true, label: "v₂" },
                ]}
                onVectorChange={(id, pt) => {
                  if (id === "v1") setCh6V1(pt);
                  if (id === "v2") setCh6V2(pt);
                }}
              />
            </div>
          </div>
          <div className="mt-3 p-3 bg-surface border border-border rounded-lg text-xs space-y-1 font-mono">
            <div>Angle: {ch6OrigAngle.toFixed(1)}°</div>
            <div>Condition Number: {ch6OrigCond.toFixed(2)}</div>
            <div>Dot Product: {dot(ch6V1, ch6V2).toFixed(2)}</div>
          </div>
        </div>

        <div className="widget-card m-0 flex flex-col justify-between">
          <div>
            <div className="widget-card__title text-emerald-400">Gram–Schmidt Basis</div>
            <div className="flex justify-center overflow-x-auto py-2">
              <VectorCanvas
                width={350}
                height={260}
                gridRange={5}
                vectors={[
                  { id: "e1", point: ch6GS_E1, color: "#6366f1", draggable: false, label: "e₁" },
                  { id: "e2", point: ch6GS_E2, color: "#10b981", draggable: false, label: "e₂" },
                ]}
              />
            </div>
          </div>
          <div className="mt-3 p-3 bg-surface border border-border rounded-lg text-xs space-y-1 font-mono">
            <div>Angle: {ch6GSAngle.toFixed(1)}° (Always 90°)</div>
            <div>Condition Number: {ch6GSCond.toFixed(2)} (Perfect)</div>
            <div>Dot Product: {dot(ch6GS_E1, ch6GS_E2).toFixed(4)} (Zero)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
