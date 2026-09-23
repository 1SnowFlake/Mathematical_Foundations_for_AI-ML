"use client";

import React, { useEffect, useRef, useState } from "react";
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
  return <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>{value.toFixed(2)}</span>;
}

function field(x: number, y: number, ax = 1, by = 0.6, c = 0) {
  return ax * x * x + by * y * y + c;
}

function curvePoints(fn: (x: number) => number, start = -4.5, end = 4.5, steps = 120) {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = start + ((end - start) * i) / steps;
    const y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > 5.2) continue;
    const p = toSvg(x, y);
    pts.push(`${pts.length === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function softmax(values: number[]) {
  const m = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / s);
}

function attentionLoss(q: number[], keys: number[][], targetIndex: number) {
  const scores = keys.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2);
  const weights = softmax(scores);
  return -Math.log(Math.max(weights[targetIndex], 1e-8));
}

function finiteGradient(q: number[], keys: number[][], targetIndex: number, idx: number) {
  const eps = 0.001;
  const p = [...q];
  const m = [...q];
  p[idx] += eps;
  m[idx] -= eps;
  return (attentionLoss(p, keys, targetIndex) - attentionLoss(m, keys, targetIndex)) / (2 * eps);
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Calculus · Topic 3
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What are{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Partial Derivatives?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine a game character standing on a hill. You can ask, “How steep is the hill if I only move left and right?” or “How steep is it if I only move forward?” A <strong className="text-foreground">partial derivative</strong> answers one of those questions while keeping the other direction fixed.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          It is the single-variable derivative idea, upgraded for functions that depend on several inputs. The symbol <em>∂</em> basically means: <strong className="text-foreground">change one input, freeze the others</strong>.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI and machine learning, partial derivatives tell a model how each weight or input affects the final error. Those tiny slopes become the gradients used to train neural networks.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(1.5);
  const [y, setY] = useState(1.25);
  const fx = 2 * x;
  const fy = 1.2 * y;
  const gradMag = Math.hypot(fx, fy);
  const p = toSvg(x, y);
  const px = toSvg(x, field(x, y));
  const xSlice = (t: number) => field(t, y);
  const ySlice = (t: number) => field(x, t);
  const xEnd = toSvg(x + Math.sign(fx || 1) * Math.min(Math.abs(fx) * 0.28, 2.2), field(x + Math.sign(fx || 1) * Math.min(Math.abs(fx) * 0.28, 2.2), y));
  const yEnd = toSvg(x + Math.sign(fy || 1) * Math.min(Math.abs(fy) * 0.20, 1.6), field(x + Math.sign(fy || 1) * Math.min(Math.abs(fy) * 0.20, 1.6), y));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">One surface, two different slopes</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of standing on a skate ramp. Looking east-west gives one steepness; looking north-south gives another. Drag the yellow point and both partial derivatives change because you are standing somewhere else on the ramp.
        </p>
        <div className="mt-4"><MathBlock tex="f(x,y)=x^2+0.6y^2,\quad \frac{\partial f}{\partial x}=2x,\quad \frac{\partial f}{\partial y}=1.2y" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs>
                <ArrowMarker id="pd-grad" color="#ffd166" />
                <ArrowMarker id="pd-x" color="#ff5f9e" />
                <ArrowMarker id="pd-y" color="#22e5c9" />
              </defs>
              <GridLines />
              <path d={curvePoints(xSlice)} fill="none" stroke="#ff5f9e" strokeWidth={2.5} strokeDasharray="6 4" />
              <path d={curvePoints(ySlice)} fill="none" stroke="#22e5c9" strokeWidth={2.5} strokeDasharray="6 4" />
              <line x1={p.x} y1={p.y} x2={xEnd.x} y2={xEnd.y} stroke="#ff5f9e" strokeWidth={3} markerEnd="url(#pd-x)" />
              <line x1={p.x} y1={p.y} x2={yEnd.x} y2={yEnd.y} stroke="#22e5c9" strokeWidth={3} markerEnd="url(#pd-y)" />
              <DragHandle x={x} y={y} color="#ffd166" svgRef={svgRef} onDrag={(nx, ny) => { setX(nx); setY(ny); }} />
              <text x={p.x + 12} y={p.y - 14} fill="#ffd166" fontSize="13" fontWeight="bold">(x, y)</text>
              <text x={p.x + 12} y={p.y + 22} fill="#ff5f9e" fontSize="11">∂/∂x</text>
              <text x={p.x + 12} y={p.y + 38} fill="#22e5c9" fontSize="11">∂/∂y</text>
              <circle cx={p.x} cy={p.y} r={5} fill="#ffd166" />
              <circle cx={px.x} cy={px.y} r={5} fill="#a78bfa" fillOpacity={0.8} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Move the yellow point</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "∂f / ∂x", value: fx.toFixed(2), color: "border-[#ff5f9e] text-[#ff5f9e]" },
              { label: "∂f / ∂y", value: fy.toFixed(2), color: "border-[#22e5c9] text-[#22e5c9]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What do the two slopes mean?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            The pink slice asks what happens when <strong className="text-foreground">x changes</strong> but y stays frozen. The green slice does the opposite. Same surface, different questions.
          </p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live point</div>
            <div className="font-mono text-lg space-y-2">
              <div>x = <NumberColor value={x} /></div>
              <div>y = <NumberColor value={y} /></div>
              <div>f(x,y) = <NumberColor value={field(x, y)} /></div>
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Gradient size</div>
            <MathBlock tex="\|\nabla f\|=\sqrt{\left(\frac{\partial f}{\partial x}\right)^2+\left(\frac{\partial f}{\partial y}\right)^2}" />
            <div className="font-mono text-2xl text-[#ffd166] mt-3">{gradMag.toFixed(2)}</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> moving the yellow point changes both slopes instantly. A partial derivative is local information — what the surface is doing right here, right now.</p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(1.75);
  const [y, setY] = useState(1.5);
  const hx = 0.7;
  const hy = 0.7;
  const exactX = 2 * x;
  const exactY = 1.2 * y;
  const secX = (field(x + hx, y) - field(x, y)) / hx;
  const secY = (field(x, y + hy) - field(x, y)) / hy;
  const errX = secX - exactX;
  const errY = secY - exactY;
  const p = toSvg(x, y);
  const px2 = toSvg(x + hx, y);
  const py2 = toSvg(x, y + hy);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">A partial derivative is a tiny “what if?” experiment</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine changing only one setting in a game: turn up the brightness but keep every other setting exactly the same. That controlled experiment is what a partial derivative does mathematically.
        </p>
        <div className="mt-4"><MathBlock tex="\frac{\partial f}{\partial x}=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}{h}" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="deep-partial" color="#a78bfa" /></defs>
              <GridLines />
              <line x1={p.x} y1={p.y} x2={px2.x} y2={px2.y} stroke="#ff5f9e" strokeWidth={3} markerEnd="url(#deep-partial)" />
              <line x1={p.x} y1={p.y} x2={py2.x} y2={py2.y} stroke="#22e5c9" strokeWidth={3} markerEnd="url(#deep-partial)" />
              <circle cx={p.x} cy={p.y} r={7} fill="#ffd166" stroke="white" strokeWidth={2} />
              <circle cx={px2.x} cy={px2.y} r={7} fill="#ff5f9e" />
              <circle cx={py2.x} cy={py2.y} r={7} fill="#22e5c9" />
              <text x={p.x + 12} y={p.y - 12} fill="#ffd166" fontSize="12" fontWeight="bold">start</text>
              <text x={px2.x + 8} y={px2.y - 8} fill="#ff5f9e" fontSize="11">x + h</text>
              <text x={py2.x + 8} y={py2.y - 8} fill="#22e5c9" fontSize="11">y + h</text>
              <DragHandle x={x} y={y} color="#ffd166" svgRef={svgRef} onDrag={(nx, ny) => { setX(nx); setY(ny); }} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow point · change x and y together</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "x-slice slope", value: secX.toFixed(3), color: "border-[#ff5f9e] text-[#ff5f9e]" },
              { label: "y-slice slope", value: secY.toFixed(3), color: "border-[#22e5c9] text-[#22e5c9]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Secant vs. instant slope</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            With a finite step <MathBlock tex="h" inline />, we get a <strong className="text-foreground">secant slope</strong> (average change over a small jump). Make h smaller and it homes in on the partial derivative.
          </p>
          <div className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Current comparison</div>
            <div className="font-mono text-sm">∂f/∂x = {exactX.toFixed(3)}</div>
            <div className="font-mono text-sm">secant x = {secX.toFixed(3)}</div>
            <div className="font-mono text-sm">∂f/∂y = {exactY.toFixed(3)}</div>
            <div className="font-mono text-sm">secant y = {secY.toFixed(3)}</div>
          </div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${Math.abs(errX) + Math.abs(errY) < 1.0 ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]" : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>
            {Math.abs(errX) + Math.abs(errY) < 1.0 ? "✓ Notice how the local slope estimate is close to the true partial derivatives." : "⚠️ Larger steps average over more of the curve, so the estimate is less local."}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">Freeze one variable, change the other, and ask how fast the output reacts. That one idea powers optimization in many dimensions.</p>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const [x, setX] = useState(2);
  const [y, setY] = useState(-1.5);
  const [a, setA] = useState(1.0);
  const [b, setB] = useState(0.6);
  const dfx = 2 * a * x;
  const dfy = 2 * b * y;
  const value = a * x * x + b * y * y;
  const status = dfx * dfy >= 0 ? "Both slopes point the same sign" : "The two slopes point in opposite signs";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Change the inputs. Watch every slope update.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a game’s difficulty formula with several knobs. Turn one knob and ask exactly how much the score changes. Partial derivatives let us measure that effect separately for each input.
        </p>
        <div className="mt-4"><MathBlock tex="f(x,y)=ax^2+by^2,\quad \frac{\partial f}{\partial x}=2ax,\quad \frac{\partial f}{\partial y}=2by" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Controls</h3>
            <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Move x: {x.toFixed(1)}</label>
            <input type="range" min="-4" max="4" step="0.5" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Move y: {y.toFixed(1)}</label>
            <input type="range" min="-4" max="4" step="0.5" value={y} onChange={(e) => setY(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#ffd166] mt-6 mb-2">✦ Change a: {a.toFixed(2)}</label>
            <input type="range" min="0.2" max="2" step="0.1" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#a78bfa] mt-6 mb-2">✦ Change b: {b.toFixed(2)}</label>
            <input type="range" min="0.2" max="1.8" step="0.1" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-full" />
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live formula</div>
            <div className="font-mono text-lg leading-loose">f = ({a.toFixed(2)})({x.toFixed(1)})² + ({b.toFixed(2)})({y.toFixed(1)})²</div>
            <div className="mt-3 text-sm">f = <NumberColor value={value} /></div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Partial derivative readout</div>
            <div className="font-mono text-xl leading-loose">
              <div className="text-[#ff5f9e]">∂f/∂x = 2({a.toFixed(2)})({x.toFixed(1)}) = {dfx.toFixed(2)}</div>
              <div className="text-[#22e5c9]">∂f/∂y = 2({b.toFixed(2)})({y.toFixed(1)}) = {dfy.toFixed(2)}</div>
            </div>
          </div>
          <div className={`border rounded-xl p-6 ${dfx * dfy >= 0 ? "border-[#34d399]/40 bg-[#34d399]/10" : "border-[#fb923c]/40 bg-[#fb923c]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Slope status</div>
            <div className={`font-mono font-bold mt-2 ${dfx * dfy >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}`}>{status}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Gradient magnitude", value: Math.hypot(dfx, dfy).toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Function value", value: value.toFixed(2), color: "border-indigo-400 text-indigo-400" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Try flipping y negative.</strong> The function value stays positive because y is squared, but ∂f/∂y becomes negative. The slope remembers direction even when the function value does not.</p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(1.4);
  const [y, setY] = useState(1.8);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    const width = container.clientWidth;
    const height = 420;
    const camera = new THREE.PerspectiveCamera(50, Math.max(width, 1) / height, 0.1, 100);
    camera.position.set(6.3, 5.8, 6.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    scene.add(new THREE.GridHelper(10, 10, 0x444444, 0x222222));
    const origin = new THREE.Vector3(0, 0, 0);
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 4, 0xff5f9e);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 4, 0x22e5c9);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 4, 0xffd166);
    scene.add(xAxis, yAxis, zAxis);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const gridN = 22;
    for (let i = -gridN; i <= gridN; i++) {
      for (let j = -gridN; j <= gridN; j++) {
        const xx = (i / gridN) * 3.2;
        const yy = (j / gridN) * 3.2;
        const zz = scale * (xx * xx + 0.6 * yy * yy) * 0.28;
        positions.push(xx, zz, yy);
      }
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.055 });
    const surfacePoints = new THREE.Points(geometry, material);
    scene.add(surfacePoints);

    const gradientGeometry = new THREE.BufferGeometry();
    const gradientMaterial = new THREE.LineBasicMaterial({ color: 0xffd166 });
    const gradientLine = new THREE.Line(gradientGeometry, gradientMaterial);
    scene.add(gradientLine);
    const pointGeometry = new THREE.SphereGeometry(0.14, 24, 24);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);

    const update = () => {
      const z = scale * (x * x + 0.6 * y * y) * 0.28;
      const gx = scale * (2 * x) * 0.28;
      const gy = scale * (1.2 * y) * 0.28;
      const gradScale = 0.75;
      point.position.set(x, z, y);
      gradientGeometry.setFromPoints([
        new THREE.Vector3(x, z, y),
        new THREE.Vector3(x + gx * gradScale, z + 0.45, y + gy * gradScale),
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
      const newWidth = container.clientWidth;
      camera.aspect = Math.max(newWidth, 1) / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      gradientGeometry.dispose();
      gradientMaterial.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [x, y, scale]);

  const z = scale * (x * x + 0.6 * y * y) * 0.28;
  const dfx = scale * 2 * x * 0.28;
  const dfy = scale * 1.2 * y * 0.28;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">Partial derivatives are slopes on a surface</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A weather map is not a flat line — temperature can vary left-right and front-back across a city. A 3D surface lets you see both partial slopes at once, plus the direction where the surface climbs fastest.
        </p>
        <div className="mt-4"><MathBlock tex="\nabla f=\left\langle \frac{\partial f}{\partial x},\frac{\partial f}{\partial y}\right\rangle" /></div>
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
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Move X: {x.toFixed(1)}</label>
          <input type="range" min="-3" max="3" step="0.1" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Move Y: {y.toFixed(1)}</label>
          <input type="range" min="-3" max="3" step="0.1" value={y} onChange={(e) => setY(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#a78bfa] mt-5 mb-2">✦ Stretch the surface: {scale.toFixed(2)}</label>
          <input type="range" min="0.35" max="1.2" step="0.05" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">At this point</div>
            <div className="font-mono text-sm space-y-2">
              <div>z = <NumberColor value={z} /></div>
              <div className="text-[#ff5f9e]">∂z/∂x = {dfx.toFixed(2)}</div>
              <div className="text-[#22e5c9]">∂z/∂y = {dfy.toFixed(2)}</div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice:</strong> the gradient points toward the steepest climb. This is the same idea optimization algorithms use to decide how to move through a huge parameter space.</p>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const all: Feature[] = [
    { key: "x", label: "North–South", value: "km", color: "#ff5f9e" },
    { key: "y", label: "East–West", value: "km", color: "#22e5c9" },
    { key: "time", label: "Time", value: "hours", color: "#ffd166" },
    { key: "humidity", label: "Humidity", value: "%", color: "#a78bfa" },
    { key: "wind", label: "Wind", value: "km/h", color: "#6366f1" },
  ];
  const [features, setFeatures] = useState<Feature[]>(all.slice(0, 2));
  const toggle = (key: string) => {
    setFeatures((prev) => prev.some((f) => f.key === key) ? prev.filter((f) => f.key !== key) : [...prev, all.find((f) => f.key === key)!]);
  };
  const heat = 0.8 + features.length * 0.35;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div>
        <h2 className="text-2xl font-bold">A weather map can become a math surface</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a weather app showing a temperature field over a city. The temperature depends on several inputs. Partial derivatives tell you how sensitive that temperature is to one input while the others stay fixed.
        </p>
        <div className="mt-4"><MathBlock tex="T=T(x,y,t,\text{humidity},\text{wind})" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-6 h-[420px] overflow-hidden">
            {Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
              const v = Math.max(0.05, Math.min(1, 0.12 + ((Math.sin(r * 0.8 + c * 0.5) + 1) / 2) * 0.5 * heat / 2));
              return <div key={`${r}-${c}`} className="absolute rounded-md border border-white/5" style={{ left: `${8 + c * 11}%`, top: `${8 + r * 11}%`, width: "9%", height: "9%", background: `rgba(167,139,250,${v})` }} />;
            }))}
            <div className="absolute left-6 top-6 text-[10px] font-mono text-foreground-muted uppercase tracking-widest">City data field</div>
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Toggle features on the right</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Add dimensions to the dataset</h3>
          <div className="grid grid-cols-2 gap-2">
            {all.map((f) => {
              const active = features.some((x) => x.key === f.key);
              return <button key={f.key} onClick={() => toggle(f.key)} className={`border rounded-xl p-3 text-left transition-all ${active ? "bg-[#6366f1]/10" : "bg-background"}`} style={{ borderColor: active ? f.color : "rgba(255,255,255,0.12)" }}>
                <div className="text-xs font-bold font-mono" style={{ color: f.color }}>{active ? "✓" : "+"} {f.label}</div>
                <div className="text-[10px] text-foreground-muted mt-1">{f.value}</div>
              </button>;
            })}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">Feature vector</div>
            <div className="font-mono text-lg leading-loose">[
              {features.map((f, i) => <React.Fragment key={f.key}><span style={{ color: f.color }}>{f.label}</span>{i < features.length - 1 ? <span className="text-foreground-muted">, </span> : null}</React.Fragment>)}
            ]
            </div>
            <div className="text-sm text-foreground-muted mt-2">Dimensions: <span className="text-foreground font-mono">{features.length}</span></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Why this matters:</strong> once real data is represented by many coordinates, partial derivatives let a model ask “which direction matters most?” without losing the other information.</p>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [w1, setW1] = useState(1.1);
  const [w2, setW2] = useState(-0.4);
  const [x1] = useState(1.6);
  const [x2] = useState(1.2);
  const [b, setB] = useState(-0.2);
  const target = 1;
  const z = w1 * x1 + w2 * x2 + b;
  const pred = sigmoid(z);
  const loss = -(target * Math.log(Math.max(pred, 1e-8)));
  const dLdw1 = (pred - target) * x1;
  const dLdw2 = (pred - target) * x2;
  const threshold = 0.5;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Partial Derivatives in Classic AI — Logistic Regression</div>
        <h2 className="text-2xl font-bold">A classifier can feel exactly which weight needs changing</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine an email spam filter with two signals: suspicious words and unusual links. Logistic regression combines those signals, then uses partial derivatives to see how much each weight contributed to the mistake.
        </p>
        <div className="mt-4"><MathBlock tex="\hat{y}=\sigma(z),\quad z=w_1x_1+w_2x_2+b,\quad \frac{\partial L}{\partial w_i}=(\hat{y}-y)x_i" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-5 h-[320px] overflow-hidden">
            <div className="absolute inset-0 opacity-70">
              {Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => {
                const local = sigmoid((c / 11) * 4 - (r / 11) * 4 + z * 0.25);
                return <div key={`${r}-${c}`} className="absolute rounded-sm bg-[#6366f1]" style={{ left: `${c * 8.33}%`, top: `${r * 8.33}%`, width: "7.5%", height: "7.5%", opacity: 0.08 + local * 0.7 }} />;
              }))}
            </div>
            <div className="relative z-10 font-mono text-xs text-foreground-muted">input 1 = {x1.toFixed(1)} · input 2 = {x2.toFixed(1)} · target = {target}</div>
            <div className="relative z-10 mt-10 grid grid-cols-2 gap-4">
              <div className="bg-background/85 border border-[#ff5f9e]/40 rounded-xl p-4">
                <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">weight 1</div>
                <div className="text-3xl font-bold font-mono text-[#ff5f9e] mt-1">{w1.toFixed(2)}</div>
                <div className="text-sm font-mono mt-2">∂L/∂w₁ = {dLdw1.toFixed(3)}</div>
              </div>
              <div className="bg-background/85 border border-[#22e5c9]/40 rounded-xl p-4">
                <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">weight 2</div>
                <div className="text-3xl font-bold font-mono text-[#22e5c9] mt-1">{w2.toFixed(2)}</div>
                <div className="text-sm font-mono mt-2">∂L/∂w₂ = {dLdw2.toFixed(3)}</div>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Move either weight slider</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Change w₁: {w1.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={w1} onChange={(e) => setW1(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Change w₂: {w2.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={w2} onChange={(e) => setW2(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#a78bfa] mt-5 mb-2">✦ Shift the bias b: {b.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Model output</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1]">{pred.toFixed(3)}</div>
            <div className="text-sm font-mono mt-2">loss = {loss.toFixed(3)}</div>
          </div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${pred > threshold ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
            {pred > threshold ? "✓ Model fires — prediction: YES" : "✗ Below threshold — prediction: NO"}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is literally what happens during training: the model measures error, computes partial derivatives for its parameters, and nudges the weights in a better direction.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const [q0, setQ0] = useState(1.2);
  const [q1, setQ1] = useState(0.3);
  const keys = [[1.0, 0.2], [0.1, 1.2], [-0.8, 0.4]];
  const q = [q0, q1];
  const scores = keys.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2);
  const weights = softmax(scores);
  const loss = attentionLoss(q, keys, 0);
  const grads = [0, 1].map((i) => finiteGradient(q, keys, 0, i));
  const maxGrad = Math.max(...grads.map((g) => Math.abs(g)));
  const entropy = -weights.reduce((s, p) => s + p * Math.log(Math.max(p, 1e-8)), 0);
  const argmax = weights.indexOf(Math.max(...weights));
  const cells = [
    [grads[0], grads[1]],
    [weights[0], weights[1]],
  ];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Partial Derivatives in Deep Learning — Transformer Self-Attention</div>
        <h2 className="text-2xl font-bold">Transformers learn by following thousands of tiny partial slopes</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          When a Transformer reads a sentence, attention decides which tokens should influence one another. During training, the model asks a harder question: “How should each internal number change to reduce the loss?” Partial derivatives answer that question.
        </p>
        <div className="mt-4"><MathBlock tex="\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-4">Live attention + gradient heatmap</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-[#6366f1] mb-2">Gradient / sensitivity</div>
                <div className="grid grid-cols-2 gap-2">
                  {cells[0].map((v, i) => <div key={`g${i}`} className="aspect-square rounded-lg flex items-center justify-center border border-[#6366f1]/30" style={{ background: `rgba(99,102,241,${Math.min(0.85, 0.12 + Math.abs(v) * 0.7)})` }}><span className="font-mono text-sm">{v.toFixed(3)}</span></div>)}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-[#a78bfa] mb-2">Attention weights</div>
                <div className="grid grid-cols-3 gap-2">
                  {weights.map((v, i) => <div key={`w${i}`} className="aspect-square rounded-lg flex items-center justify-center border border-[#a78bfa]/30" style={{ background: `rgba(167,139,250,${Math.max(0.08, Math.min(0.95, v))})` }}><span className="font-mono text-sm">{v.toFixed(2)}</span></div>)}
                </div>
              </div>
            </div>
            <div className="mt-5 bg-background/70 border border-border rounded-xl p-4">
              <div className="text-xs font-mono text-foreground-muted">Target token = key 1 · live loss = {loss.toFixed(3)}</div>
              <div className="text-sm text-foreground-muted mt-2">The top-left heatmap values tell you how sensitive the loss is to the query components.</div>
            </div>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Move either query slider</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Change Q₁: {q0.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={q0} onChange={(e) => setQ0(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Change Q₂: {q1.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Live metrics</div>
            <div className="grid grid-cols-3 gap-2 font-mono text-sm">
              <div>max |grad|<br /><span className="text-[#6366f1]">{maxGrad.toFixed(3)}</span></div>
              <div>entropy<br /><span className="text-[#a78bfa]">{entropy.toFixed(3)}</span></div>
              <div>focus<br /><span className="text-[#ffd166]">key {argmax + 1}</span></div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            <strong className="text-foreground">This exact operation</strong> is part of Transformer training. Every parameter receives partial-derivative signals through backpropagation so the model can reduce its loss when you train it on text.
          </p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Partial derivative", desc: "Change one input while freezing the others.", color: "#ffd166" },
    { label: "Controlled slice", desc: "Turn a multivariable function into a one-variable view.", color: "#ff5f9e" },
    { label: "Local slope", desc: "Measure how fast the output reacts near one point.", color: "#22e5c9" },
    { label: "3D gradient", desc: "Combine partial slopes into a direction of steepest climb.", color: "#a78bfa" },
    { label: "Feature-rich data", desc: "Represent real systems with many measurable inputs.", color: "#34d399" },
    { label: "Logistic Regression", desc: "Use partial derivatives to update classifier weights.", color: "#6366f1" },
    { label: "Transformer Self-Attention", desc: "Backpropagate sensitivity through attention calculations.", color: "#6366f1" },
    { label: "Gradient-based training", desc: "Repeat tiny updates across millions of parameters.", color: "#ffd166" },
  ];
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">8 · Concept Map</div>
        <h2 className="text-2xl font-bold">From one slope to modern AI</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3">The whole story is surprisingly short: freeze some variables, measure one slope, combine those slopes, and let a model use them to improve.</p>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{ borderColor: `${n.color}55` }}>
              <div className="text-xs font-bold font-mono" style={{ color: n.color }}>{n.label}</div>
              <div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">Partial derivatives are basically the math version of changing one setting at a time and seeing exactly what it does.</p>
      <Link href="/calculus" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Calculus</Link>
    </footer>
  );
}

export default function PartialDerivativesPage() {
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
