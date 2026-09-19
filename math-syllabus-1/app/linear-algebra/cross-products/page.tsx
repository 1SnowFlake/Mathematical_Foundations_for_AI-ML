"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;

function toSvg(x: number, y: number) {
  return { x: OX + x * SCALE, y: OY - y * SCALE };
}

function toGrid(svgX: number, svgY: number, snap = 0.5) {
  return {
    x: Math.round(((svgX - OX) / SCALE) / snap) * snap,
    y: Math.round(((-(svgY - OY)) / SCALE) / snap) * snap,
  };
}

const LIMIT = 4.5;

function clamp(n: number) {
  return Math.max(-LIMIT, Math.min(LIMIT, n));
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto"
    >
      <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
    </marker>
  );
}

function GridLines() {
  const lines = [];

  for (let i = -5; i <= 5; i++) {
    const vp = toSvg(i, 0);
    const hp = toSvg(0, i);
    const bold = i === 0;

    lines.push(
      <line
        key={`v${i}`}
        x1={vp.x}
        y1={0}
        x2={vp.x}
        y2={H}
        stroke={
          bold
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.07)"
        }
        strokeWidth={bold ? 1.5 : 1}
      />,
      <line
        key={`h${i}`}
        x1={0}
        y1={hp.y}
        x2={W}
        y2={hp.y}
        stroke={
          bold
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.07)"
        }
        strokeWidth={bold ? 1.5 : 1}
      />
    );

    if (i !== 0) {
      lines.push(
        <text
          key={`lv${i}`}
          x={vp.x}
          y={OY + 16}
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          textAnchor="middle"
        >
          {i}
        </text>,
        <text
          key={`lh${i}`}
          x={OX - 14}
          y={hp.y + 3.5}
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          textAnchor="middle"
        >
          {i}
        </text>
      );
    }
  }

  return <>{lines}</>;
}

function DragHandle({
  x,
  y,
  color,
  svgRef,
  onDrag,
}: {
  x: number;
  y: number;
  color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);
  const p = toSvg(x, y);

  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={10}
      fill={color}
      fillOpacity={0.9}
      stroke="white"
      strokeWidth={2}
      style={{
        cursor: "grab",
        filter: `drop-shadow(0 0 6px ${color})`,
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !svgRef.current) return;

        const r = svgRef.current.getBoundingClientRect();
        const g = toGrid(
          e.clientX - r.left,
          e.clientY - r.top
        );

        onDrag(clamp(g.x), clamp(g.y));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}

interface Vec2 {
  x: number;
  y: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function magnitude(v: Vec3) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function fmt(n: number) {
  const rounded = Math.abs(n) < 0.005 ? 0 : Number(n.toFixed(2));
  return rounded.toString();
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Linear Algebra · Topic 5
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
          Cross Products & Linear Transformations
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine you are building a 3D game. Two directions tell you where a
          character&apos;s sword points and which way the ground slopes — but
          you need a third direction that sticks straight out, like a perfect
          invisible arrow. The <strong className="text-foreground">cross product</strong>{" "}
          creates exactly that arrow.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          The really cool part is that cross products are not just a geometry
          trick. When you stretch, rotate, or flip space with a{" "}
          <strong className="text-foreground">linear transformation</strong>{" "}
          (a rule that consistently transforms vectors), the cross product
          changes in a beautifully predictable way.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI, these ideas are useful for 3D computer vision, robotics, graphics,
          coordinate frames, pose estimation, and models that reason about
          objects and surfaces in three dimensions.
        </p>
      </div>
    </header>
  );
}

function FirstIntuitionWidget() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [a, setA] = useState<Vec2>({ x: 3, y: 1.5 });
  const [b, setB] = useState<Vec2>({ x: 1, y: 3 });

  const signedArea = a.x * b.y - a.y * b.x;
  const area = Math.abs(signedArea);
  const orientation = signedArea >= 0 ? "Counter-clockwise" : "Clockwise";

  const ap = toSvg(a.x, a.y);
  const bp = toSvg(b.x, b.y);

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          1 · First intuition — a vector hiding outside the screen
        </div>

        <h2 className="text-2xl font-bold">
          Two directions can secretly create a third direction
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          Think about holding two pencils on a desk. The cross product measures
          the parallelogram they make and points <em>perpendicular</em> to that
          surface — meaning straight out of the surface at a 90° angle.
        </p>
      </div>

      <MathBlock tex="\mathbf{a}\times\mathbf{b}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[58%]">
          <div className="relative">
            <svg
              ref={svgRef}
              width={W}
              height={H}
              className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
              style={{ maxWidth: "100%" }}
            >
              <defs>
                <ArrowMarker id="first-a" color="#ff5f9e" />
                <ArrowMarker id="first-b" color="#22e5c9" />
              </defs>

              <GridLines />

              <polygon
                points={`${OX},${OY} ${ap.x},${ap.y} ${ap.x + (bp.x - OX)},${ap.y + (bp.y - OY)} ${bp.x},${bp.y}`}
                fill="#a78bfa"
                fillOpacity="0.14"
                stroke="#a78bfa"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              <line
                x1={OX}
                y1={OY}
                x2={ap.x}
                y2={ap.y}
                stroke="#ff5f9e"
                strokeWidth="4"
                markerEnd="url(#first-a)"
              />

              <line
                x1={OX}
                y1={OY}
                x2={bp.x}
                y2={bp.y}
                stroke="#22e5c9"
                strokeWidth="4"
                markerEnd="url(#first-b)"
              />

              <text
                x={ap.x + 12}
                y={ap.y - 10}
                fill="#ff5f9e"
                fontSize="14"
                fontWeight="bold"
              >
                a
              </text>

              <text
                x={bp.x + 12}
                y={bp.y - 10}
                fill="#22e5c9"
                fontSize="14"
                fontWeight="bold"
              >
                b
              </text>

              <DragHandle
                x={a.x}
                y={a.y}
                color="#ff5f9e"
                svgRef={svgRef}
                onDrag={(x, y) => setA({ x, y })}
              />

              <DragHandle
                x={b.x}
                y={b.y}
                color="#22e5c9"
                svgRef={svgRef}
                onDrag={(x, y) => setB({ x, y })}
              />
            </svg>

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              ✦ Drag the pink or teal dot
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 space-y-5">
          <div>
            <h3 className="text-lg font-bold">What are you actually seeing?</h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              In this 2D preview, we cannot draw the cross-product arrow
              directly because it points out of or into your screen. Instead,
              the shaded parallelogram reveals its size.
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Formula
            </div>

            <MathBlock tex="\left|\mathbf{a}\times\mathbf{b}\right|=|a_xb_y-a_yb_x|" />
          </div>

          <div className="font-mono text-sm bg-background/60 border border-border rounded-xl p-4 space-y-2">
            <div>
              <span className="text-[#ff5f9e]">a</span> =
              [{fmt(a.x)}, {fmt(a.y)}]
            </div>

            <div>
              <span className="text-[#22e5c9]">b</span> =
              [{fmt(b.x)}, {fmt(b.y)}]
            </div>

            <div>
              determinant ={" "}
              <span
                className={
                  signedArea >= 0
                    ? "text-[#34d399]"
                    : "text-[#fb923c]"
                }
              >
                {fmt(signedArea)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Area",
                value: fmt(area),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Orientation",
                value: signedArea >= 0 ? "↺" : "↻",
                color:
                  signedArea >= 0
                    ? "border-[#22e5c9] text-[#22e5c9]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Notice how moving either vector changes <strong className="text-foreground">two
              things at once</strong>: the shape of the parallelogram and its
            numerical area. Try pushing one vector close to the other — what
            happens when they become parallel?
          </p>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${orientation === "Counter-clockwise"
              ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
              : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
              }`}
          >
            {orientation === "Counter-clockwise"
              ? "✓ Notice how the positive area means a × b points out of the screen."
              : "⚠️ Warning — the order flipped, so the cross-product direction flipped too."}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanicsWidget() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [a, setA] = useState<Vec2>({ x: 3, y: 1 });
  const [b, setB] = useState<Vec2>({ x: 1, y: 3 });

  const ab = a.x * b.y - a.y * b.x;
  const ba = b.x * a.y - b.y * a.x;
  const reversed = ab < 0;

  const ap = toSvg(a.x, a.y);
  const bp = toSvg(b.x, b.y);

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">
          2 · Deeper mechanics — order changes everything
        </div>

        <h2 className="text-2xl font-bold">
          Swapping the vectors flips the answer
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          Imagine turning a steering wheel. Turning clockwise is not the same
          as turning counter-clockwise. Cross products have that same sense of
          direction: changing the order reverses the resulting arrow.
        </p>
      </div>

      <MathBlock tex="\mathbf{a}\times\mathbf{b}=-(\mathbf{b}\times\mathbf{a})" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[58%]">
          <div className="relative">
            <svg
              ref={svgRef}
              width={W}
              height={H}
              className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
              style={{ maxWidth: "100%" }}
            >
              <defs>
                <ArrowMarker id="deep-a" color="#ff5f9e" />
                <ArrowMarker id="deep-b" color="#22e5c9" />
              </defs>

              <GridLines />

              <line
                x1={OX}
                y1={OY}
                x2={ap.x}
                y2={ap.y}
                stroke="#ff5f9e"
                strokeWidth="4"
                markerEnd="url(#deep-a)"
              />

              <line
                x1={OX}
                y1={OY}
                x2={bp.x}
                y2={bp.y}
                stroke="#22e5c9"
                strokeWidth="4"
                markerEnd="url(#deep-b)"
              />

              <path
                d={`M ${OX + 35} ${OY} A 35 35 0 ${ab >= 0 ? 0 : 1
                  } ${ab >= 0 ? 0 : 1} ${OX} ${OY - 35}`}
                fill="none"
                stroke={ab >= 0 ? "#22e5c9" : "#fb923c"}
                strokeWidth="3"
                strokeDasharray="5 4"
              />

              <DragHandle
                x={a.x}
                y={a.y}
                color="#ff5f9e"
                svgRef={svgRef}
                onDrag={(x, y) => setA({ x, y })}
              />

              <DragHandle
                x={b.x}
                y={b.y}
                color="#22e5c9"
                svgRef={svgRef}
                onDrag={(x, y) => setB({ x, y })}
              />

              <text
                x={OX + 45}
                y={OY - 42}
                fill={ab >= 0 ? "#22e5c9" : "#fb923c"}
                fontSize="12"
                fontWeight="bold"
              >
                {ab >= 0 ? "a → b" : "flip!"}
              </text>
            </svg>

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              ✦ Drag both vectors and try crossing through zero
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 space-y-5">
          <h3 className="text-lg font-bold">The anti-commutative superpower</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Most beginners expect multiplication to work the same way in either
            order. But cross products are deliberately different.
            <strong className="text-foreground"> a × b</strong> and{" "}
            <strong className="text-foreground">b × a</strong> have equal size
            but opposite directions.
          </p>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Live comparison
            </div>

            <div className="font-mono text-sm space-y-3">
              <div>
                <span className="text-[#ff5f9e]">a × b</span> =
                <span
                  className={
                    ab >= 0
                      ? " ml-2 text-[#34d399]"
                      : " ml-2 text-[#fb923c]"
                  }
                >
                  {fmt(ab)}k
                </span>
              </div>

              <div>
                <span className="text-[#22e5c9]">b × a</span> =
                <span
                  className={
                    ba >= 0
                      ? " ml-2 text-[#34d399]"
                      : " ml-2 text-[#fb923c]"
                  }
                >
                  {fmt(ba)}k
                </span>
              </div>
            </div>
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${!reversed
              ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
              : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
              }`}
          >
            {!reversed
              ? "✓ Notice how a positive orientation points one way through the surface."
              : "⚠️ Warning — you crossed the orientation boundary, so the normal direction flipped."}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "a × b",
                value: `${fmt(ab)}k`,
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "b × a",
                value: `${fmt(ba)}k`,
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingWidget() {
  const [ax, setAx] = useState(2);
  const [ay, setAy] = useState(1);
  const [az, setAz] = useState(0);
  const [scale, setScale] = useState(1);

  const b: Vec3 = {
    x: 1 * scale,
    y: 2 * scale,
    z: 3 * scale,
  };

  const a: Vec3 = { x: ax, y: ay, z: az };
  const c = cross(a, b);

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          3 · Number crunching lab
        </div>

        <h2 className="text-2xl font-bold">
          Calculate a real 3D cross product
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          This is where the invisible third direction becomes a real list of
          three numbers. Think of it like combining two joystick directions to
          discover which way is perfectly sideways to both.
        </p>
      </div>

      <MathBlock tex="\mathbf{a}\times\mathbf{b}=\begin{bmatrix}a_yb_z-a_zb_y\\a_zb_x-a_xb_z\\a_xb_y-a_yb_x\end{bmatrix}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[55%] space-y-5">
          <div className="relative bg-[#0a0a0c] rounded-xl border border-border p-6 min-h-[350px] flex flex-col justify-center">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 480 350"
                className="w-full h-full"
              >
                <line
                  x1="50"
                  y1="300"
                  x2="240"
                  y2="100"
                  stroke="#ff5f9e"
                  strokeWidth="4"
                />
                <line
                  x1="50"
                  y1="300"
                  x2="410"
                  y2="250"
                  stroke="#22e5c9"
                  strokeWidth="4"
                />
                <line
                  x1="50"
                  y1="300"
                  x2="170"
                  y2="40"
                  stroke="#ffd166"
                  strokeWidth="4"
                  strokeDasharray="8 5"
                />
              </svg>
            </div>

            <div className="relative z-10 font-mono text-sm space-y-5">
              <div>
                <span className="text-[#ff5f9e]">a</span> =
                <span className="ml-3">
                  [{fmt(a.x)}, {fmt(a.y)}, {fmt(a.z)}]
                </span>
              </div>

              <div>
                <span className="text-[#22e5c9]">b</span> =
                <span className="ml-3">
                  [{fmt(b.x)}, {fmt(b.y)}, {fmt(b.z)}]
                </span>
              </div>

              <div className="border-t border-border pt-4">
                <span className="text-[#ffd166]">a × b</span> =
                <span className="ml-3">
                  [
                  <span
                    className={
                      c.x >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                    }
                  >
                    {fmt(c.x)}
                  </span>
                  ,{" "}
                  <span
                    className={
                      c.y >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                    }
                  >
                    {fmt(c.y)}
                  </span>
                  ,{" "}
                  <span
                    className={
                      c.z >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                    }
                  >
                    {fmt(c.z)}
                  </span>
                  ]
                </span>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              ✦ Move the sliders to reshape vector a
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "|a × b|",
                value: fmt(magnitude(c)),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "a · (a × b)",
                value: fmt(dot(a, c)),
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:flex-1 space-y-5">
          <h3 className="text-lg font-bold">Control the ingredients</h3>

          {[
            {
              label: "aₓ",
              value: ax,
              setter: setAx,
              color: "#ff5f9e",
            },
            {
              label: "aᵧ",
              value: ay,
              setter: setAy,
              color: "#22e5c9",
            },
            {
              label: "a_z",
              value: az,
              setter: setAz,
              color: "#ffd166",
            },
          ].map((control) => (
            <div key={control.label}>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span>{control.label}</span>
                <span style={{ color: control.color }}>
                  {fmt(control.value)}
                </span>
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={control.value}
                onChange={(e) =>
                  control.setter(Number(e.target.value))
                }
                className="w-full accent-[#a78bfa]"
              />
            </div>
          ))}

          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span>Scale vector b</span>
              <span className="text-[#a78bfa]">{fmt(scale)}×</span>
            </div>

            <input
              type="range"
              min="-2"
              max="2"
              step="0.25"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-[#a78bfa]"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Formula
            </div>

            <MathBlock tex="\mathbf{a}\cdot(\mathbf{a}\times\mathbf{b})=0" />
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Notice the second stat chip. It should stay close to{" "}
            <strong className="text-foreground">zero</strong>. That is proof
            that the cross product is perpendicular to vector a. Try making a
            component negative — the output can flip direction instantly.
          </p>
        </div>
      </div>
    </section>
  );
}

function LinearTransformationWidget() {
  const [a, setA] = useState(1.4);
  const [b, setB] = useState(0.4);
  const [c, setC] = useState(-0.3);
  const [d, setD] = useState(1.2);

  const tx = (x: number, y: number) => ({ x: a * x + b * y, y: c * x + d * y });
  const vx = tx(2.2, 0.8);
  const vy = tx(0.5, 1.8);
  const det = a * d - b * c;

  const sx = (x: number) => 240 + x * 55;
  const sy = (y: number) => 210 - y * 55;

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          4 · Linear transformations
        </div>
        <h2 className="text-2xl font-bold">Transform space, then watch the cross-product geometry follow</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          A linear transformation is represented by a matrix. It sends every vector
          consistently to a new vector. The determinant tells us how oriented area
          scales in 2D; in 3D, the same idea controls volume scaling and interacts
          with cross products and surface normals.
        </p>
      </div>

      <MathBlock tex="T(\\mathbf{x})=A\\mathbf{x},\\qquad A=\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix},\\qquad \\det(A)=ad-bc" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[58%]">
          <svg width={480} height={420} viewBox="0 0 480 420" className="w-full rounded-xl bg-[#0a0a0c]">
            <defs>
              <ArrowMarker id="transform-x" color="#ff5f9e" />
              <ArrowMarker id="transform-y" color="#22e5c9" />
            </defs>
            <line x1="0" y1="210" x2="480" y2="210" stroke="rgba(255,255,255,0.12)" />
            <line x1="240" y1="0" x2="240" y2="420" stroke="rgba(255,255,255,0.12)" />
            <line x1={sx(0)} y1={sy(0)} x2={sx(vx.x)} y2={sy(vx.y)} stroke="#ff5f9e" strokeWidth="5" markerEnd="url(#transform-x)" />
            <line x1={sx(0)} y1={sy(0)} x2={sx(vy.x)} y2={sy(vy.y)} stroke="#22e5c9" strokeWidth="5" markerEnd="url(#transform-y)" />
            <text x="254" y="230" fill="rgba(255,255,255,0.4)" fontSize="11">origin</text>
            <text x={sx(vx.x) + 10} y={sy(vx.y) - 10} fill="#ff5f9e" fontSize="14" fontWeight="bold">T(v)</text>
            <text x={sx(vy.x) + 10} y={sy(vy.y) - 10} fill="#22e5c9" fontSize="14" fontWeight="bold">T(w)</text>
          </svg>
        </div>

        <div className="w-full lg:flex-1 space-y-4">
          <h3 className="text-lg font-bold">Matrix controls</h3>
          {[['a', a, setA], ['b', b, setB], ['c', c, setC], ['d', d, setD]].map(([label, value, setter]) => (
            <label key={String(label)} className="block text-xs font-mono text-foreground-muted">
              {String(label)} = {Number(value).toFixed(1)}
              <input
                type="range" min="-2" max="2" step="0.1" value={Number(value)}
                onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#ffd166] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">det(A)</div>
              <div className="text-2xl font-bold font-mono mt-1">{det.toFixed(2)}</div>
            </div>
            <div className="border border-[#a78bfa] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">Area scale</div>
              <div className="text-2xl font-bold font-mono mt-1">{Math.abs(det).toFixed(2)}×</div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">
            If det(A) is negative, orientation flips. If it is zero, the transformation
            collapses an area into a lower-dimensional shape and loses invertibility.
          </p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpaceWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [vector, setVector] = useState<Vec3>({
    x: 2,
    y: 2,
    z: 1,
  });

  const vectorRef = useRef(vector);

  useEffect(() => {
    vectorRef.current = vector;
  }, [vector]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / 420,
      0.1,
      100
    );

    camera.position.set(6, 6, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, 420);

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    const grid = new THREE.GridHelper(
      10,
      10,
      0x303040,
      0x20202a
    );

    scene.add(grid);

    const xAxis = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0xff5f9e,
      0.25,
      0.15
    );

    const yAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0x22e5c9,
      0.25,
      0.15
    );

    const zAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0xffd166,
      0.25,
      0.15
    );

    scene.add(xAxis, yAxis, zAxis);

    const mainArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0xa78bfa,
      0.3,
      0.18
    );

    scene.add(mainArrow);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
      })
    );

    scene.add(sphere);

    let animationFrame = 0;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      const v = vectorRef.current;

      const tv = new THREE.Vector3(v.x, v.y, v.z);
      const len = Math.max(0.001, tv.length());

      mainArrow.setDirection(tv.clone().normalize());
      mainArrow.setLength(len, 0.3, 0.18);

      sphere.position.copy(tv);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container.clientWidth) return;

      camera.aspect = container.clientWidth / 420;
      camera.updateProjectionMatrix();

      renderer.setSize(container.clientWidth, 420);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);

      controls.dispose();

      renderer.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const mag = magnitude(vector);

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          5 · 3D space
        </div>

        <h2 className="text-2xl font-bold">
          Leave the screen and enter real 3D space
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          A flat screen makes cross products feel weird because the answer often
          points <em>through</em> the screen. In 3D, you can finally orbit
          around the vector and see why perpendicular directions matter.
        </p>
      </div>

      <MathBlock tex="\mathbf{n}=\mathbf{a}\times\mathbf{b}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[62%]">
          <div className="relative rounded-xl overflow-hidden border border-border">
            <div ref={containerRef} className="w-full min-h-[420px]" />

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              🖱️ Drag to orbit · Scroll to zoom
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 space-y-5">
          <h3 className="text-lg font-bold">Move through three dimensions</h3>

          {[
            {
              label: "X-axis",
              key: "x" as const,
              color: "#ff5f9e",
            },
            {
              label: "Y-axis",
              key: "y" as const,
              color: "#22e5c9",
            },
            {
              label: "Z-axis",
              key: "z" as const,
              color: "#ffd166",
            },
          ].map((axis) => (
            <div key={axis.key}>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span>{axis.label}</span>
                <span style={{ color: axis.color }}>
                  {fmt(vector[axis.key])}
                </span>
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.25"
                value={vector[axis.key]}
                onChange={(e) =>
                  setVector((prev) => ({
                    ...prev,
                    [axis.key]: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#a78bfa]"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">
              Column vector
            </div>

            <div className="font-mono text-lg leading-relaxed">
              <div className="text-[#ff5f9e]">[ {fmt(vector.x)} ]</div>
              <div className="text-[#22e5c9]">[ {fmt(vector.y)} ]</div>
              <div className="text-[#ffd166]">[ {fmt(vector.z)} ]</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Magnitude",
                value: fmt(mag),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Z direction",
                value: vector.z >= 0 ? "UP ↑" : "DOWN ↓",
                color:
                  vector.z >= 0
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Notice how the arrow and magnitude update together. Try pushing an
            axis past zero — a negative coordinate sends the vector through the
            opposite side of space.
          </p>
        </div>
      </div>
    </section>
  );
}

function ClassicAIWidget() {
  const [px, setPx] = useState(1.5);
  const [py, setPy] = useState(1);
  const [pz, setPz] = useState(2);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(1);
  const [cameraZ, setCameraZ] = useState(0);

  const point: Vec3 = { x: px, y: py, z: pz };
  const cameraDirection: Vec3 = {
    x: cameraX,
    y: cameraY,
    z: cameraZ,
  };

  const surfaceNormal = cross(point, cameraDirection);
  const output = magnitude(surfaceNormal);
  const threshold = 1.5;

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">
          6 · AI use — 3D computer vision
        </div>

        <h2 className="text-2xl font-bold">
          You know how phones understand which way a face is pointing?
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2 max-w-3xl">
          Here&apos;s part of the geometry behind it. Computer vision systems
          work with directions and surfaces. A cross product can generate a{" "}
          <strong className="text-foreground">surface normal</strong> — a
          vector pointing straight out from a surface.
        </p>
      </div>

      <MathBlock tex="\mathbf{n}=\mathbf{p}\times\mathbf{d}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-[58%]">
          <div className="relative bg-[#0a0a0c] rounded-xl border border-border min-h-[390px] p-6">
            <svg
              width="480"
              height="350"
              viewBox="0 0 480 350"
              className="w-full"
            >
              <defs>
                <ArrowMarker id="vision-p" color="#ff5f9e" />
                <ArrowMarker id="vision-d" color="#22e5c9" />
                <ArrowMarker id="vision-n" color="#6366f1" />
              </defs>

              <line
                x1="90"
                y1="280"
                x2={90 + px * 55}
                y2={280 - py * 55}
                stroke="#ff5f9e"
                strokeWidth="5"
                markerEnd="url(#vision-p)"
              />

              <line
                x1="90"
                y1="280"
                x2={90 + cameraX * 70 + 100}
                y2={280 - cameraY * 70 - 40}
                stroke="#22e5c9"
                strokeWidth="5"
                markerEnd="url(#vision-d)"
              />

              <line
                x1="90"
                y1="280"
                x2={90 + surfaceNormal.x * 30}
                y2={280 - surfaceNormal.y * 30 - surfaceNormal.z * 15}
                stroke="#6366f1"
                strokeWidth="5"
                markerEnd="url(#vision-n)"
              />

              <circle
                cx="90"
                cy="280"
                r="7"
                fill="#ffd166"
              />

              <text
                x="105"
                y="270"
                fill="#ffd166"
                fontSize="12"
                fontWeight="bold"
              >
                camera origin
              </text>

              <text
                x="70"
                y="55"
                fill="#6366f1"
                fontSize="15"
                fontWeight="bold"
              >
                Surface normal
              </text>
            </svg>

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              ✦ Move the sliders to change the camera geometry
            </div>
          </div>

          <div className="mt-4 text-4xl font-extrabold font-mono text-[#6366f1]">
            {fmt(output)}
          </div>

          <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
            Surface-normal strength
          </div>
        </div>

        <div className="w-full lg:flex-1 space-y-4">
          <h3 className="text-lg font-bold">Mini vision simulator</h3>

          {[
            ["Point X", px, setPx],
            ["Point Y", py, setPy],
            ["Point Z", pz, setPz],
            ["Camera X", cameraX, setCameraX],
            ["Camera Y", cameraY, setCameraY],
            ["Camera Z", cameraZ, setCameraZ],
          ].map(([label, value, setter]) => (
            <div key={label as string}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>{label as string}</span>
                <span className="text-[#a78bfa]">
                  {fmt(value as number)}
                </span>
              </div>

              <input
                type="range"
                min="-2"
                max="2"
                step="0.25"
                value={value as number}
                onChange={(e) =>
                  (setter as React.Dispatch<
                    React.SetStateAction<number>
                  >)(Number(e.target.value))
                }
                className="w-full accent-[#6366f1]"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Formula
            </div>

            <MathBlock tex="\|\mathbf{n}\|=\|\mathbf{p}\times\mathbf{d}\|" />
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${output > threshold
              ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
              : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
              }`}
          >
            {output > threshold
              ? "✓ Model detects a strong surface direction — prediction: YES"
              : "✗ Below threshold — the surface direction is weak"}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is literally the kind of geometry used inside{" "}
            <strong className="text-foreground">3D computer vision pipelines</strong>{" "}
            when software reconstructs surfaces from camera data, tracks object
            orientation, or estimates how something is positioned in space.
          </p>
        </div>
      </div>
    </section>
  );
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);

  return exps.map((v) => v / sum);
}

function ConceptMapWidget() {
  const nodes = [
    {
      label: "1. Cross Product",
      desc: "Two vectors create a perpendicular direction.",
      color: "#ffd166",
    },
    {
      label: "2. Area",
      desc: "Its magnitude measures parallelogram area.",
      color: "#ff5f9e",
    },
    {
      label: "3. Orientation",
      desc: "Changing vector order flips the direction.",
      color: "#22e5c9",
    },
    {
      label: "4. 3D Normal",
      desc: "The result becomes a surface-facing vector.",
      color: "#a78bfa",
    },
    {
      label: "5. 3D Space",
      desc: "Normals and directions become visible in three dimensions.",
      color: "#a78bfa",
    },
    {
      label: "6. AI Vision & Robotics",
      desc: "Normals and coordinate frames help machines understand 3D scenes.",
      color: "#6366f1",
    },
    {
      label: "7. AI Geometry",
      desc: "Transformations move vectors while preserving linear structure.",
      color: "#fb923c",
    },
  ];

  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">
          7 · Concept map
        </div>

        <h2 className="text-2xl font-bold">
          The whole journey in one map
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-2">
          Start with a simple geometry trick, then follow it all the way into
          AI systems that understand three-dimensional worlds.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default"
              style={{ borderColor: n.color + "55" }}
            >
              <div
                className="text-xs font-bold font-mono"
                style={{ color: n.color }}
              >
                {n.label}
              </div>

              <div className="text-[10px] text-foreground-muted leading-relaxed">
                {n.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterWidget() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically, the cross product is like a 3D cheat code: give it two
        directions, and it finds the one direction that is perfectly sideways
        to both — which is insanely useful for understanding how space itself
        gets transformed — and why that matters when AI has to reason about 3D space.
      </p>

      <Link
        href="/linear-algebra"
        className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all"
      >
        ← Linear Algebra
      </Link>
    </footer>
  );
}

export default function CrossProductsPage() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
      </div>

      <HeroWidget />

      <FirstIntuitionWidget />

      <DeeperMechanicsWidget />

      <NumberCrunchingWidget />

      <LinearTransformationWidget />

      <ThreeDSpaceWidget />

      <ClassicAIWidget />

      <ConceptMapWidget />

      <FooterWidget />
    </div>
  );
}