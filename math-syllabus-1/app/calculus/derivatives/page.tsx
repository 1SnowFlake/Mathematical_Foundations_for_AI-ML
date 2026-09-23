"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;
const LIMIT = 4.5;

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
  value: string;
  color: string;
}

interface ConceptNode {
  label: string;
  desc: string;
  color: string;
}

function toSvg(x: number, y: number) {
  return { x: OX + x * SCALE, y: OY - y * SCALE };
}

function toGrid(svgX: number, svgY: number, snap = 0.25) {
  return {
    x: Math.round(((svgX - OX) / SCALE) / snap) * snap,
    y: Math.round(((-(svgY - OY)) / SCALE) / snap) * snap,
  };
}

function clamp(n: number) {
  return Math.max(-LIMIT, Math.min(LIMIT, n));
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
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
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />
    );
    if (i !== 0) {
      lines.push(
        <text key={`lv${i}`} x={vp.x} y={OY + 16} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>,
        <text key={`lh${i}`} x={OX - 14} y={hp.y + 3.5} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>
      );
    }
  }
  return <>{lines}</>;
}

function DragHandle({ x, y, color, svgRef, onDrag }: DragHandleProps) {
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
      style={{ cursor: "grab", filter: `drop-shadow(0 0 6px ${color})` }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !svgRef.current) return;
        const r = svgRef.current.getBoundingClientRect();
        const g = toGrid(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
        onDrag(clamp(g.x), clamp(g.y));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}

function NumberColor({ value }: { value: number }) {
  return (
    <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>
      {value.toFixed(2)}
    </span>
  );
}

function functionValue(x: number) {
  return 0.28 * x * x + 0.9 * x + 0.4;
}

function derivativeValue(x: number) {
  return 0.56 * x + 0.9;
}

function functionLabel(y: number) {
  return y.toFixed(2);
}

function curvePath(fn: (x: number) => number, start = -4.5, end = 4.5, steps = 120) {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = start + ((end - start) * i) / steps;
    const y = fn(x);
    const p = toSvg(x, y);
    points.push(`${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return points.join(" ");
}

/* -------------------------------------------------------------------------- */
/* SECTION 0 — HERO                                                          */
/* -------------------------------------------------------------------------- */

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Calculus · Topic 1
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What are{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
          Derivatives?
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine checking a racing game and asking, “How fast am I moving right now?”
          A derivative answers that question: it measures <strong className="text-foreground">how quickly something is changing at one exact moment</strong>.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          On a graph, the derivative is the <strong className="text-foreground">slope</strong> of the curve — how steeply the line is climbing or falling right where you are.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI and machine learning, derivatives tell models how to change their parameters so predictions get closer to the target. This idea powers <strong className="text-foreground">gradient descent and backpropagation</strong>.
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
  const y = functionValue(x);
  const slope = derivativeValue(x);
  const tangentY0 = y - slope * x;
  const tangentFn = (tx: number) => slope * tx + tangentY0;
  const point = toSvg(x, y);
  const lineLeft = toSvg(-4.5, tangentFn(-4.5));
  const lineRight = toSvg(4.5, tangentFn(4.5));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">The derivative is your graph’s “right now” slope</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a skateboard ramp. The derivative tells you whether the ramp feels flat, uphill, or downhill at one exact spot. Drag the yellow point and watch the tangent line rotate with it.
        </p>
        <div className="mt-4"><MathBlock tex="f'(x)=\frac{dy}{dx}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs>
                <ArrowMarker id="int-x" color="#ff5f9e" />
                <ArrowMarker id="int-y" color="#22e5c9" />
                <ArrowMarker id="int-t" color="#a78bfa" />
              </defs>
              <GridLines />
              <line x1={OX} y1={0} x2={OX} y2={H} stroke="#22e5c9" strokeOpacity={0.35} />
              <line x1={0} y1={OY} x2={W} y2={OY} stroke="#ff5f9e" strokeOpacity={0.35} />
              <path d={curvePath(functionValue)} fill="none" stroke="#ffd166" strokeWidth={3} />
              <line x1={lineLeft.x} y1={lineLeft.y} x2={lineRight.x} y2={lineRight.y} stroke="#a78bfa" strokeWidth={2.5} markerEnd="url(#int-t)" />
              <line x1={point.x} y1={point.y} x2={point.x + 65} y2={point.y - slope * 65} stroke="#34d399" strokeWidth={3} markerEnd="url(#int-t)" />
              <DragHandle x={x} y={y} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setX(nx)} />
              <text x={point.x + 12} y={point.y - 12} fill="#ffd166" fontSize="13" fontWeight="bold">P({x.toFixed(2)}, {y.toFixed(2)})</text>
              <text x={lineRight.x - 75} y={lineRight.y - 12} fill="#a78bfa" fontSize="13" fontWeight="bold">tangent</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Move the yellow point</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Point y", value: y.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Instantaneous slope", value: slope.toFixed(2), color: slope >= 0 ? "border-[#34d399] text-[#34d399]" : "border-[#fb923c] text-[#fb923c]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What is changing?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            The yellow curve stays the same. Only your location changes. The purple tangent line shows the slope at that exact point.
          </p>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Derivative formula</div>
            <MathBlock tex="f(x)=0.28x^2+0.9x+0.4" />
            <div className="mt-3"><MathBlock tex="f'(x)=0.56x+0.9" /></div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live readout</div>
            <div className="font-mono text-lg space-y-2">
              <div>x = <NumberColor value={x} /></div>
              <div>f(x) = <NumberColor value={y} /></div>
              <div>f&apos;(x) = <NumberColor value={slope} /></div>
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Notice how:</strong> when the slope is positive, the curve is climbing; when it becomes negative, the curve falls. A derivative turns the shape of a curve into a number you can use.
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
  const [x, setX] = useState(1.5);
  const [h, setH] = useState(1.5);
  const fx = functionValue(x);
  const secantX = Math.min(4.2, Math.max(-4.2, x + h));
  const fy = functionValue(secantX);
  const secantSlope = (fy - fx) / (secantX - x || 1);
  const tangentSlope = derivativeValue(x);
  const p1 = toSvg(x, fx);
  const p2 = toSvg(secantX, fy);
  const singular = Math.abs(h) < 0.12;
  const tangentY = (tx: number) => tangentSlope * tx + (fx - tangentSlope * x);
  const l = toSvg(-4.5, tangentY(-4.5));
  const r = toSvg(4.5, tangentY(4.5));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">From secant to tangent: zoom in until “average” becomes “instant”</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A <strong className="text-foreground">secant slope</strong> measures change between two points. Shrink the gap between those points and the secant line approaches the tangent line — the derivative.
        </p>
        <div className="mt-4"><MathBlock tex="f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="deep-t" color="#a78bfa" /></defs>
              <GridLines />
              <path d={curvePath(functionValue)} fill="none" stroke="#ffd166" strokeWidth={3} />
              <line x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#a78bfa" strokeWidth={2.5} />
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22e5c9" strokeWidth={3} />
              <DragHandle x={x} y={fx} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setX(nx)} />
              <circle cx={p2.x} cy={p2.y} r={8} fill="#22e5c9" stroke="white" strokeWidth={2} />
              <text x={p1.x + 10} y={p1.y - 10} fill="#ffd166" fontSize="13" fontWeight="bold">x</text>
              <text x={p2.x + 10} y={p2.y - 10} fill="#22e5c9" fontSize="13" fontWeight="bold">x+h</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow point · use the h slider</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Secant slope", value: secantSlope.toFixed(2), color: "border-[#22e5c9] text-[#22e5c9]" },
              { label: "Tangent slope", value: tangentSlope.toFixed(2), color: "border-[#a78bfa] text-[#a78bfa]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Shrink the gap</h3>
          <label className="block text-xs font-mono text-[#22e5c9] mb-2">✦ Move h = {h.toFixed(2)}</label>
          <input type="range" min="0.05" max="2.5" step="0.05" value={h} onChange={(e) => setH(Number(e.target.value))} className="w-full" />

          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${singular ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]" : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>
            {singular ? "✓ The two slopes are nearly the same — you are zooming into the derivative." : "⚠️ You are still measuring an average change across a visible gap."}
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Why the limit works</div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              The fraction compares the change in y to the change in x. The limit says, “keep shrinking the gap until the answer settles into one exact slope.”
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Current numbers</div>
            <div className="font-mono text-sm space-y-2">
              <div>f(x) = <span className="text-[#ffd166]">{functionLabel(fx)}</span></div>
              <div>f(x+h) = <span className="text-[#22e5c9]">{functionLabel(fy)}</span></div>
              <div>h = <span className="text-[#a78bfa]">{h.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 3 — NUMBER CRUNCHING                                               */
/* -------------------------------------------------------------------------- */

function NumberCrunchingLab() {
  const [a, setA] = useState(0.5);
  const [b, setB] = useState(-1);
  const [x, setX] = useState(2);
  const c = 0.8;
  const value = a * x * x + b * x + c;
  const derivative = 2 * a * x + b;
  const curvature = 2 * a;
  const status = Math.abs(derivative) < 0.08 ? "Almost flat here" : derivative > 0 ? "Climbing" : "Falling";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Change the equation. See the derivative change with it.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of the derivative like a calculator for “how steep is this?” The coefficients decide the curve, and x tells us where we are standing.
        </p>
        <div className="mt-4"><MathBlock tex="f(x)=ax^2+bx+c\quad\Rightarrow\quad f'(x)=2ax+b" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Equation controls</h3>
            <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Move a = {a.toFixed(2)}</label>
            <input type="range" min="-1" max="1.5" step="0.05" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Move b = {b.toFixed(2)}</label>
            <input type="range" min="-3" max="3" step="0.1" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#ffd166] mt-6 mb-2">✦ Move x = {x.toFixed(2)}</label>
            <input type="range" min="-4" max="4" step="0.1" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live calculation</div>
            <div className="font-mono text-lg leading-loose">
              f(x) = <span className="text-[#ff5f9e]">{a.toFixed(2)}</span>x² + <span className="text-[#22e5c9]">({b.toFixed(2)})</span>x + <span className="text-[#ffd166]">{c.toFixed(2)}</span>
            </div>
            <div className="mt-2 font-mono">f&apos;(x) = 2(<span className="text-[#ff5f9e]">{a.toFixed(2)}</span>)(<span className="text-[#ffd166]">{x.toFixed(2)}</span>) + <span className="text-[#22e5c9]">({b.toFixed(2)})</span></div>
            <div className="mt-4 text-4xl font-extrabold font-mono"><NumberColor value={derivative} /></div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className={`border rounded-xl p-6 ${derivative > 0.08 ? "border-[#34d399]/40 bg-[#34d399]/10" : derivative < -0.08 ? "border-[#fb923c]/40 bg-[#fb923c]/10" : "border-[#ffd166]/40 bg-[#ffd166]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Slope status</div>
            <div className={`font-mono font-bold mt-2 ${derivative > 0.08 ? "text-[#34d399]" : derivative < -0.08 ? "text-[#fb923c]" : "text-[#ffd166]"}`}>{status}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Function value", value: value.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Second derivative", value: curvature.toFixed(2), color: curvature >= 0 ? "border-[#a78bfa] text-[#a78bfa]" : "border-[#fb923c] text-[#fb923c]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            A first derivative tells you <strong className="text-foreground">direction and steepness</strong>. A second derivative tells you about how that steepness itself is changing — useful for spotting curves, peaks, and valleys.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 4 — 3D SPACE                                                      */
/* -------------------------------------------------------------------------- */

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(1.5);
  const [y, setY] = useState(1.0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    const width = container.clientWidth || 640;
    const height = 420;
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(6.5, 5.5, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(grid);

    const origin = new THREE.Vector3(0, 0, 0);
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 4, 0xff5f9e);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 4, 0x22e5c9);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 4, 0xffd166);
    scene.add(xAxis, yAxis, zAxis);

    const surfaceGeometry = new THREE.PlaneGeometry(8, 8, 28, 28);
    const position = surfaceGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const px = position.getX(i);
      const py = position.getY(i);
      const pz = 0.12 * (px * px + 1.2 * py * py);
      position.setZ(i, pz);
    }
    surfaceGeometry.computeVertexNormals();
    const surfaceMaterial = new THREE.MeshBasicMaterial({ color: 0x383050, wireframe: true, transparent: true, opacity: 0.75 });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.rotation.x = -Math.PI / 2;
    scene.add(surface);

    const pointGeometry = new THREE.SphereGeometry(0.16, 20, 20);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);

    const gradientGeometry = new THREE.BufferGeometry();
    const gradientMaterial = new THREE.LineBasicMaterial({ color: 0xa78bfa });
    const gradientLine = new THREE.Line(gradientGeometry, gradientMaterial);
    scene.add(gradientLine);

    const update = () => {
      const z = 0.12 * (x * x + 1.2 * y * y);
      point.position.set(x, z, y);
      const gx = 0.24 * x;
      const gy = 0.288 * y;
      gradientGeometry.setFromPoints([
        new THREE.Vector3(x, z, y),
        new THREE.Vector3(x + gx * 3, z + (gx * gx + gy * gy) * 0.6, y + gy * 3),
      ]);
    };
    update();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      update();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const newWidth = container.clientWidth || 640;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      gradientGeometry.dispose();
      gradientMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [x, y]);

  const gx = 0.24 * x;
  const gy = 0.288 * y;
  const gradMag = Math.sqrt(gx * gx + gy * gy);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">In 3D, one derivative becomes a gradient</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine standing on a smooth game-world hill. In 2D there is one direction to measure. On a surface, there are many directions, so we collect the partial derivatives into a <strong className="text-foreground">gradient</strong>.
        </p>
        <div className="mt-4"><MathBlock tex="\nabla f=\left[\frac{\partial f}{\partial x},\frac{\partial f}{\partial y}\right]" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: 420 }} />
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div>
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move around the surface</h3>
          {[
            { label: "X position", value: x, setter: setX, color: "#ff5f9e" },
            { label: "Y position", value: y, setter: setY, color: "#22e5c9" },
          ].map((axis) => (
            <div key={axis.label}>
              <div className="text-xs font-mono mb-2" style={{ color: axis.color }}>✦ Move {axis.label}: {axis.value.toFixed(1)}</div>
              <input type="range" min="-3" max="3" step="0.1" value={axis.value} onChange={(e) => axis.setter(Number(e.target.value))} className="w-full" />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Gradient vector</div>
            <div className="font-mono text-xl leading-relaxed">
              <div>[ <span className="text-[#ff5f9e]">{gx.toFixed(2)}</span> ]</div>
              <div>[ <span className="text-[#22e5c9]">{gy.toFixed(2)}</span> ]</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Gradient size", value: gradMag.toFixed(2), color: "border-[#a78bfa] text-[#a78bfa]" },
              { label: "Direction", value: gradMag < 0.08 ? "flat" : gx + gy > 0 ? "up" : "down", color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 5 — REAL-WORLD DATA                                                */
/* -------------------------------------------------------------------------- */

function RealWorldData() {
  const [active, setActive] = useState<string[]>(["time", "distance", "speed"]);
  const features: Feature[] = [
    { key: "time", label: "Time", value: "12.4 s", color: "#ffd166" },
    { key: "distance", label: "Distance", value: "86.2 m", color: "#ff5f9e" },
    { key: "speed", label: "Speed", value: "7.8 m/s", color: "#22e5c9" },
    { key: "accel", label: "Acceleration", value: "1.6 m/s²", color: "#a78bfa" },
  ];

  const toggle = (key: string) => setActive((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Data</div>
        <h2 className="text-2xl font-bold">A moving car can become a vector of changing features</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of game telemetry: a character or vehicle can be described by numbers at each moment. Derivatives connect those numbers — distance changing over time becomes speed, and speed changing over time becomes acceleration.
        </p>
        <div className="mt-4"><MathBlock tex="v=\frac{ds}{dt},\qquad a=\frac{dv}{dt}" /></div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((f) => {
            const enabled = active.includes(f.key);
            return (
              <button key={f.key} type="button" onClick={() => toggle(f.key)} className={`rounded-xl border p-4 text-left transition-all ${enabled ? "bg-background" : "bg-background/40 opacity-60"}`} style={{ borderColor: `${f.color}66` }}>
                <div className="text-xs font-bold font-mono" style={{ color: f.color }}>{enabled ? "✓" : "＋"} {f.label}</div>
                <div className="text-lg font-mono mt-2">{f.value}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-1/2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Feature vector</div>
            <div className="bg-background border border-border rounded-xl p-5 font-mono text-lg space-y-2">
              {active.length === 0 ? <div className="text-foreground-muted">[ empty ]</div> : active.map((key) => {
                const f = features.find((item) => item.key === key)!;
                return <div key={f.key} style={{ color: f.color }}>[ {f.value} ]</div>;
              })}
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <h3 className="text-lg font-bold">Why the derivative matters</h3>
            <p className="text-sm text-foreground-muted leading-relaxed mt-3">
              The raw measurement tells you where you are. The derivative tells you <strong className="text-foreground">how the measurement is moving</strong>. That makes derivatives useful for motion, sensor data, finance, robotics, and any system where change over time matters.
            </p>
            <div className="mt-4 text-xs font-mono px-3 py-2 rounded-lg border border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]">
              ✓ {active.length} feature{active.length === 1 ? "" : "s"} currently included in the data vector.
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
  const [weight, setWeight] = useState(-1.2);
  const [learningRate, setLearningRate] = useState(0.25);
  const target = 2.5;
  const loss = (weight - target) ** 2;
  const gradient = 2 * (weight - target);
  const nextWeight = weight - learningRate * gradient;
  const closeEnough = Math.abs(weight - target) < 0.25;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Derivatives in Classic AI — Linear Regression</div>
        <h2 className="text-2xl font-bold">How does a model know which direction to improve?</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how a prediction can be a little too high or too low? In <strong className="text-foreground">linear regression</strong>, derivatives tell the optimizer which way to nudge a weight so the error gets smaller.
        </p>
        <div className="mt-4"><MathBlock tex="L(w)=(w-t)^2,\qquad \frac{dL}{dw}=2(w-t)" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none" style={{ maxWidth: "100%" }}>
              <GridLines />
              <path d={curvePath((v) => (v - target) ** 2, -3.5, 4.5)} fill="none" stroke="#6366f1" strokeWidth={3} />
              <line x1={toSvg(weight, loss).x} y1={toSvg(weight, loss).y} x2={toSvg(nextWeight, (nextWeight - target) ** 2).x} y2={toSvg(nextWeight, (nextWeight - target) ** 2).y} stroke="#ffd166" strokeWidth={2} strokeDasharray="6 5" />
              <circle cx={toSvg(weight, loss).x} cy={toSvg(weight, loss).y} r={10} fill="#ffd166" stroke="white" strokeWidth={2} />
              <circle cx={toSvg(target, 0).x} cy={toSvg(target, 0).y} r={8} fill="#34d399" stroke="white" strokeWidth={2} />
              <text x={toSvg(weight, loss).x + 12} y={toSvg(weight, loss).y - 12} fill="#ffd166" fontSize="13" fontWeight="bold">current w</text>
              <text x={toSvg(target, 0).x + 12} y={toSvg(target, 0).y - 12} fill="#34d399" fontSize="13" fontWeight="bold">target</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Move the weight slider and watch the gradient step</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Current loss", value: loss.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Gradient", value: gradient.toFixed(2), color: gradient >= 0 ? "border-[#34d399] text-[#34d399]" : "border-[#fb923c] text-[#fb923c]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Let the derivative steer the update</h3>
          <label className="block text-xs font-mono text-[#ffd166] mb-2">✦ Set weight w = {weight.toFixed(2)}</label>
          <input type="range" min="-2" max="4" step="0.05" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Set learning rate = {learningRate.toFixed(2)}</label>
          <input type="range" min="0.05" max="0.5" step="0.01" value={learningRate} onChange={(e) => setLearningRate(Number(e.target.value))} className="w-full" />

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">One gradient-descent step</div>
            <div className="font-mono text-sm mt-3">w<sub>new</sub> = {weight.toFixed(2)} − ({learningRate.toFixed(2)})({gradient.toFixed(2)})</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-3">{nextWeight.toFixed(2)}</div>
          </div>

          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${closeEnough ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
            {closeEnough ? "✓ The weight is close to the target." : "✗ The derivative is still pointing toward a better weight."}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is literally what <strong className="text-foreground">linear regression trained with gradient descent</strong> does: calculate an error, take a derivative, and nudge parameters in a direction that reduces the error.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 7 — MODERN DEEP LEARNING                                          */
/* -------------------------------------------------------------------------- */

function DeepLearningAI() {
  const [input, setInput] = useState(1.4);
  const [target, setTarget] = useState(0.8);
  const [bias, setBias] = useState(-0.4);

  const z = 1.6 * input + bias;
  const sigmoid = 1 / (1 + Math.exp(-z));
  const dLossDz = sigmoid - target;
  const rows = 4;
  const cols = 5;
  const matrix = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => {
    const scale = 0.25 + i * 0.13 + j * 0.07;
    return Math.min(1, Math.abs(dLossDz) * scale * (1 + Math.abs(Math.sin(input + i + j))));
  }));
  const maxGrad = Math.max(...matrix.flat());
  const avgGrad = matrix.flat().reduce((sum, v) => sum + v, 0) / matrix.flat().length;
  const maxIndex = matrix.flat().indexOf(maxGrad);
  const argRow = Math.floor(maxIndex / cols);
  const argCol = maxIndex % cols;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Derivatives in Deep Learning — Multilayer Perceptron Backpropagation</div>
        <h2 className="text-2xl font-bold">A neural network sends derivative signals backward through the layers</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A neural network is a stack of transformations. During training, it compares its prediction with the target and uses the <strong className="text-foreground">chain rule</strong> to send gradient information backward so each weight knows how much it contributed to the error.
        </p>
        <div className="mt-4"><MathBlock tex="\frac{\partial L}{\partial w}=\frac{\partial L}{\partial z}\frac{\partial z}{\partial w}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-xs font-mono text-foreground-muted uppercase tracking-widest mb-4">Gradient heatmap</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {matrix.map((row, i) => row.map((value, j) => (
                <div key={`${i}-${j}`} className="relative aspect-square rounded-md border border-border/40 bg-[#6366f1] flex items-center justify-center" style={{ opacity: Math.max(0.15, Math.min(1, 0.18 + value * 0.82)) }}>
                  <span className="text-[9px] font-mono text-white">{value.toFixed(2)}</span>
                </div>
              )))}
            </div>
            <div className="text-[10px] text-foreground-muted mt-3">Brighter cells = larger gradient magnitude. Each tile is a toy visualization of how strong a derivative signal can be for different weights.</div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Output", value: sigmoid.toFixed(3), color: "border-[#6366f1] text-[#6366f1]" },
              { label: "Avg |gradient|", value: avgGrad.toFixed(3), color: "border-[#22e5c9] text-[#22e5c9]" },
              { label: "Max cell", value: `${argRow + 1},${argCol + 1}`, color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Push the inputs</h3>
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Input = {input.toFixed(2)}</label>
          <input type="range" min="-3" max="3" step="0.1" value={input} onChange={(e) => setInput(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Target = {target.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.05" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#a78bfa] mt-5 mb-2">✦ Bias = {bias.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.1" value={bias} onChange={(e) => setBias(Number(e.target.value))} className="w-full" />

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Forward pass</div>
            <div className="font-mono text-sm leading-7">
              z = 1.60 × {input.toFixed(2)} + ({bias.toFixed(2)}) = <span className="text-[#a78bfa]">{z.toFixed(2)}</span>
              <br />
              σ(z) = <span className="text-[#6366f1]">{sigmoid.toFixed(3)}</span>
              <br />
              ∂L/∂z = σ(z) − target = <span className={dLossDz >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>{dLossDz.toFixed(3)}</span>
            </div>
          </div>

          <div className="text-4xl font-extrabold font-mono text-[#6366f1]">{Math.abs(dLossDz).toFixed(3)}</div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${Math.abs(dLossDz) > 0.2 ? "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]" : "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"}`}>
            {Math.abs(dLossDz) > 0.2 ? "✗ Strong gradient signal — the network has a lot to correct." : "✓ Small gradient signal — the prediction is closer to the target."}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            <strong className="text-foreground">This exact idea sits inside modern neural-network training.</strong> Backpropagation repeatedly applies derivatives and the chain rule so many parameters can be updated together.
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
  const nodes: ConceptNode[] = [
    { label: "Derivative", desc: "A number describing instantaneous change.", color: "#ffd166" },
    { label: "Slope", desc: "How steeply a graph rises or falls.", color: "#ff5f9e" },
    { label: "Chain Rule", desc: "Links derivatives through nested functions.", color: "#22e5c9" },
    { label: "Gradient", desc: "A bundle of partial derivatives for many directions.", color: "#a78bfa" },
    { label: "Real-World Data", desc: "Speed and acceleration come from rates of change.", color: "#34d399" },
    { label: "Classic AI", desc: "Linear regression uses gradients to reduce error.", color: "#fb923c" },
    { label: "Linear Regression", desc: "A simple model improved with gradient descent.", color: "#6366f1" },
    { label: "MLP Backpropagation", desc: "A neural network trained by chained derivative signals.", color: "#6366f1" },
  ];

  const svgRef = useRef<SVGSVGElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">8 · Concept Map</div>
        <h2 className="text-2xl font-bold">The whole journey, in one glance</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Follow the path from a simple slope all the way to neural-network training. Drag the little yellow handle to shift the map and explore the connections.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="relative overflow-hidden rounded-xl">
          <svg ref={svgRef} width={760} height={390} viewBox="0 0 760 390" className="w-full bg-[#0a0a0c] select-none touch-none" style={{ maxWidth: "100%" }}>
            <g transform={`translate(${offset.x} ${offset.y})`}>
              <line x1="115" y1="65" x2="275" y2="65" stroke="#ffd166" strokeOpacity="0.45" />
              <line x1="275" y1="65" x2="455" y2="65" stroke="#ff5f9e" strokeOpacity="0.45" />
              <line x1="455" y1="65" x2="640" y2="65" stroke="#22e5c9" strokeOpacity="0.45" />
              <line x1="115" y1="185" x2="275" y2="185" stroke="#a78bfa" strokeOpacity="0.45" />
              <line x1="275" y1="185" x2="455" y2="185" stroke="#34d399" strokeOpacity="0.45" />
              <line x1="455" y1="185" x2="640" y2="185" stroke="#6366f1" strokeOpacity="0.45" />
              <line x1="275" y1="185" x2="455" y2="305" stroke="#6366f1" strokeOpacity="0.45" />

              {[
                { x: 25, y: 25, node: nodes[0] },
                { x: 205, y: 25, node: nodes[1] },
                { x: 385, y: 25, node: nodes[2] },
                { x: 590, y: 25, node: nodes[3] },
                { x: 25, y: 145, node: nodes[4] },
                { x: 205, y: 145, node: nodes[5] },
                { x: 385, y: 145, node: nodes[6] },
                { x: 590, y: 145, node: nodes[7] },
              ].map((item) => (
                <g key={item.node.label} transform={`translate(${item.x} ${item.y})`}>
                  <rect width="145" height="80" rx="12" fill="#0d0d12" stroke={`${item.node.color}88`} />
                  <text x="12" y="24" fill={item.node.color} fontSize="12" fontWeight="700">{item.node.label}</text>
                  <text x="12" y="43" fill="rgba(255,255,255,0.55)" fontSize="9">{item.node.desc.slice(0, 25)}</text>
                  <text x="12" y="56" fill="rgba(255,255,255,0.55)" fontSize="9">{item.node.desc.slice(25, 50)}</text>
                </g>
              ))}
            </g>

            <DragHandle
              x={(offset.x + 50) / 44 - 4.5}
              y={3.4}
              color="#ffd166"
              svgRef={svgRef}
              onDrag={(nx) => setOffset({ x: Math.max(-120, Math.min(80, nx * 12)), y: offset.y })}
            />
          </svg>
          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow map handle</div>
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
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically: a derivative tells you how fast something changes — and that tiny idea becomes the steering wheel behind optimization and neural-network learning.
      </p>
      <Link href="/calculus" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">
        ← Calculus
      </Link>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function DerivativesPage() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
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
