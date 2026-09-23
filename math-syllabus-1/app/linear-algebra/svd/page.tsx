"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;

type Vec2 = { x: number; y: number };

interface DragHandleProps {
  x: number;
  y: number;
  color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}

interface Feature {
  key: string;
  label: string;
  value: number;
  color: string;
}

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

function clampPositive(n: number, min = 0.2, max = 4) {
  return Math.max(min, Math.min(max, n));
}

function rotate(v: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: c * v.x - s * v.y,
    y: s * v.x + c * v.y,
  };
}

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function magnitude(v: Vec2) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function applySVD(
  input: Vec2,
  sigma1: number,
  sigma2: number,
  thetaU: number,
  thetaV: number
) {
  const vBasis = rotate(input, -thetaV);
  const stretched = {
    x: sigma1 * vBasis.x,
    y: sigma2 * vBasis.y,
  };
  const output = rotate(stretched, thetaU);

  return { vBasis, stretched, output };
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
  dashed = false,
}: {
  x: number;
  y: number;
  color: string;
  markerId: string;
  label: string;
  dashed?: boolean;
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
        strokeDasharray={dashed ? "7 5" : undefined}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={end.x + 10}
        y={end.y - 10}
        fill={color}
        fontSize="13"
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
      {value.toFixed(2)}
    </span>
  );
}

function ColumnVector({
  values,
  colors,
  compact = false,
}: {
  values: number[];
  colors: string[];
  compact?: boolean;
}) {
  return (
    <div className={`font-mono ${compact ? "text-base" : "text-xl"} space-y-1`}>
      <div className="text-[#a78bfa]">⎡</div>
      {values.map((value, index) => (
        <div key={`${index}-${value}`} className="flex items-center gap-2 -mt-1">
          <span className="text-[#a78bfa]">│</span>
          <span style={{ color: colors[index] ?? "#ffd166" }}>
            {value.toFixed(2)}
          </span>
          <span className="text-[#a78bfa]">│</span>
        </div>
      ))}
      <div className="-mt-1 text-[#a78bfa]">⎣</div>
    </div>
  );
}

function Matrix2x2({
  matrix,
  colorA = "#ff5f9e",
  colorB = "#22e5c9",
}: {
  matrix: number[][];
  colorA?: string;
  colorB?: string;
}) {
  return (
    <div className="font-mono text-xl leading-relaxed">
      <span className="text-[#a78bfa]">[ </span>
      <span style={{ color: colorA }}>{matrix[0][0].toFixed(2)}</span>
      <span className="text-foreground-muted">{"  "}</span>
      <span style={{ color: colorB }}>{matrix[0][1].toFixed(2)}</span>
      <span className="text-[#a78bfa]"> ]</span>
      <br />
      <span className="text-[#a78bfa]">[ </span>
      <span style={{ color: colorA }}>{matrix[1][0].toFixed(2)}</span>
      <span className="text-foreground-muted">{"  "}</span>
      <span style={{ color: colorB }}>{matrix[1][1].toFixed(2)}</span>
      <span className="text-[#a78bfa]"> ]</span>
    </div>
  );
}

function rankLabel(sigma2: number) {
  if (sigma2 < 0.3) return "Rank 1 — one important direction remains";
  return "Rank 2 — two independent directions remain";
}

function heatmapOpacity(value: number, maxValue: number) {
  if (maxValue <= 0) return 0.1;
  return Math.max(0.08, Math.min(1, Math.abs(value) / maxValue));
}

/* -------------------------------------------------------------------------- */
/* SECTION 0 — HERO                                                           */
/* -------------------------------------------------------------------------- */

function HeroWidget() {
  const [focus, setFocus] = useState(0);

  return (
    <header className="space-y-6">
      <div
        className="inline-block text-xs font-mono uppercase tracking-widest
                   text-accent border border-accent/30 bg-accent/10
                   px-3 py-1 rounded-full mb-2"
      >
        Linear Algebra · Topic 5
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is{" "}
        <span
          className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e]
                     to-[#a78bfa] bg-clip-text text-transparent"
        >
          Singular Value Decomposition?
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine a photo filter that first turns an image, then stretches it,
          then turns it again.{" "}
          <strong className="text-foreground">
            Singular Value Decomposition, or SVD, does something beautifully
            similar to a matrix.
          </strong>{" "}
          It breaks a complicated transformation into simple moves: rotate,
          stretch, rotate.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          The three pieces are <strong className="text-foreground">U</strong>{" "}
          (a rotation or reflection of the output directions),{" "}
          <strong className="text-foreground">Σ</strong> (the stretch amounts),
          and <strong className="text-foreground">V</strong> (the input
          directions). The coolest part is that the stretches are always
          non-negative, so they tell you which directions matter most.
        </p>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
                Decomposition
              </div>
              <MathBlock tex="A=U\Sigma V^T" />
            </div>

            <div className="text-xs text-foreground-muted font-mono">
              ✦ Drag the focus meter
            </div>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="w-full"
              aria-label="SVD focus meter"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="border border-[#ffd166] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Large singular value
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-[#ffd166]">
                {focus === 0 ? "hidden" : `${(1 + focus / 20).toFixed(1)}×`}
              </div>
            </div>

            <div className="border border-indigo-400 rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                AI connection
              </div>
              <div className="text-sm font-bold font-mono mt-1 text-indigo-400">
                PCA + compression
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI and machine learning, SVD helps reveal important directions,
          reduce dimensions, compress large matrices, and uncover hidden
          patterns in data such as ratings, images, and model weights.
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
  const [x, setX] = useState(2.5);
  const [y, setY] = useState(1.5);

  const sigma1 = 2.8;
  const sigma2 = 0.9;
  const thetaU = (25 * Math.PI) / 180;
  const thetaV = (-20 * Math.PI) / 180;

  const { vBasis, stretched, output } = applySVD(
    { x, y },
    sigma1,
    sigma2,
    thetaU,
    thetaV
  );

  const inputMagnitude = magnitude({ x, y });
  const outputMagnitude = magnitude(output);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          1 · First Intuition
        </div>

        <h2 className="text-2xl font-bold">
          One matrix can be split into three simple moves
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about rotating a game character, stretching its movement, and
          rotating it again. SVD says a matrix can often be understood in
          exactly that order:{" "}
          <strong className="text-foreground">change the viewpoint</strong>,
          stretch along special directions, then change viewpoint again.
        </p>

        <div className="mt-4">
          <MathBlock tex="A\mathbf{x}=U\Sigma V^T\mathbf{x}" />
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
                <ArrowMarker id="first-input" color="#ffd166" />
                <ArrowMarker id="first-v" color="#ff5f9e" />
                <ArrowMarker id="first-s" color="#22e5c9" />
                <ArrowMarker id="first-output" color="#a78bfa" />
              </defs>

              <GridLines />

              <circle
                cx={OX}
                cy={OY}
                r={SCALE}
                fill="none"
                stroke="#ffd166"
                strokeOpacity={0.16}
                strokeWidth={1}
                strokeDasharray="5 5"
              />

              <VectorArrow
                x={x}
                y={y}
                color="#ffd166"
                markerId="first-input"
                label="x"
              />

              <VectorArrow
                x={vBasis.x}
                y={vBasis.y}
                color="#ff5f9e"
                markerId="first-v"
                label="Vᵀx"
                dashed
              />

              <VectorArrow
                x={stretched.x}
                y={stretched.y}
                color="#22e5c9"
                markerId="first-s"
                label="ΣVᵀx"
                dashed
              />

              <VectorArrow
                x={output.x}
                y={output.y}
                color="#a78bfa"
                markerId="first-output"
                label="UΣVᵀx"
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
              ✦ Drag me! Move the yellow input vector
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "Input Magnitude",
                value: inputMagnitude.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Output Magnitude",
                value: outputMagnitude.toFixed(2),
                color: "border-indigo-400 text-indigo-400",
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
          <h3 className="text-lg font-bold">Follow the three moves</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Vᵀ</strong> changes the
            viewpoint.{" "}
            <strong className="text-foreground">Σ</strong> stretches the
            special directions by different amounts.{" "}
            <strong className="text-foreground">U</strong> changes the final
            viewpoint again.
          </p>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">
              Live input
            </div>
            <ColumnVector
              values={[x, y]}
              colors={["#ffd166", "#ffd166"]}
              compact
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Singular values
            </div>

            <MathBlock tex="\Sigma=\begin{bmatrix}\sigma_1&0\\0&\sigma_2\end{bmatrix}" />

            <div className="font-mono text-lg mt-3">
              <span className="text-[#ffd166]">σ₁ = {sigma1.toFixed(1)}</span>
              <br />
              <span className="text-[#22e5c9]">σ₂ = {sigma2.toFixed(1)}</span>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Live stages
            </div>

            <div className="font-mono text-sm leading-loose">
              Vᵀx ={" "}
              <NumberColor value={vBasis.x} /> ,{" "}
              <NumberColor value={vBasis.y} />
              <br />
              ΣVᵀx ={" "}
              <NumberColor value={stretched.x} /> ,{" "}
              <NumberColor value={stretched.y} />
              <br />
              UΣVᵀx ={" "}
              <NumberColor value={output.x} /> ,{" "}
              <NumberColor value={output.y} />
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Notice how:</strong> the
            original arrow can point almost anywhere, but SVD reveals two
            special directions where the transformation behaves like a clean
            stretch.
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

  const angle = (22 * Math.PI) / 180;
  const [sigma1, setSigma1] = useState(3.2);
  const [sigma2, setSigma2] = useState(1.1);

  const p1 = rotate({ x: sigma1, y: 0 }, angle);
  const p2 = rotate({ x: 0, y: sigma2 }, angle);
  const areaScale = sigma1 * sigma2;
  const nearlyCollapsed = sigma2 < 0.35;

  const handleSigma1 = useCallback(
    (x: number, y: number) => {
      const local = rotate({ x, y }, -angle);
      setSigma1(clampPositive(Math.abs(local.x), 0.4, 4));
    },
    [angle]
  );

  const handleSigma2 = useCallback(
    (x: number, y: number) => {
      const local = rotate({ x, y }, -angle);
      setSigma2(clampPositive(Math.abs(local.y), 0.2, 4));
    },
    [angle]
  );

  const ellipsePoints = Array.from({ length: 97 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2;
    const p = rotate(
      {
        x: sigma1 * Math.cos(t),
        y: sigma2 * Math.sin(t),
      },
      angle
    );
    return toSvg(p.x, p.y);
  });

  const ellipseString = ellipsePoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">
          2 · Deeper Mechanics
        </div>

        <h2 className="text-2xl font-bold">
          Singular values tell you which directions survive
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine stretching a rubber circle into a giant oval. One direction
          may stretch a lot while the other barely moves. Those two stretch
          amounts are the <strong className="text-foreground">singular
          values</strong> (the numbers that measure how strongly a matrix
          stretches special directions).
        </p>

        <div className="mt-4">
          <MathBlock tex="\sigma_1\ge \sigma_2\ge 0" />
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
                <ArrowMarker id="deep-u" color="#a78bfa" />
                <ArrowMarker id="deep-s1" color="#ffd166" />
                <ArrowMarker id="deep-s2" color="#22e5c9" />
              </defs>

              <GridLines />

              <polygon
                points={ellipseString}
                fill={nearlyCollapsed ? "#fb923c" : "#a78bfa"}
                fillOpacity={nearlyCollapsed ? 0.07 : 0.16}
                stroke={nearlyCollapsed ? "#fb923c" : "#a78bfa"}
                strokeWidth={2}
              />

              <VectorArrow
                x={p1.x}
                y={p1.y}
                color="#ffd166"
                markerId="deep-s1"
                label="σ₁"
              />

              <VectorArrow
                x={p2.x}
                y={p2.y}
                color="#22e5c9"
                markerId="deep-s2"
                label="σ₂"
              />

              <line
                x1={OX}
                y1={OY}
                x2={toSvg(rotate({ x: 4.1, y: 0 }, angle).x, rotate({ x: 4.1, y: 0 }, angle).y).x}
                y2={toSvg(rotate({ x: 4.1, y: 0 }, angle).x, rotate({ x: 4.1, y: 0 }, angle).y).y}
                stroke="#ff5f9e"
                strokeOpacity={0.35}
                strokeWidth={1.5}
                strokeDasharray="6 5"
              />

              <DragHandle
                x={p1.x}
                y={p1.y}
                color="#ffd166"
                svgRef={svgRef}
                onDrag={handleSigma1}
              />

              <DragHandle
                x={p2.x}
                y={p2.y}
                color="#22e5c9"
                svgRef={svgRef}
                onDrag={handleSigma2}
              />
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Drag the yellow or green dot
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "σ₁ Stretch",
                value: sigma1.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "σ₂ Stretch",
                value: sigma2.toFixed(2),
                color: "border-[#22e5c9] text-[#22e5c9]",
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
          <h3 className="text-lg font-bold">Try flattening the oval</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Push the green dot toward the origin. One singular value can become
            tiny while the other stays large. That is how a 2D transformation
            can start behaving like a 1D transformation.
          </p>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${
              !nearlyCollapsed
                ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
                : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
            }`}
          >
            {!nearlyCollapsed
              ? "✓ Notice how two directions still carry information."
              : "⚠️ One singular value is almost zero — the second dimension is nearly gone."}
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Area scaling
            </div>

            <MathBlock tex="\text{area scale}=\sigma_1\sigma_2" />

            <div className="font-mono text-2xl text-[#ffd166] mt-3">
              {areaScale.toFixed(2)}
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Current interpretation
            </div>

            <div
              className={`font-mono font-bold ${
                nearlyCollapsed ? "text-[#fb923c]" : "text-[#34d399]"
              }`}
            >
              {rankLabel(sigma2)}
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed mt-2">
              Rank means the number of independent directions that still carry
              useful information. SVD makes that structure visible through the
              singular values.
            </p>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Key idea:</strong> the singular
            values are sorted from largest to smallest, so the first few often
            capture most of the action in a matrix.
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [sigma2, setSigma2] = useState(1.2);
  const [probeX, setProbeX] = useState(1.5);
  const [probeY, setProbeY] = useState(2);

  const sigma1 = 3.4;
  const thetaU = (32 * Math.PI) / 180;
  const thetaV = (-18 * Math.PI) / 180;

  const basisA = applySVD(
    { x: 1, y: 0 },
    sigma1,
    sigma2,
    thetaU,
    thetaV
  ).output;

  const basisB = applySVD(
    { x: 0, y: 1 },
    sigma1,
    sigma2,
    thetaU,
    thetaV
  ).output;

  const matrix = [
    [basisA.x, basisB.x],
    [basisA.y, basisB.y],
  ];

  const probeOutput = {
    x: matrix[0][0] * probeX + matrix[0][1] * probeY,
    y: matrix[1][0] * probeX + matrix[1][1] * probeY,
  };

  const approximationError = sigma2;
  const signedEntry = matrix[0][1];

  const status =
    sigma2 < 0.15
      ? "Rank-1 approximation is almost exact"
      : sigma2 < 0.8
        ? "Second direction is getting smaller"
        : "Both singular directions matter";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">
          3 · Number Crunching Lab
        </div>

        <h2 className="text-2xl font-bold">
          Change one singular value. Watch the matrix simplify.
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          This is where SVD becomes a practical tool. Making a smaller singular
          value means the matrix can be approximated using fewer important
          directions.
        </p>

        <div className="mt-4">
          <MathBlock tex="A_k=\sum_{i=1}^{k}\sigma_i\mathbf{u}_i\mathbf{v}_i^T" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">SVD controls</h3>

            <label className="block text-xs font-mono text-[#22e5c9] mb-2">
              ✦ Move the slider: σ₂ = {sigma2.toFixed(2)}
            </label>

            <input
              type="range"
              min="0"
              max="3.4"
              step="0.1"
              value={sigma2}
              onChange={(e) => setSigma2(Number(e.target.value))}
              className="w-full"
            />

            <div className="text-[10px] text-foreground-muted mt-2">
              Smaller σ₂ means less information survives in the second singular
              direction.
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Probe the transformation</h3>

            <div className="relative">
              <svg
                ref={svgRef}
                width={320}
                height={320}
                viewBox={`0 0 ${W} ${H}`}
                className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
                style={{ maxWidth: "100%" }}
              >
                <defs>
                  <ArrowMarker id="lab-in" color="#ffd166" />
                  <ArrowMarker id="lab-out" color="#a78bfa" />
                </defs>

                <GridLines />

                <VectorArrow
                  x={probeX}
                  y={probeY}
                  color="#ffd166"
                  markerId="lab-in"
                  label="x"
                />

                <VectorArrow
                  x={clamp(probeOutput.x / 2)}
                  y={clamp(probeOutput.y / 2)}
                  color="#a78bfa"
                  markerId="lab-out"
                  label="Ax / 2"
                />

                <DragHandle
                  x={probeX}
                  y={probeY}
                  color="#ffd166"
                  svgRef={svgRef}
                  onDrag={(nx, ny) => {
                    setProbeX(nx);
                    setProbeY(ny);
                  }}
                />
              </svg>

              <div
                className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                           text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
              >
                ✦ Drag the yellow probe
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Current matrix A
            </div>
            <Matrix2x2 matrix={matrix} />
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Live calculation
            </div>

            <div className="font-mono text-sm leading-loose">
              A₁₂ ={" "}
              <NumberColor value={matrix[0][1]} />
              <br />
              A₂₁ ={" "}
              <NumberColor value={matrix[1][0]} />
              <br />
              Ax₁ ={" "}
              <NumberColor value={probeOutput.x} />
              <br />
              Ax₂ ={" "}
              <NumberColor value={probeOutput.y} />
            </div>

            <div className="mt-4 text-4xl font-extrabold font-mono text-[#6366f1]">
              {probeOutput.x.toFixed(2)}
            </div>

            <div className="text-xs text-foreground-muted font-mono mt-1">
              first coordinate of Ax
            </div>
          </div>

          <div
            className={`border rounded-xl p-5 ${
              sigma2 < 0.15
                ? "border-[#34d399]/40 bg-[#34d399]/10"
                : sigma2 < 0.8
                  ? "border-[#ffd166]/40 bg-[#ffd166]/10"
                  : "border-[#a78bfa]/40 bg-[#a78bfa]/10"
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Compression status
            </div>

            <div
              className={`font-mono font-bold mt-2 ${
                sigma2 < 0.15
                  ? "text-[#34d399]"
                  : sigma2 < 0.8
                    ? "text-[#ffd166]"
                    : "text-[#a78bfa]"
              }`}
            >
              {status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Largest σ",
                value: sigma1.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Dropped σ",
                value: sigma2.toFixed(2),
                color: sigma2 < 0.5
                  ? "border-[#34d399] text-[#34d399]"
                  : "border-[#22e5c9] text-[#22e5c9]",
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

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Approximation intuition
            </div>

            <MathBlock tex="\|A-A_1\|_2=\sigma_2" />

            <div className="font-mono text-lg mt-3">
              error scale ≈ <NumberColor value={approximationError} />
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Try moving σ₂ close to zero. The matrix still does something, but
            one direction becomes much less important. This is the trick behind
            low-rank approximations and compression.
          </p>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
          Sign check
        </div>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Even though singular values are non-negative, the matrix entries can
          be positive or negative because the U and V directions can point in
          different orientations. One live entry is{" "}
          <NumberColor value={signedEntry} />.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 4 — 3D SPACE                                                       */
/* -------------------------------------------------------------------------- */

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [sx, setSx] = useState(3);
  const [sy, setSy] = useState(2);
  const [sz, setSz] = useState(1.2);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const width = Math.max(container.clientWidth, 300);
    const height = 420;

    const camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      100
    );
    camera.position.set(6.5, 5.5, 7);

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

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 24);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    const ellipsoid = new THREE.Mesh(sphereGeometry, sphereMaterial);
    ellipsoid.scale.set(sx, sy, sz);
    ellipsoid.rotation.set(0.35, -0.28, 0.2);
    scene.add(ellipsoid);

    const pointGeometry = new THREE.SphereGeometry(0.14, 24, 24);
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd166,
    });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(sx, sy * 0.65, sz * 0.55);
    point.rotation.set(0.35, -0.28, 0.2);
    scene.add(point);

    const labels = [
      { position: new THREE.Vector3(sx, 0, 0), color: 0xff5f9e },
      { position: new THREE.Vector3(0, sy, 0), color: 0x22e5c9 },
      { position: new THREE.Vector3(0, 0, sz), color: 0xffd166 },
    ];

    const labelGeometry = new THREE.BufferGeometry();
    labelGeometry.setFromPoints(labels.map((item) => item.position));
    const labelMaterial = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: false,
      color: 0xffffff,
    });
    const labelPoints = new THREE.Points(labelGeometry, labelMaterial);
    scene.add(labelPoints);

    const updateScene = () => {
      ellipsoid.scale.set(sx, sy, sz);
      point.position.set(sx, sy * 0.65, sz * 0.55);
      labelGeometry.setFromPoints([
        new THREE.Vector3(sx, 0, 0),
        new THREE.Vector3(0, sy, 0),
        new THREE.Vector3(0, 0, sz),
      ]);
    };

    updateScene();

    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      updateScene();
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const newWidth = Math.max(container.clientWidth, 300);
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);

      controls.dispose();

      sphereGeometry.dispose();
      sphereMaterial.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      labelGeometry.dispose();
      labelMaterial.dispose();

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [sx, sy, sz]);

  const volumeScale = sx * sy * sz;
  const vectorMagnitude = Math.sqrt(sx * sx + sy * sy + sz * sz);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
          4 · 3D Space
        </div>

        <h2 className="text-2xl font-bold">
          In 3D, the singular values stretch a sphere into an ellipsoid
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a game world with a perfectly round shield. SVD can explain
          a 3D transformation by showing three special stretch amounts. A
          sphere becomes an{" "}
          <strong className="text-foreground">ellipsoid</strong> (a stretched
          3D ball), and the three singular values tell you its three principal
          radii.
        </p>

        <div className="mt-4">
          <MathBlock tex="\text{volume scale}=\sigma_1\sigma_2\sigma_3" />
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
          <h3 className="text-lg font-bold">Stretch each axis</h3>

          {[
            {
              label: "σ₁ / X direction",
              value: sx,
              set: setSx,
              color: "#ff5f9e",
            },
            {
              label: "σ₂ / Y direction",
              value: sy,
              set: setSy,
              color: "#22e5c9",
            },
            {
              label: "σ₃ / Z direction",
              value: sz,
              set: setSz,
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
                min="0.4"
                max="4"
                step="0.2"
                value={axis.value}
                onChange={(e) => axis.set(Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Singular values
            </div>

            <ColumnVector
              values={[sx, sy, sz]}
              colors={["#ff5f9e", "#22e5c9", "#ffd166"]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Volume Scale",
                value: volumeScale.toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Vector Magnitude",
                value: vectorMagnitude.toFixed(2),
                color: "border-indigo-400 text-indigo-400",
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
            Notice how making one axis tiny makes the whole 3D shape flatter.
            In data science, a tiny singular value often means one dimension is
            contributing much less information than the others.
          </p>
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
    action: true,
    comedy: true,
    scifi: true,
    drama: false,
    animation: false,
  });

  const activeFeatures: Feature[] = [
    features.action && {
      key: "action",
      label: "Action",
      value: 4.8,
      color: "#ff5f9e",
    },
    features.comedy && {
      key: "comedy",
      label: "Comedy",
      value: 4.2,
      color: "#22e5c9",
    },
    features.scifi && {
      key: "scifi",
      label: "Sci-Fi",
      value: 4.9,
      color: "#ffd166",
    },
    features.drama && {
      key: "drama",
      label: "Drama",
      value: 2.6,
      color: "#a78bfa",
    },
    features.animation && {
      key: "animation",
      label: "Animation",
      value: 3.7,
      color: "#6366f1",
    },
  ].filter(Boolean) as Feature[];

  const activeAverage =
    activeFeatures.length > 0
      ? activeFeatures.reduce((sum, item) => sum + item.value, 0) /
        activeFeatures.length
      : 0;

  const latentStrength = activeFeatures.length
    ? Math.min(5, 2.2 + activeAverage * 0.55)
    : 0;

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
          How does a person become a matrix?
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a streaming app trying to understand your taste. It can
          turn your ratings into numbers. Across many users and many movies,
          those numbers form a{" "}
          <strong className="text-foreground">matrix</strong> (a grid of
          numbers).
        </p>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Choose the information</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            Turn genres on and off. Notice how the vector grows as we describe
            the viewer using more dimensions.
          </p>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(features) as (keyof typeof features)[]).map((key) => {
              const enabled = features[key];

              return (
                <button
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all ${
                    enabled
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
                label: "Latent Taste Strength",
                value: latentStrength.toFixed(2),
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

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
              SVD idea
            </div>

            <MathBlock tex="R\approx U\Sigma V^T" />

            <p className="text-xs text-foreground-muted leading-relaxed mt-3">
              Instead of treating every rating as unrelated noise, SVD can
              summarize the matrix using a smaller number of hidden factors
              such as action-heavy taste or comedy-heavy taste.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="bg-[#0a0a0c] border border-border rounded-xl p-6 min-h-[360px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-5">
              Viewer as a column vector
            </div>

            {activeFeatures.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No information yet. Turn on a feature.
              </p>
            ) : (
              <div className="font-mono space-y-3">
                {activeFeatures.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[#a78bfa]">[</span>

                    <span
                      className="text-xl font-bold"
                      style={{ color: feature.color }}
                    >
                      {feature.value.toFixed(1)}
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
                More features means more dimensions. SVD is useful because it
                can compress a huge data matrix without throwing away the most
                important patterns first.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="border border-[#ffd166] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Average Rating
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-[#ffd166]">
                {activeAverage.toFixed(2)}
              </div>
            </div>

            <div className="border border-indigo-400 rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Matrix View
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-indigo-400">
                {activeFeatures.length}D
              </div>
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
  const svgRef = useRef<SVGSVGElement>(null);

  const [sigma1, setSigma1] = useState(3.8);
  const [sigma2, setSigma2] = useState(1.5);
  const [angle, setAngle] = useState(25);
  const [px, setPx] = useState(2.2);
  const [py, setPy] = useState(1.2);

  const radians = (angle * Math.PI) / 180;
  const u1 = { x: Math.cos(radians), y: Math.sin(radians) };
  const u2 = { x: -Math.sin(radians), y: Math.cos(radians) };

  const varianceRatio =
    (sigma1 * sigma1) /
    Math.max(0.0001, sigma1 * sigma1 + sigma2 * sigma2);

  const projected = dot({ x: px, y: py }, u1);
  const reconstruction = {
    x: projected * u1.x,
    y: projected * u1.y,
  };
  const residual = {
    x: px - reconstruction.x,
    y: py - reconstruction.y,
  };

  const center = toSvg(0, 0);
  const ellipsePoints = Array.from({ length: 97 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2;
    const local = {
      x: sigma1 * Math.cos(t),
      y: sigma2 * Math.sin(t),
    };
    const world = rotate(local, radians);
    const p = toSvg(world.x, world.y);
    return `${p.x},${p.y}`;
  }).join(" ");

  const setPointFromDrag = (x: number, y: number) => {
    setPx(x);
    setPy(y);
  };

  const threshold = 0.7;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">
          6 · SVD in Classic AI — PCA
        </div>

        <h2 className="text-2xl font-bold">
          SVD helps PCA find the directions that matter most
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how a camera can keep the important parts of a giant photo
          while shrinking the amount of data?{" "}
          <strong className="text-foreground">
            Principal Component Analysis, or PCA,
          </strong>{" "}
          does something similar for datasets. SVD exposes the strongest
          directions so we can keep fewer dimensions.
        </p>

        <div className="mt-4">
          <MathBlock tex="X_c=U\Sigma V^T,\qquad Z=X_cV_k" />
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
                <ArrowMarker id="pca-axis" color="#ff5f9e" />
                <ArrowMarker id="pca-point" color="#ffd166" />
                <ArrowMarker id="pca-recon" color="#34d399" />
              </defs>

              <GridLines />

              <polygon
                points={ellipsePoints}
                fill="#6366f1"
                fillOpacity={0.1}
                stroke="#6366f1"
                strokeOpacity={0.7}
                strokeWidth={2}
              />

              <line
                x1={center.x}
                y1={center.y}
                x2={toSvg(u1.x * 4.2, u1.y * 4.2).x}
                y2={toSvg(u1.x * 4.2, u1.y * 4.2).y}
                stroke="#ff5f9e"
                strokeWidth={3}
                strokeDasharray="9 5"
                markerEnd="url(#pca-axis)"
              />

              <line
                x1={center.x}
                y1={center.y}
                x2={toSvg(u2.x * 3.2, u2.y * 3.2).x}
                y2={toSvg(u2.x * 3.2, u2.y * 3.2).y}
                stroke="#22e5c9"
                strokeWidth={2}
                strokeDasharray="6 5"
              />

              <VectorArrow
                x={px}
                y={py}
                color="#ffd166"
                markerId="pca-point"
                label="data point"
              />

              <VectorArrow
                x={reconstruction.x}
                y={reconstruction.y}
                color="#34d399"
                markerId="pca-recon"
                label="projection"
                dashed
              />

              <line
                x1={toSvg(reconstruction.x, reconstruction.y).x}
                y1={toSvg(reconstruction.x, reconstruction.y).y}
                x2={toSvg(px, py).x}
                y2={toSvg(px, py).y}
                stroke="#fb923c"
                strokeWidth={2}
                strokeDasharray="5 4"
              />

              <DragHandle
                x={px}
                y={py}
                color="#ffd166"
                svgRef={svgRef}
                onDrag={setPointFromDrag}
              />
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Drag the yellow data point
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              {
                label: "Variance Kept",
                value: `${(varianceRatio * 100).toFixed(1)}%`,
                color:
                  varianceRatio > threshold
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
              {
                label: "Projected Coordinate",
                value: projected.toFixed(2),
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
          <h3 className="text-lg font-bold">Build a tiny PCA system</h3>

          {[
            {
              label: "Dominant singular value σ₁",
              value: sigma1,
              set: setSigma1,
              color: "#ffd166",
              min: 1,
              max: 4,
            },
            {
              label: "Second singular value σ₂",
              value: sigma2,
              set: setSigma2,
              color: "#22e5c9",
              min: 0.2,
              max: 4,
            },
            {
              label: "Principal direction angle",
              value: angle,
              set: setAngle,
              color: "#ff5f9e",
              min: -90,
              max: 90,
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
                min={item.min}
                max={item.max}
                step="0.1"
                value={item.value}
                onChange={(e) => item.set(Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              PCA output
            </div>

            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-3">
              {(varianceRatio * 100).toFixed(1)}%
            </div>

            <div className="font-mono text-xs text-foreground-muted mt-4 leading-relaxed">
              {sigma1.toFixed(2)}² / ({sigma1.toFixed(2)}² +{" "}
              {sigma2.toFixed(2)}²)
            </div>
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${
              varianceRatio > threshold
                ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
            }`}
          >
            {varianceRatio > threshold
              ? "✓ One principal component keeps most of the visible variation."
              : "✗ One component is not enough yet — the second direction still matters."}
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Projection math
            </div>

            <div className="font-mono text-sm leading-loose">
              z₁ ={" "}
              <NumberColor value={projected} />
              <br />
              residual ={" "}
              <NumberColor value={magnitude(residual)} />
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is literally what happens inside{" "}
            <strong className="text-foreground">PCA</strong> when a dataset is
            rotated into its most informative directions and then represented
            using fewer coordinates.
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
  const svgRef = useRef<SVGSVGElement>(null);

  const [keep, setKeep] = useState(2);
  const [scale, setScale] = useState(0.8);
  const [probeX, setProbeX] = useState(1.5);
  const [probeY, setProbeY] = useState(-0.8);

  const singularValues = [4.5, 2.8, 1.4, 0.55];

  const basis = [
    [0.5, 0.5, 0.5, 0.5],
    [0.5, -0.5, 0.5, -0.5],
    [0.5, 0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5, 0.5],
  ];

  const matrix = Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => {
      let total = 0;

      for (let k = 0; k < keep; k++) {
        total +=
          singularValues[k] *
          basis[k][row] *
          basis[k][col] *
          scale;
      }

      return total;
    })
  );

  const maxAbs = Math.max(
    0.0001,
    ...matrix.flat().map((value) => Math.abs(value))
  );

  const retainedEnergy =
    Math.sqrt(
      singularValues
        .slice(0, keep)
        .reduce((sum, value) => sum + value * value, 0)
    ) /
    Math.sqrt(
      singularValues.reduce((sum, value) => sum + value * value, 0)
    );

  const fullParameters = 16;
  const lowRankParameters = 4 * keep + 4 * keep;
  const compressionRatio = lowRankParameters / fullParameters;

  const probeOutput = {
    x: matrix[0][0] * probeX + matrix[0][1] * probeY,
    y: matrix[1][0] * probeX + matrix[1][1] * probeY,
  };

  const threshold = 0.8;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">
          7 · SVD in Deep Learning — Transformer Weight Compression
        </div>

        <h2 className="text-2xl font-bold">
          Large neural-network matrices can be approximated with fewer pieces
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A Transformer layer can contain huge weight matrices. SVD gives us a
          way to keep the strongest singular directions and approximate the
          original matrix with a lower-rank version. Fewer stored parameters can
          mean less memory and faster matrix work.
        </p>

        <div className="mt-4">
          <MathBlock tex="W_k=\sum_{i=1}^{k}\sigma_i\mathbf{u}_i\mathbf{v}_i^T" />
        </div>
      </div>

      <div
        className="flex flex-col lg:flex-row gap-8 items-start
                   bg-surface border border-border rounded-2xl p-6"
      >
        <div className="w-full lg:w-3/5">
          <h3 className="text-lg font-bold mb-3">
            Live low-rank weight heatmap
          </h3>

          <p className="text-sm text-foreground-muted leading-relaxed mb-4">
            Every tile is one toy weight value. Brighter tiles mean larger
            magnitude. Increase the retained rank to bring more singular
            components back into the matrix.
          </p>

          <div className="relative overflow-auto rounded-xl bg-[#0a0a0c] p-4">
            <svg
              width={4 * 78}
              height={4 * 78}
              className="select-none"
              style={{ maxWidth: "100%" }}
            >
              {matrix.map((row, i) =>
                row.map((value, j) => (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={j * 78}
                      y={i * 78}
                      width={76}
                      height={76}
                      fill="#6366f1"
                      fillOpacity={heatmapOpacity(value, maxAbs)}
                      rx={5}
                    />
                    <text
                      x={j * 78 + 38}
                      y={i * 78 + 44}
                      fill="white"
                      fontSize={11}
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {value.toFixed(2)}
                    </text>
                  </g>
                ))
              )}
            </svg>

            <div
              className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                         text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
            >
              ✦ Change rank to reshape the matrix
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              {
                label: "Retained Rank",
                value: `k=${keep}`,
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Energy Kept",
                value: `${(retainedEnergy * 100).toFixed(1)}%`,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
              {
                label: "Parameter Ratio",
                value: `${(compressionRatio * 100).toFixed(0)}%`,
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

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Control the approximation</h3>

          <div>
            <div className="text-xs font-mono text-[#ff5f9e] mb-2">
              ✦ Retained singular directions: k = {keep}
            </div>

            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={keep}
              onChange={(e) => setKeep(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="text-xs font-mono text-[#22e5c9] mb-2">
              ✦ Weight scale: {scale.toFixed(2)}
            </div>

            <input
              type="range"
              min="0.3"
              max="1.4"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
              Probe a compressed weight block
            </div>

            <div className="relative">
              <svg
                ref={svgRef}
                width={320}
                height={320}
                viewBox={`0 0 ${W} ${H}`}
                className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
                style={{ maxWidth: "100%" }}
              >
                <defs>
                  <ArrowMarker id="deep-probe-in" color="#ffd166" />
                  <ArrowMarker id="deep-probe-out" color="#a78bfa" />
                </defs>

                <GridLines />

                <VectorArrow
                  x={probeX}
                  y={probeY}
                  color="#ffd166"
                  markerId="deep-probe-in"
                  label="x"
                />

                <VectorArrow
                  x={clamp(probeOutput.x / 2)}
                  y={clamp(probeOutput.y / 2)}
                  color="#a78bfa"
                  markerId="deep-probe-out"
                  label="Wₖx / 2"
                />

                <DragHandle
                  x={probeX}
                  y={probeY}
                  color="#ffd166"
                  svgRef={svgRef}
                  onDrag={(nx, ny) => {
                    setProbeX(nx);
                    setProbeY(ny);
                  }}
                />
              </svg>

              <div
                className="absolute bottom-3 left-3 bg-background/80 backdrop-blur
                           text-[10px] text-foreground-muted px-2 py-1 rounded font-mono"
              >
                ✦ Drag the probe vector
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
              Model output
            </div>

            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-3">
              {probeOutput.x.toFixed(2)}
            </div>

            <div className="font-mono text-xs text-foreground-muted mt-4 leading-relaxed">
              Wₖx = [{probeOutput.x.toFixed(2)},{" "}
              {probeOutput.y.toFixed(2)}]
            </div>
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${
              retainedEnergy > threshold
                ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
            }`}
          >
            {retainedEnergy > threshold
              ? "✓ Strong low-rank approximation — most spectral energy is preserved."
              : "✗ More singular directions are needed to preserve the original matrix."}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">This exact idea</strong> is
            useful in modern Transformer workflows when engineers compress,
            approximate, or factorize large weight matrices to trade a little
            numerical detail for much lower storage or compute cost.
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
      label: "SVD",
      desc: "Break a matrix into U, Σ, and Vᵀ so its hidden structure becomes visible.",
      color: "#ffd166",
    },
    {
      label: "Vᵀ Rotation",
      desc: "Change the input viewpoint into the matrix's special directions.",
      color: "#ff5f9e",
    },
    {
      label: "Singular Values",
      desc: "Measure how strongly each special direction is stretched.",
      color: "#22e5c9",
    },
    {
      label: "3D Ellipsoid",
      desc: "In 3D, the singular values become the principal stretches of a sphere.",
      color: "#a78bfa",
    },
    {
      label: "Ratings Matrix",
      desc: "Real people and preferences become rows, columns, and numerical data.",
      color: "#fb923c",
    },
    {
      label: "PCA",
      desc: "Classic AI uses SVD to find the strongest directions and reduce dimensions.",
      color: "#34d399",
    },
    {
      label: "Transformer Weight Compression",
      desc: "Deep learning can keep the strongest singular components of large weight matrices.",
      color: "#6366f1",
    },
    {
      label: "Low-Rank Neural Networks",
      desc: "Modern models use factorized matrices to make large networks easier to store or adapt.",
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
          The whole SVD journey in one picture
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Start with one matrix. Rotate into special directions. Measure the
          stretches. Then follow the same structure from real-world ratings
          all the way into AI systems that handle huge weight matrices.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="bg-background border rounded-xl p-3 flex flex-col gap-1
                         hover:scale-[1.03] transition-transform cursor-default"
              style={{ borderColor: `${n.color}55` }}
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
        Basically: SVD takes a messy matrix, finds its most important
        directions, and turns that hidden structure into something we can
        visualize, compress, and use in AI.
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

export default function SingularValueDecompositionPage() {
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
