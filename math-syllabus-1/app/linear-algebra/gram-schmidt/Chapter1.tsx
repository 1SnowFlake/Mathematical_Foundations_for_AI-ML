"use client";

import { useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, mag } from "./vectorMath";

export default function Chapter1() {
  const [ch1Pos, setCh1Pos] = useState<Vec2>({ x: 3, y: 2 });
  const [ch1Origin, setCh1Origin] = useState<Vec2>({ x: -2, y: -1 });
  const [ch1Mode, setCh1Mode] = useState<"scalar" | "arrow">("arrow");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 1
        </span>
        <h2 className="text-2xl font-bold m-0">Why Did We Invent Vectors?</h2>
      </div>

      <blockquote className="border-l-4 border-accent pl-4 italic text-foreground-muted my-2">
        Question: Why do we even need vectors?
      </blockquote>

      <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
        Before vectors, numbers were just <em>scalars</em>—single values representing quantity, temperature, or mass.
        However, real-world phenomena like wind velocity, robotic motion, or forces cannot be fully described by a single scalar. They require both a <strong>magnitude</strong> and a <strong>direction</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-accent">●</span> Core Concepts
          </h4>
          <ul className="text-sm text-foreground-muted space-y-1.5 list-disc pl-4">
            <li><strong>Scalars vs Vectors:</strong> Magnitude alone vs Magnitude + Direction.</li>
            <li><strong>Position vs Displacement:</strong> A vector represents <em>change in location</em>, independent of origin.</li>
            <li><strong>Coordinate Systems:</strong> Standard axes (Euclidean space <MathBlock tex="\mathbb{R}^n" inline />) to ground mathematical operations.</li>
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Display Mode</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setCh1Mode("scalar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  ch1Mode === "scalar" ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
                }`}
              >
                Scalar Point
              </button>
              <button
                onClick={() => setCh1Mode("arrow")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  ch1Mode === "arrow" ? "bg-accent text-white" : "bg-surface-hover text-foreground-muted"
                }`}
              >
                Vector Arrow
              </button>
            </div>
          </div>
          <div className="mt-4 text-xs text-foreground-subtle">
            Drag point <span className="font-bold text-accent">v</span> or the displacement origin handle below.
          </div>
        </div>
      </div>

      {/* Interactive Widget Chapter 1 */}
      <div className="widget-card">
        <div className="widget-card__title">Interactive: Point vs Arrow &amp; Origin Independence</div>
        <p className="text-xs text-foreground-muted mb-3">
          Notice how moving the starting point changes the position in space, but keeping the displacement identical yields the <strong>exact same vector arrow</strong>.
        </p>

        <div className="flex justify-center overflow-x-auto py-2">
          <VectorCanvas
            width={600}
            height={360}
            gridRange={5}
            vectors={[
              ...(ch1Mode === "arrow"
                ? [
                    { id: "v", point: ch1Pos, color: "#6366f1", draggable: true, label: "v" },
                    { id: "origin", point: ch1Origin, color: "#10b981", draggable: true, label: "Start" },
                  ]
                : [{ id: "v", point: ch1Pos, color: "#ec4899", draggable: true, label: "P(x,y)" }]),
            ]}
            onVectorChange={(id, pt) => {
              if (id === "v") setCh1Pos(pt);
              if (id === "origin") setCh1Origin(pt);
            }}
          >
            {/* Shifted displacement demo line */}
            {ch1Mode === "arrow" && (
              <g style={{ color: "#10b981", opacity: 0.85 }}>
                <line
                  x1={300 + ch1Origin.x * 36}
                  y1={180 - ch1Origin.y * 36}
                  x2={300 + (ch1Origin.x + ch1Pos.x) * 36}
                  y2={180 - (ch1Origin.y + ch1Pos.y) * 36}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </g>
            )}
          </VectorCanvas>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono bg-surface p-3 rounded-lg border border-border">
          <div>
            <strong>Vector Notation:</strong> <MathBlock tex={`\\vec{v} = \\begin{bmatrix} ${ch1Pos.x} \\\\ ${ch1Pos.y} \\end{bmatrix}`} inline />
          </div>
          <div>
            <strong>Magnitude:</strong> <MathBlock tex={`|\\vec{v}| = \\sqrt{${ch1Pos.x}^2 + ${ch1Pos.y}^2} = ${mag(ch1Pos).toFixed(2)}`} inline />
          </div>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-4">
        <strong className="text-accent">💡 Key Takeaway:</strong> A vector is a mathematical object representing <strong>magnitude and direction</strong>, allowing us to describe movement, forces, data features, and state transitions.
      </div>
    </section>
  );
}
