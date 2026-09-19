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
  const lines: React.ReactNode[] = [];

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

interface DragHandleProps {
  x: number;
  y: number;
  color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}

function DragHandle({
  x,
  y,
  color,
  svgRef,
  onDrag,
}: DragHandleProps) {
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
          ((e.clientX - r.left) / r.width) * W,
          ((e.clientY - r.top) / r.height) * H
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

function VectorArrow({
  x,
  y,
  color,
  markerId,
  label,
}: {
  x: number;
  y: number;
  color: string;
  markerId: string;
  label: string;
}) {
  const end = toSvg(x, y);
  const origin = toSvg(0, 0);

  return (
    <>
      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={3}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={end.x + 10}
        y={end.y - 10}
        fill={color}
        fontSize="14"
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

function NumberColor({ value }: { value: number }) {
  return (
    <span
      className={
        value >= 0
          ? "text-[#34d399] font-mono"
          : "text-[#fb923c] font-mono"
      }
    >
      {value.toFixed(1)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 0 — HERO                                                           */
/* -------------------------------------------------------------------------- */

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div
        className="inline-block text-xs font-mono uppercase tracking-widest
                   text-accent border border-accent/30 bg-accent/10
                   px-3 py-1 rounded-full mb-2"
      >
        Linear Algebra · Topic 4
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is{" "}
        <span
          className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e]
                     to-[#a78bfa] bg-clip-text text-transparent"
        >
          Cramer&apos;s Rule?
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine you&apos;re playing a game and two laser paths cross on a
          map. Where they meet is the exact location of the treasure.
          <strong className="text-foreground">
            {" "}Cramer&apos;s Rule is a mathematical way of finding that
            intersection.
          </strong>
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          The surprising part? It uses <strong className="text-foreground">
            determinants</strong> — numbers that secretly describe{" "}
          <em>areas in 2D and volumes in 3D</em>. If the area collapses to
          zero, the math tells you that something special has happened.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI and machine learning, the same idea of solving{" "}
          <MathBlock tex="A\mathbf{x}=\mathbf{b}" inline /> appears whenever
          models, optimization algorithms, and geometric transformations work
          with systems of equations.
        </p>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 1 — FIRST INTUITION                                                */
/* -------------------------------------------------------------------------- */

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [x, setX] = useState(2);
  const [y, setY] = useState(1);

  const a = { x: 2, y: 1 };
  const b = { x: 1, y: -2 };

  const determinant = a.x * b.y - a.y * b.x;
  const magnitude = Math.sqrt(x * x + y * y);

  const solutionX = x;
  const solutionY = y;

  const p1 = toSvg(a.x, a.y);
  const p2 = toSvg(b.x, b.y);
  const p3 = toSvg(a.x + b.x, a.y + b.y);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          1 · First Intuition
        </div>

        <h2 className="text-2xl font-bold">
          The intersection is just a location
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about Google Maps. A location is just a pair of numbers:
          how far left/right and how far up/down. The solution to a system
          of equations is exactly the same idea — a point hiding somewhere
          on a coordinate grid.
        </p>

        <div className="mt-4">
          <MathBlock tex="A\mathbf{x}=\mathbf{b}" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-3/5">
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
                <ArrowMarker id="first-r" color="#ffd166" />
              </defs>

              <GridLines />

              <polygon
                points={`${OX},${OY} ${p1.x},${p1.y} ${p3.x},${p3.y} ${p2.x},${p2.y}`}
                fill="#a78bfa"
                fillOpacity={0.12}
                stroke="#a78bfa"
                strokeOpacity={0.5}
                strokeWidth={1}
              />

              <VectorArrow
                x={a.x}
                y={a.y}
                color="#ff5f9e"
                markerId="first-a"
                label="a"
              />

              <VectorArrow
                x={b.x}
                y={b.y}
                color="#22e5c9"
                markerId="first-b"
                label="b"
              />

              <VectorArrow
                x={x}
                y={y}
                color="#ffd166"
                markerId="first-r"
                label="solution"
              />

              <DragHandle
                x={x}
                y={y}
                color="#ffd166"
                svgRef={svgRef}
                onDrag={(nx, ny) => {
                  setX(nx);
                  setY(ny);
                }}
              />
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Drag me! Move the yellow solution point
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "Solution X",
                value: solutionX.toFixed(1),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Distance From Origin",
                value: magnitude.toFixed(2),
                color: "border-indigo-400 text-indigo-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div
                  className="text-[10px] uppercase tracking-widest
                             text-foreground-muted"
                >
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What are you looking at?</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            The pink and green vectors create a parallelogram. The purple
            region has an area controlled by the determinant. The yellow
            point represents a possible answer.
          </p>

          <div className="bg-background border border-border rounded-xl p-4">
            <div
              className="text-[10px] font-mono text-foreground-muted
                         uppercase tracking-widest mb-2"
            >
              Live coordinate
            </div>

            <div className="font-mono text-lg space-y-2">
              <div>
                x = <NumberColor value={solutionX} />
              </div>
              <div>
                y = <NumberColor value={solutionY} />
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div
              className="text-[10px] font-mono text-foreground-muted
                         uppercase tracking-widest mb-2"
            >
              Determinant
            </div>

            <MathBlock tex="\det(A)=a_1b_2-a_2b_1" />

            <div className="font-mono text-[#a78bfa] mt-3">
              det(A) = {determinant}
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Notice how:</strong> the
            determinant is not just a random calculation. Its magnitude tells
            us how much 2D space the two vectors span.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 2 — DEEPER MECHANICS                                               */
/* -------------------------------------------------------------------------- */

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [a, setA] = useState({ x: 2, y: 1 });
  const [b, setB] = useState({ x: 1, y: 2 });

  const determinant = a.x * b.y - a.y * b.x;
  const area = Math.abs(determinant);
  const singular = Math.abs(determinant) < 0.15;

  const pa = toSvg(a.x, a.y);
  const pb = toSvg(b.x, b.y);
  const pab = toSvg(a.x + b.x, a.y + b.y);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">
          2 · Deeper Mechanics
        </div>

        <h2 className="text-2xl font-bold">
          Determinant = the space between directions
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine opening a pair of scissors. When the blades point in
          different directions, there&apos;s space between them. Close them
          until they overlap and that space disappears. A determinant behaves
          almost exactly like that.
        </p>

        <div className="mt-4">
          <MathBlock tex="\det(A)=a_1b_2-a_2b_1" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-3/5">
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

              <polygon
                points={`${OX},${OY} ${pa.x},${pa.y} ${pab.x},${pab.y} ${pb.x},${pb.y}`}
                fill={singular ? "#fb923c" : "#a78bfa"}
                fillOpacity={singular ? 0.08 : 0.2}
                stroke={singular ? "#fb923c" : "#a78bfa"}
                strokeWidth={2}
                strokeOpacity={0.8}
              />

              <VectorArrow
                x={a.x}
                y={a.y}
                color="#ff5f9e"
                markerId="deep-a"
                label="a"
              />

              <VectorArrow
                x={b.x}
                y={b.y}
                color="#22e5c9"
                markerId="deep-b"
                label="b"
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
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Drag the pink or green dot
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "Signed Determinant",
                value: determinant.toFixed(2),
                color:
                  determinant >= 0
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
              {
                label: "Geometric Area",
                value: area.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
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

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Try collapsing the area</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Drag the green vector so it points in almost the same direction as
            the pink vector. Notice how the parallelogram gets thinner.
          </p>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${!singular
                ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
                : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
              }`}
          >
            {!singular
              ? "✓ Notice how the vectors span real 2D space."
              : "⚠️ Warning — the area collapsed. The matrix is singular!"}
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">
              Current Matrix
            </div>

            <div className="font-mono text-xl leading-relaxed">
              <span className="text-[#ff5f9e]">
                [ {a.x.toFixed(1)}
              </span>{" "}
              <span className="text-[#22e5c9]">
                {b.x.toFixed(1)} ]
              </span>
              <br />
              <span className="text-[#ff5f9e]">
                [ {a.y.toFixed(1)}
              </span>{" "}
              <span className="text-[#22e5c9]">
                {b.y.toFixed(1)} ]
              </span>
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            If the determinant becomes zero, the matrix has lost a dimension.
            That means it cannot uniquely reverse a transformation — and
            Cramer&apos;s Rule cannot divide by zero.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 3 — NUMBER CRUNCHING                                               */
/* -------------------------------------------------------------------------- */

function NumberCrunchingLab() {
  const [a, setA] = useState(2);
  const [b] = useState(1);
  const [c] = useState(1);
  const [d, setD] = useState(-2);

  const determinant = a * d - b * c;
  const area = Math.abs(determinant);

  const status =
    Math.abs(determinant) < 0.1
      ? "Zero — no unique solution"
      : determinant > 0
        ? "Positive orientation"
        : "Negative orientation (flipped)";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">
          3 · Number Crunching Lab
        </div>

        <h2 className="text-2xl font-bold">
          Change one number. Watch the geometry react.
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          This is where algebra becomes surprisingly visual. Every number in a
          matrix changes the shape of the parallelogram — and the determinant
          instantly reports what happened.
        </p>

        <div className="mt-4">
          <MathBlock tex="\det(A)=ad-bc" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Matrix controls</h3>

            <label className="block text-xs font-mono text-[#ff5f9e] mb-2">
              ✦ Move the slider: a = {a.toFixed(1)}
            </label>

            <input
              type="range"
              min="-4"
              max="4"
              step="0.5"
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
              className="w-full"
            />

            <label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">
              ✦ Move the slider: d = {d.toFixed(1)}
            </label>

            <input
              type="range"
              min="-4"
              max="4"
              step="0.5"
              value={d}
              onChange={(e) => setD(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Live calculation
            </div>

            <div className="font-mono text-xl leading-loose">
              det(A) ={" "}
              <span className="text-[#ff5f9e]">({a.toFixed(1)})</span>
              <span className="text-foreground-muted"> × </span>
              <span className="text-[#22e5c9]">({d.toFixed(1)})</span>
              <span className="text-foreground-muted"> − </span>
              <span className="text-[#ffd166]">({b})</span>
              <span className="text-foreground-muted"> × </span>
              <span className="text-[#a78bfa]">({c})</span>
            </div>

            <div className="mt-4 text-4xl font-extrabold font-mono">
              <NumberColor value={determinant} />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div
            className={`border rounded-xl p-6 ${determinant > 0
                ? "border-[#34d399]/40 bg-[#34d399]/10"
                : determinant < 0
                  ? "border-[#fb923c]/40 bg-[#fb923c]/10"
                  : "border-[#ffd166]/40 bg-[#ffd166]/10"
              }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Geometry status
            </div>

            <div
              className={`font-mono font-bold mt-2 ${determinant > 0
                  ? "text-[#34d399]"
                  : determinant < 0
                    ? "text-[#fb923c]"
                    : "text-[#ffd166]"
                }`}
            >
              {status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Signed Value",
                value: determinant.toFixed(2),
                color:
                  determinant >= 0
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
              {
                label: "Area",
                value: area.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
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
            Try pushing a value past zero. What happens when the determinant
            changes sign? The parallelogram&apos;s orientation flips — like
            turning a shirt inside out.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 4 — 3D SPACE                                                       */
/* -------------------------------------------------------------------------- */

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [x, setX] = useState(2);
  const [y, setY] = useState(2);
  const [z, setZ] = useState(2);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const width = container.clientWidth;
    const height = 420;

    const camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      100
    );

    camera.position.set(6, 6, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(grid);

    const origin = new THREE.Vector3(0, 0, 0);

    const xAxis = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      origin,
      4,
      0xff5f9e
    );

    const yAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      origin,
      4,
      0x22e5c9
    );

    const zAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      origin,
      4,
      0xffd166
    );

    scene.add(xAxis, yAxis, zAxis);

    const vectorGeometry = new THREE.BufferGeometry();
    const vectorMaterial = new THREE.LineBasicMaterial({
      color: 0xa78bfa,
    });

    const vectorLine = new THREE.Line(vectorGeometry, vectorMaterial);
    scene.add(vectorLine);

    const pointGeometry = new THREE.SphereGeometry(0.14, 24, 24);

    const pointMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd166,
    });

    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);

    const updateVector = () => {
      vectorGeometry.setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);

      point.position.set(x, y, z);
    };

    updateVector();

    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);

      updateVector();

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const newWidth = container.clientWidth;

      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", onResize);

      controls.dispose();

      vectorGeometry.dispose();
      vectorMaterial.dispose();

      pointGeometry.dispose();
      pointMaterial.dispose();

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [x, y, z]);

  const magnitude = Math.sqrt(x * x + y * y + z * z);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          4 · 3D Space
        </div>

        <h2 className="text-2xl font-bold">
          In 3D, area becomes volume
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A video game character doesn&apos;t move only left and right.
          They can move forward, sideways, and sometimes upward. Add another
          dimension and the determinant&apos;s geometric meaning upgrades from
          <strong className="text-foreground"> area</strong> to{" "}
          <strong className="text-foreground">volume</strong>.
        </p>

        <div className="mt-4">
          <MathBlock tex="|\det(A)|=\text{volume of a parallelepiped}" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <div
              ref={containerRef}
              className="rounded-xl overflow-hidden"
              style={{ height: 420 }}
            />

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              🖱️ Drag to orbit · Scroll to zoom
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move through 3D space</h3>

          {[
            {
              label: "X axis",
              value: x,
              setter: setX,
              color: "#ff5f9e",
            },
            {
              label: "Y axis",
              value: y,
              setter: setY,
              color: "#22e5c9",
            },
            {
              label: "Z axis",
              value: z,
              setter: setZ,
              color: "#ffd166",
            },
          ].map((axis) => (
            <div key={axis.label}>
              <div
                className="text-xs font-mono mb-2"
                style={{ color: axis.color }}
              >
                ✦ Move {axis.label}: {axis.value.toFixed(1)}
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={axis.value}
                onChange={(e) => axis.setter(Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">
              Column vector
            </div>

            <div className="font-mono text-xl">
              <span className="text-[#a78bfa]">[</span>
              <span className="text-[#ff5f9e]">{x.toFixed(1)}</span>
              <span className="text-[#a78bfa]">]</span>
              <br />
              <span className="text-[#a78bfa]">[</span>
              <span className="text-[#22e5c9]">{y.toFixed(1)}</span>
              <span className="text-[#a78bfa]">]</span>
              <br />
              <span className="text-[#a78bfa]">[</span>
              <span className="text-[#ffd166]">{z.toFixed(1)}</span>
              <span className="text-[#a78bfa]">]</span>
            </div>
          </div>

          <div className="border border-[#6366f1]/40 bg-[#6366f1]/10 rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
              Vector magnitude
            </div>

            <div className="text-3xl font-bold font-mono text-[#6366f1] mt-1">
              {magnitude.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 5 — REAL WORLD DATA                                                */
/* -------------------------------------------------------------------------- */

function RealWorldData() {
  const [features, setFeatures] = useState({
    bedrooms: true,
    bathrooms: true,
    area: true,
    age: false,
    distance: false,
  });

  const activeFeatures = [
    features.bedrooms && { label: "Bedrooms", value: 3, color: "#ff5f9e" },
    features.bathrooms && { label: "Bathrooms", value: 2, color: "#22e5c9" },
    features.area && { label: "Area", value: 1200, color: "#ffd166" },
    features.age && { label: "Age", value: 8, color: "#a78bfa" },
    features.distance && {
      label: "Distance",
      value: 5,
      color: "#6366f1",
    },
  ].filter(Boolean) as { label: string; value: number; color: string }[];

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures((old) => ({
      ...old,
      [key]: !old[key],
    }));
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#22e5c9] uppercase tracking-widest mb-2">
          5 · Real-World Object as Data
        </div>

        <h2 className="text-2xl font-bold">
          How does a house become math?
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Instagram sees pixels. Spotify sees numbers describing music. A house
          can also become a list of numbers. In machine learning, these numbers
          are called <strong className="text-foreground">features</strong>{" "}
          (measurable pieces of information).
        </p>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Choose the information</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Turn features on and off. Notice how the mathematical vector grows
            and shrinks as we describe the house using more dimensions.
          </p>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(features) as (keyof typeof features)[]).map((key) => {
              const enabled = features[key];

              return (
                <button
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all ${enabled
                      ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                      : "border-border bg-background text-foreground-muted"
                    }`}
                >
                  {enabled ? "✓ " : "+ "}
                  {key}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Active Features",
                value: activeFeatures.length,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
              {
                label: "Dimensions",
                value: `${activeFeatures.length}D`,
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

        <div className="w-full lg:w-1/2">
          <div className="bg-[#0a0a0c] border border-border rounded-xl p-6 min-h-[320px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-5">
              House as a column vector
            </div>

            {activeFeatures.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No information yet. Turn on a feature!
              </p>
            ) : (
              <div className="font-mono space-y-3">
                {activeFeatures.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[#a78bfa]">[</span>

                    <span
                      className="text-xl font-bold"
                      style={{ color: feature.color }}
                    >
                      {feature.value}
                    </span>

                    <span className="text-[#a78bfa]">]</span>

                    <span className="text-xs text-foreground-muted">
                      ← {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border mt-6 pt-5">
              <MathBlock tex="\mathbf{x}=[x_1,x_2,\dots,x_n]^T" />

              <p className="text-xs text-foreground-muted mt-3">
                More features = more dimensions. AI systems often work with
                hundreds, thousands, or even millions of dimensions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 6 — CLASSIC AI                                                     */
/* -------------------------------------------------------------------------- */

function ClassicAI() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [x1, setX1] = useState(2);
  const [x2, setX2] = useState(1);
  const [bias, setBias] = useState(-1);

  const output = w1 * x1 + w2 * x2 + bias;
  const threshold = 0;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">
          6 · Cramer&apos;s Rule in Classic AI — Linear Classifier
        </div>

        <h2 className="text-2xl font-bold">
          How AI draws a decision boundary
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how an app can decide whether a photo contains a cat or a
          dog? One simple kind of AI combines numbers and checks which side of
          a boundary the result lands on.
        </p>

        <div className="mt-4">
          <MathBlock tex="z=\mathbf{w}^T\mathbf{x}+b" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Build a tiny AI neuron</h3>

          {[
            {
              label: "Weight w₁",
              value: w1,
              set: setW1,
              color: "#ff5f9e",
            },
            {
              label: "Weight w₂",
              value: w2,
              set: setW2,
              color: "#22e5c9",
            },
            {
              label: "Input x₁",
              value: x1,
              set: setX1,
              color: "#ffd166",
            },
            {
              label: "Input x₂",
              value: x2,
              set: setX2,
              color: "#a78bfa",
            },
            {
              label: "Bias b",
              value: bias,
              set: setBias,
              color: "#fb923c",
            },
          ].map((item) => (
            <div key={item.label}>
              <div
                className="text-xs font-mono mb-2"
                style={{ color: item.color }}
              >
                ✦ Adjust {item.label}: {item.value.toFixed(1)}
              </div>

              <input
                type="range"
                min="-3"
                max="3"
                step="0.5"
                value={item.value}
                onChange={(e) => item.set(Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Model output
            </div>

            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-3">
              {output.toFixed(2)}
            </div>

            <div className="font-mono text-xs text-foreground-muted mt-4 leading-relaxed">
              ({w1.toFixed(1)} × {x1.toFixed(1)}) +{" "}
              ({w2.toFixed(1)} × {x2.toFixed(1)}) + {bias.toFixed(1)}
            </div>
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${output > threshold
                ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
              }`}
          >
            {output > threshold
              ? "✓ Model fires — prediction: YES"
              : "✗ Below threshold — prediction: NO"}
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Where does Cramer&apos;s Rule fit?
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed">
              A linear classifier creates equations describing decision
              boundaries. When multiple equations interact, solving systems
              like <MathBlock tex="A\mathbf{x}=\mathbf{b}" inline /> helps
              locate intersections and understand where those boundaries meet.
            </p>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is literally what happens inside a{" "}
            <strong className="text-foreground">linear classifier</strong>{" "}
            millions of times when an AI combines information to make a
            prediction.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 7 — DEEP LEARNING                                                  */
/* -------------------------------------------------------------------------- */

function DeepLearningAI() {
  const [queryStrength, setQueryStrength] = useState(1);
  const [temperature, setTemperature] = useState(1);
  const [focus, setFocus] = useState(0.5);

  const rawScores = [
    0.2 * queryStrength + focus,
    0.8 * queryStrength + 0.2,
    0.4 * queryStrength + 0.6,
    1.0 * queryStrength - focus * 0.3,
  ];

  const scaled = rawScores.map((v) => v / Math.max(0.2, temperature));

  const maxScore = Math.max(...scaled);

  const exps = scaled.map((v) => Math.exp(v - maxScore));
  const sum = exps.reduce((a, b) => a + b, 0);

  const attention = exps.map((v) => v / sum);

  const maxAttention = Math.max(...attention);
  const argmax = attention.indexOf(maxAttention) + 1;

  const entropy = -attention.reduce(
    (total, p) => total + (p > 0 ? p * Math.log2(p) : 0),
    0
  );

  const matrix = [
    attention.map((v, i) => Math.max(0.05, v * (0.7 + i * 0.1))),
    attention.map((v, i) => Math.max(0.05, v * (0.8 + (3 - i) * 0.08))),
    attention.map((v, i) => Math.max(0.05, v * (0.5 + i * 0.15))),
    attention.map((v, i) => Math.max(0.05, v * (0.9 - i * 0.08))),
  ];

  const cellSize = 62;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">
          7 · Cramer&apos;s Rule in Deep Learning — Transformer Attention
        </div>

        <h2 className="text-2xl font-bold">
          The same matrix thinking powers Transformers
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          This is the kind of mathematical world behind GPT-style models.
          Every word is represented using vectors and matrices. The model then
          calculates which pieces of information should pay attention to each
          other.
        </p>

        <div className="mt-4">
          <MathBlock tex="\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-3/5">
          <h3 className="text-lg font-bold mb-3">
            Live attention heatmap
          </h3>

          <p className="text-sm text-foreground-muted leading-relaxed mb-4">
            Darker cells mean less attention. Brighter cells mean the model is
            focusing more strongly on that relationship.
          </p>

          <div className="relative overflow-auto rounded-xl bg-[#0a0a0c] p-4">
            <svg
              ref={useRef<SVGSVGElement>(null)}
              width={cellSize * 4}
              height={cellSize * 4}
              className="select-none"
              style={{ maxWidth: "100%" }}
            >
              {matrix.map((row, i) =>
                row.map((val, j) => (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={j * cellSize}
                      y={i * cellSize}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill="#6366f1"
                      fillOpacity={Math.max(0.05, Math.min(1, val))}
                      rx={3}
                    />

                    <text
                      x={j * cellSize + cellSize / 2}
                      y={i * cellSize + cellSize / 2 + 4}
                      fill="white"
                      fontSize={9}
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                ))
              )}
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Move the sliders to reshape attention
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              {
                label: "Max Attention",
                value: maxAttention.toFixed(3),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Most Focused Token",
                value: `#${argmax}`,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
              {
                label: "Entropy",
                value: entropy.toFixed(3),
                color: "border-indigo-400 text-indigo-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[9px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-lg font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-6">
          <h3 className="text-lg font-bold">Control the attention</h3>

          <div>
            <div className="text-xs font-mono text-[#ff5f9e] mb-2">
              ✦ Query strength: {queryStrength.toFixed(2)}
            </div>

            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={queryStrength}
              onChange={(e) =>
                setQueryStrength(Number(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="text-xs font-mono text-[#22e5c9] mb-2">
              ✦ Temperature: {temperature.toFixed(2)}
            </div>

            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={temperature}
              onChange={(e) =>
                setTemperature(Number(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="text-xs font-mono text-[#ffd166] mb-2">
              ✦ Focus shift: {focus.toFixed(2)}
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
              Why matrices matter
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed">
              Cramer&apos;s Rule teaches an important foundation: matrices
              describe systems, determinants reveal whether a system has
              independent directions, and matrix operations transform
              information. Transformers scale those same ideas to enormous
              collections of vectors.
            </p>
          </div>

          <p
            className="text-sm text-foreground-muted leading-relaxed
                       border-l-2 border-[#6366f1] pl-3"
          >
            <strong className="text-foreground">
              This exact operation
            </strong>{" "}
            runs billions of times when you send text to a GPT-style
            Transformer. Understanding matrices and determinants means
            understanding part of the mathematical engine behind modern AI.
          </p>

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is literally what happens inside a{" "}
            <strong className="text-foreground">
              Transformer attention layer
            </strong>{" "}
            repeatedly when a model decides which words or tokens should
            influence each other.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 8 — CONCEPT MAP                                                    */
/* -------------------------------------------------------------------------- */

function ConceptMap() {
  const nodes = [
    {
      label: "System of Equations",
      desc: "Several equations describe conditions that must all be true.",
      color: "#ffd166",
    },
    {
      label: "Matrix A",
      desc: "The coefficients are organized into a compact mathematical object.",
      color: "#ff5f9e",
    },
    {
      label: "Determinant",
      desc: "A number that measures signed area in 2D or volume in 3D.",
      color: "#22e5c9",
    },
    {
      label: "3D Volume",
      desc: "In three dimensions, a determinant measures whether space collapses.",
      color: "#a78bfa",
    },
    {
      label: "Real Data",
      desc: "Objects become feature vectors made from measurable numbers.",
      color: "#fb923c",
    },
    {
      label: "Linear Classifier",
      desc: "A foundational AI model combines features to make decisions.",
      color: "#34d399",
    },
    {
      label: "Transformer Attention",
      desc: "Matrices calculate how strongly tokens should influence each other.",
      color: "#6366f1",
    },
    {
      label: "GPT-Style Models",
      desc: "State-of-the-art language models stack these operations at huge scale.",
      color: "#ffd166",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          8 · Concept Map
        </div>

        <h2 className="text-2xl font-bold">
          The whole journey in one picture
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Start with simple equations. Organize them into matrices. Use
          determinants to understand geometry. Then follow those ideas all the
          way into modern AI.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="bg-background border rounded-xl p-3 flex flex-col gap-1
                         hover:scale-[1.03] transition-transform cursor-default"
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

/* -------------------------------------------------------------------------- */
/* SECTION 9 — FOOTER                                                         */
/* -------------------------------------------------------------------------- */

function PageFooter() {
  return (
    <footer
      className="border-t border-border pt-10 flex items-center
                 justify-between flex-wrap gap-4"
    >
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically: Cramer&apos;s Rule is a clever way of using areas and
        volumes to figure out where equations meet — and once you see that,
        determinants stop looking like random calculator torture.
      </p>

      <Link
        href="/linear-algebra"
        className="px-5 py-2.5 bg-surface border border-border
                   hover:bg-surface-hover hover:border-accent font-semibold
                   rounded-xl text-sm transition-all"
      >
        ← Linear Algebra
      </Link>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function CramersRulePage() {
  return (
    <div
      className="relative min-h-screen text-foreground px-4 md:px-10 py-16
                 max-w-5xl mx-auto overflow-x-hidden space-y-24"
    >
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[36rem] w-[36rem]
                     rounded-full bg-accent/6 blur-[160px]"
        />

        <div
          className="absolute right-0 top-1/2 h-[28rem] w-[28rem]
                     rounded-full bg-[#ffd166]/5 blur-[130px]"
        />

        <div
          className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem]
                     rounded-full bg-[#ff5f9e]/5 blur-[130px]"
        />
      </div>

      <HeroWidget />

      <FirstIntuition />

      <DeeperMechanics />

      <NumberCrunchingLab />

      <ThreeDSpace />

      <RealWorldData />

      <ClassicAI />

      <DeepLearningAI />

      <ConceptMap />

      <PageFooter />
    </div>
  );
}