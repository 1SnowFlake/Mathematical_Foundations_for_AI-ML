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
    const vp = toSvg(i, 0), hp = toSvg(0, i), bold = i === 0;
    lines.push(
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />,
    );
    if (i !== 0) {
      lines.push(
        <text key={`lv${i}`} x={vp.x} y={OY + 16} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>,
        <text key={`lh${i}`} x={OX - 14} y={hp.y + 3.5} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>,
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

function NumberColor({ value, digits = 2 }: { value: number; digits?: number }) {
  return <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>{value.toFixed(digits)}</span>;
}

function normalPdf(x: number, mu: number, sigma: number) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

function normalCdfApprox(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Probability &amp; Statistics · Topic 1
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What are{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Distributions?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine rolling a game die thousands of times. You do not just care about one roll — you care about the <strong className="text-foreground">whole pattern of outcomes</strong>. A probability distribution is a map that tells you how likely each outcome is.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Some distributions describe countable outcomes like 0, 1, 2, 3 goals. Others describe measurements like height, time, or temperature. The shape of the distribution lets us talk about typical values, unusual events, and uncertainty.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI, distributions are everywhere: classifiers output probabilities, generative models sample from distributions, and Bayesian models use distributions to represent uncertainty.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(0.8);
  const mu = 0;
  const sigma = 1;
  const density = normalPdf(x, mu, sigma);
  const z = (x - mu) / sigma;
  const cdf = normalCdfApprox(z);

  const points: string[] = [];
  for (let i = -4; i <= 4.001; i += 0.2) {
    const y = normalPdf(i, mu, sigma);
    const p = toSvg(i, y * 5.8);
    points.push(`${p.x},${p.y}`);
  }
  const px = toSvg(x, density * 5.8);
  const baseline = toSvg(x, 0);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">A distribution is a map of “how likely?”</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a music app counting how many times a song gets played. A distribution turns thousands of observations into a shape you can inspect. Drag the point and ask: <em>how much probability is around here?</em>
        </p>
        <div className="mt-4"><MathBlock tex="f(x)=\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="dist-point" color="#ffd166" /></defs>
              <GridLines />
              <polyline points={points.join(" ")} fill="none" stroke="#a78bfa" strokeWidth={4} strokeLinecap="round" />
              <line x1={baseline.x} y1={baseline.y} x2={px.x} y2={px.y} stroke="#ffd166" strokeDasharray="6 5" strokeWidth={2} markerEnd="url(#dist-point)" />
              <circle cx={px.x} cy={px.y} r={8} fill="#ffd166" stroke="white" strokeWidth={2} />
              <text x={px.x + 12} y={px.y - 12} fill="#ffd166" fontSize="13" fontWeight="bold">x = {x.toFixed(2)}</text>
              <text x={OX + 170} y={toSvg(0, 0).y - 24} fill="#a78bfa" fontSize="13" fontWeight="bold">Normal distribution</text>
              <text x={OX - 220} y={OY + 52} fill="rgba(255,255,255,0.35)" fontSize="10">outcome</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Move x across the curve</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Density at x", value: density.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "P(X ≤ x)", value: cdf.toFixed(3), color: "border-indigo-400 text-indigo-400" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What are you seeing?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            The bell curve is a <strong className="text-foreground">probability density function</strong> (a curve whose area represents probability). The height at one exact point is density, not probability by itself.
          </p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live position</div>
            <div className="font-mono text-lg">z = <NumberColor value={z} /></div>
            <div className="text-xs text-foreground-muted mt-2">z tells you how many standard deviations x is from the mean.</div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Probability idea</div>
            <MathBlock tex="P(a\le X\le b)=\int_a^b f(x)\,dx" />
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> moving x changes both the local height and the cumulative probability. The distribution is telling you about the entire range of outcomes, not just one number.</p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1.2);
  const [x, setX] = useState(1.2);
  const density = normalPdf(x, mu, sigma);
  const standardized = (x - mu) / sigma;
  const spread = sigma > 1.35;

  const pts: string[] = [];
  for (let i = -4.5; i <= 4.5; i += 0.15) {
    const y = normalPdf(i, mu, sigma);
    const p = toSvg(i, y * 6.0);
    pts.push(`${p.x},${p.y}`);
  }
  const p = toSvg(x, density * 6.0);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">Mean moves the center. Spread changes the shape.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a playlist with an “average song length.” The <strong className="text-foreground">mean</strong> tells you where the center sits, while the <strong className="text-foreground">standard deviation</strong> tells you how spread out the values are. Drag the pink point or use the sliders to reshape the curve.
        </p>
        <div className="mt-4"><MathBlock tex="Z=\frac{X-\mu}{\sigma}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              <polyline points={pts.join(" ")} fill="none" stroke="#ff5f9e" strokeWidth={4} />
              <line x1={toSvg(mu, 0).x} y1={toSvg(mu, 0).y} x2={toSvg(mu, 2.0).x} y2={toSvg(mu, 2.0).y} stroke="#22e5c9" strokeDasharray="5 5" />
              <DragHandle x={x} y={density * 6.0} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setX(nx)} />
              <text x={toSvg(mu, 2.0).x + 8} y={toSvg(mu, 2.0).y - 8} fill="#22e5c9" fontSize="12" fontWeight="bold">mean μ</text>
              <text x={p.x + 12} y={p.y - 10} fill="#ffd166" fontSize="12" fontWeight="bold">x</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow point · use sliders to reshape</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "z-score", value: standardized.toFixed(2), color: "border-[#34d399] text-[#34d399]" },
              { label: "Density", value: density.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What changes the distribution?</h3>
          <label className="block text-xs font-mono text-[#22e5c9] mb-2">✦ Move the mean μ: {mu.toFixed(1)}</label>
          <input type="range" min="-2" max="2" step="0.1" value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#a78bfa] mt-5 mb-2">✦ Change the spread σ: {sigma.toFixed(1)}</label>
          <input type="range" min="0.6" max="2.2" step="0.1" value={sigma} onChange={(e) => setSigma(Number(e.target.value))} className="w-full" />
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${spread ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]" : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>
            {spread ? "✓ Notice how a larger σ spreads probability across more outcomes." : "⚠️ Smaller σ packs the curve tightly around the mean."}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Current model</div>
            <MathBlock tex="X\sim\mathcal{N}(\mu,\sigma^2)" />
            <div className="font-mono text-xl mt-3">X ∼ N(<span className="text-[#22e5c9]">{mu.toFixed(1)}</span>, <span className="text-[#a78bfa]">{(sigma * sigma).toFixed(2)}</span>)</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [p1, setP1] = useState(0.2);
  const [p2, setP2] = useState(0.3);
  const [dragX, setDragX] = useState(-0.5);
  const p0 = Math.max(0, 1 - p1 - p2);
  const values = [-1, 0, 1];
  const probs = [p0, p1, p2];
  const mean = values.reduce((s, v, i) => s + v * probs[i], 0);
  const second = values.reduce((s, v, i) => s + (v * v) * probs[i], 0);
  const variance = second - mean * mean;
  const std = Math.sqrt(Math.max(variance, 0));
  const isValid = p1 + p2 <= 1;

  const bars = values.map((v, i) => {
    const top = toSvg(v, probs[i] * 7);
    const base = toSvg(v, 0);
    return { top, base, p: probs[i], v };
  });

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Turn probabilities into mean and variance.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine tracking the number of goals in a match: 0, 1, or 2. The probability distribution lets you calculate a typical result and how unpredictable the results are. Move the sliders and drag the yellow marker.
        </p>
        <div className="mt-4"><MathBlock tex="\mathbb{E}[X]=\sum_x xP(X=x),\qquad \operatorname{Var}(X)=\mathbb{E}[X^2]-\mathbb{E}[X]^2" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              {bars.map((b, i) => <rect key={b.v} x={b.top.x - 10} y={b.top.y} width={20} height={b.base.y - b.top.y} rx={5} fill={i === 0 ? "#ff5f9e" : i === 1 ? "#22e5c9" : "#a78bfa"} fillOpacity={0.8} />)}
              <DragHandle x={dragX} y={Math.max(0.1, normalPdf(dragX, mean * 1.5, Math.max(std, 0.5)) * 5)} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setDragX(nx)} />
              <text x={OX + 150} y={45} fill="#ffd166" fontSize="13" fontWeight="bold">live discrete distribution</text>
              <text x={OX - 10} y={OY + 30} fill="rgba(255,255,255,0.35)" fontSize="10">0</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow marker · adjust p(0) and p(1)</div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Set P(X=−1): {p1.toFixed(2)}</label>
          <input type="range" min="0" max="0.8" step="0.05" value={p1} onChange={(e) => setP1(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Set P(X=1): {p2.toFixed(2)}</label>
          <input type="range" min="0" max="0.8" step="0.05" value={p2} onChange={(e) => setP2(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live calculation</div>
            <div className="font-mono text-sm leading-loose">
              E[X] = (−1)(<span className="text-[#ff5f9e]">{p0.toFixed(2)}</span>) + 0(<span className="text-[#22e5c9]">{p1.toFixed(2)}</span>) + 1(<span className="text-[#a78bfa]">{p2.toFixed(2)}</span>)
            </div>
            <div className="mt-3 text-4xl font-extrabold font-mono"><NumberColor value={mean} /></div>
            <div className="mt-3 font-mono text-sm">Var(X) = {variance.toFixed(3)} · SD = {std.toFixed(3)}</div>
          </div>
          <div className={`border rounded-xl p-4 ${isValid ? "border-[#34d399]/40 bg-[#34d399]/10" : "border-[#fb923c]/40 bg-[#fb923c]/10"}`}>
            <div className={`font-mono font-bold ${isValid ? "text-[#34d399]" : "text-[#fb923c]"}`}>{isValid ? "✓ Probabilities sum to a valid distribution." : "⚠️ Probabilities cannot add above 1."}</div>
            <div className="text-xs text-foreground-muted mt-2">P(X=0) = {p0.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0.8);
  const [y, setY] = useState(0.6);
  const [z, setZ] = useState(0.6);
  const probeDensity = Math.exp(-0.5 * (x * x + y * y)) * z;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    const width = container.clientWidth;
    const height = 420;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(6, 6, 7);

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

    const geom = new THREE.BufferGeometry();
    const verts: number[] = [];
    const size = 20;
    for (let iy = 0; iy <= size; iy++) {
      const yy = -3 + (iy / size) * 6;
      for (let ix = 0; ix <= size; ix++) {
        const xx = -3 + (ix / size) * 6;
        const zz = Math.exp(-0.5 * (xx * xx + yy * yy)) * 3.6;
        verts.push(xx, zz, yy);
      }
    }
    const idx: number[] = [];
    for (let iy = 0; iy < size; iy++) {
      for (let ix = 0; ix < size; ix++) {
        const a = iy * (size + 1) + ix;
        const b = a + 1;
        const c = a + (size + 1);
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(idx);
    geom.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.9 });
    const surface = new THREE.Mesh(geom, mat);
    scene.add(surface);

    const pointGeometry = new THREE.SphereGeometry(0.16, 20, 20);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);
    point.position.set(x, Math.exp(-0.5 * (x * x + y * y)) * 3.6, y);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      point.position.set(x, Math.exp(-0.5 * (x * x + y * y)) * 3.6 * z, y);
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
      geom.dispose();
      mat.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [x, y, z]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">From a curve to a probability surface</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Real data often has more than one variable — for example, study time and exam score. A <strong className="text-foreground">joint distribution</strong> describes how combinations of variables behave together. Here, the height acts like density.
        </p>
        <div className="mt-4"><MathBlock tex="f(x,y)=\frac{1}{2\pi}e^{-\frac{x^2+y^2}{2}}" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl overflow-hidden" ref={containerRef} style={{ height: 420 }} />
          <div className="relative -mt-10 ml-3 inline-block bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Probe the 3D distribution</h3>
          {[{ label: "X", value: x, setter: setX, color: "#ff5f9e" }, { label: "Y", value: y, setter: setY, color: "#22e5c9" }, { label: "Z / height scale", value: z, setter: setZ, color: "#ffd166" }].map((a) => (
            <div key={a.label}>
              <div className="text-xs font-mono mb-2" style={{ color: a.color }}>✦ Move {a.label}: {a.value.toFixed(1)}</div>
              <input type="range" min="-2.5" max="2.5" step="0.1" value={a.value} onChange={(e) => a.setter(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Probe vector</div>
            <div className="font-mono text-xl">[ <span className="text-[#ff5f9e]">{x.toFixed(1)}</span>, <span className="text-[#22e5c9]">{y.toFixed(1)}</span>, <span className="text-[#ffd166]">{z.toFixed(1)}</span> ]</div>
            <div className="text-sm text-foreground-muted mt-2">local density signal ≈ <span className="text-[#a78bfa] font-mono">{probeDensity.toFixed(3)}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<string[]>(["study", "sleep"]);
  const [x, setX] = useState(1.5);
  const features = [
    { key: "study", label: "Study hours", value: "3.5", color: "#ff5f9e" },
    { key: "sleep", label: "Sleep hours", value: "7.2", color: "#22e5c9" },
    { key: "screen", label: "Screen time", value: "2.8", color: "#a78bfa" },
    { key: "focus", label: "Focus score", value: "0.84", color: "#ffd166" },
  ];
  const mean = active.length ? active.length * 1.7 : 0;
  const density = normalPdf(x, mean / 2, 1.1);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div>
        <h2 className="text-2xl font-bold">A real person becomes a point in a feature distribution</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a student dashboard. “Student” is not a useful number by itself, but study time, sleep, screen time, and focus can become a <strong className="text-foreground">feature vector</strong> (a list of numerical measurements). Across many students, those vectors form distributions.
        </p>
        <div className="mt-4"><MathBlock tex="\mathbf{x}=\begin{bmatrix}x_1\\x_2\\\vdots\\x_d\end{bmatrix}" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              <polyline points={Array.from({ length: 45 }, (_, i) => { const xx = -4.5 + i * 0.2; const yy = normalPdf(xx, mean / 2, 1.1) * 7; const q = toSvg(xx, yy); return `${q.x},${q.y}`; }).join(" ")} fill="none" stroke="#34d399" strokeWidth={4} />
              <DragHandle x={x} y={density * 7} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setX(nx)} />
              <text x={OX + 110} y={55} fill="#34d399" fontSize="13" fontWeight="bold">student-score distribution</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow student marker</div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Toggle the features that matter</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => {
              const on = active.includes(f.key);
              return (
                <button key={f.key} onClick={() => setActive((a) => on ? a.filter((k) => k !== f.key) : [...a, f.key])} className={`text-left rounded-xl border p-3 transition-all ${on ? "bg-background border-border" : "bg-background/40 border-border/40 opacity-60"}`}>
                  <div className="text-xs font-mono" style={{ color: f.color }}>{on ? "✓" : "＋"} {f.label}</div>
                  <div className="text-lg font-bold font-mono mt-1">{f.value}</div>
                </button>
              );
            })}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Feature vector</div>
            <div className="font-mono text-lg">[</div>
            {active.map((key) => { const f = features.find((z) => z.key === key)!; return <div key={key} className="ml-4" style={{ color: f.color }}>{f.value}</div>; })}
            <div className="font-mono text-lg">]</div>
            <div className="text-xs text-foreground-muted mt-2">Dimensions: <span className="font-mono text-foreground">{active.length}</span></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">Drop one feature and the representation changes dimension. That sounds simple, but it is one of the key ideas behind turning messy real-world data into something an AI model can learn from.</p>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [priorA, setPriorA] = useState(0.6);
  const [likelihoodA, setLikelihoodA] = useState(0.8);
  const [priorB, setPriorB] = useState(0.4);
  const [likelihoodB, setLikelihoodB] = useState(0.3);
  const pa = priorA * likelihoodA;
  const pb = priorB * likelihoodB;
  const probs = softmax([Math.log(Math.max(pa, 1e-6)), Math.log(Math.max(pb, 1e-6))]);
  const out = probs[0];
  const threshold = 0.5;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Distributions in Classic AI — Naive Bayes</div>
        <h2 className="text-2xl font-bold">Spam filters think in distributions</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how an email app labels some messages as spam? A Naive Bayes classifier uses probability distributions to combine clues. Each clue changes how believable a class is.
        </p>
        <div className="mt-4"><MathBlock tex="P(C\mid X)\propto P(C)\prod_i P(x_i\mid C)" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-mono text-[#ff5f9e] mb-2">Spam prior</div>
              <input type="range" min="0.1" max="0.9" step="0.05" value={priorA} onChange={(e) => setPriorA(Number(e.target.value))} className="w-full" />
              <div className="text-sm font-mono mt-2">P(spam) = {priorA.toFixed(2)}</div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-mono text-[#22e5c9] mb-2">Spam clue likelihood</div>
              <input type="range" min="0.05" max="0.95" step="0.05" value={likelihoodA} onChange={(e) => setLikelihoodA(Number(e.target.value))} className="w-full" />
              <div className="text-sm font-mono mt-2">P(clue|spam) = {likelihoodA.toFixed(2)}</div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-mono text-[#a78bfa] mb-2">Normal prior</div>
              <input type="range" min="0.1" max="0.9" step="0.05" value={priorB} onChange={(e) => setPriorB(Number(e.target.value))} className="w-full" />
              <div className="text-sm font-mono mt-2">P(normal) = {priorB.toFixed(2)}</div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-mono text-[#ffd166] mb-2">Normal clue likelihood</div>
              <input type="range" min="0.05" max="0.95" step="0.05" value={likelihoodB} onChange={(e) => setLikelihoodB(Number(e.target.value))} className="w-full" />
              <div className="text-sm font-mono mt-2">P(clue|normal) = {likelihoodB.toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live posterior</div>
            <div className="font-mono text-xl">score(spam) = {pa.toFixed(3)} · score(normal) = {pb.toFixed(3)}</div>
            <div className="mt-2 text-4xl font-extrabold font-mono text-[#6366f1]">{out.toFixed(3)}</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${out > threshold ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
            {out > threshold ? "✓ Model fires — prediction: SPAM" : "✗ Below threshold — prediction: NORMAL"}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">What the distribution is doing</div>
            <p className="text-sm text-foreground-muted leading-relaxed">The model starts with a prior belief, multiplies it by how well the observed clue matches each class, then normalizes the scores into probabilities.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-3 bg-background/60 border-[#34d399] text-[#34d399]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Spam probability</div><div className="text-2xl font-bold font-mono mt-1">{out.toFixed(2)}</div></div>
            <div className="border rounded-xl p-3 bg-background/60 border-[#a78bfa] text-[#a78bfa]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Normal probability</div><div className="text-2xl font-bold font-mono mt-1">{(1 - out).toFixed(2)}</div></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is literally what happens inside a classic Bayesian classifier when you get a new email: the model combines probability distributions from the training data to update its belief about the message.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [noise, setNoise] = useState(0.45);
  const [x, setX] = useState(0.5);
  const [schedule, setSchedule] = useState(0.8);
  const values = Array.from({ length: 16 }, (_, i) => {
    const gx = (i % 4) - 1.5;
    const gy = Math.floor(i / 4) - 1.5;
    return Math.exp(-0.45 * (gx * gx + gy * gy)) * (1 - noise) + Math.sin(i * 1.7 + x * 2.5) * 0.08 * schedule + noise * 0.12;
  });
  const positive = values.map((v) => Math.max(0, v));
  const norm = positive.map((v) => v / Math.max(...positive, 1e-8));
  const avg = norm.reduce((a, b) => a + b, 0) / norm.length;
  const max = Math.max(...norm);
  const entropy = -norm.reduce((s, p) => { const q = Math.max(p / (norm.reduce((a, b) => a + b, 0) || 1), 1e-8); return s + q * Math.log(q); }, 0);
  const cells = norm.map((v) => Math.min(1, 0.05 + v * 0.95));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Distributions in Deep Learning — Diffusion Models</div>
        <h2 className="text-2xl font-bold">Generative AI starts by adding and then removing noise</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Modern image generators use a sequence of probability distributions. The forward process adds Gaussian noise; the neural network learns the reverse process so it can turn noisy patterns into meaningful images.
        </p>
        <div className="mt-4"><MathBlock tex="q(x_t\mid x_{t-1})=\mathcal{N}(\sqrt{1-\beta_t}\,x_{t-1},\beta_t I),\qquad p_\theta(x_{t-1}\mid x_t)" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-4">Probability heatmap</div>
            <svg ref={svgRef} viewBox="0 0 360 300" className="w-full rounded-xl bg-background select-none touch-none">
              {cells.map((v, i) => { const row = Math.floor(i / 4); const col = i % 4; return <rect key={i} x={col * 78 + 24} y={row * 58 + 14} width={70} height={50} rx={7} fill="#6366f1" fillOpacity={v} />; })}
              {cells.map((v, i) => { const row = Math.floor(i / 4); const col = i % 4; return <text key={`t${i}`} x={col * 78 + 59} y={row * 58 + 44} textAnchor="middle" fill="white" fontSize="11" className="font-mono">{v.toFixed(2)}</text>; })}
              <DragHandle x={x * 2 - 1} y={1.8 - noise * 2} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setX(Math.max(0, Math.min(1, (nx + 1) / 2)))} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the yellow probe or change noise/schedule</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Max probability", value: max.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Average signal", value: avg.toFixed(2), color: "border-[#34d399] text-[#34d399]" },
              { label: "Entropy-like spread", value: Math.abs(entropy).toFixed(2), color: "border-indigo-400 text-indigo-400" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Increase noise β: {noise.toFixed(2)}</label>
          <input type="range" min="0.05" max="0.95" step="0.05" value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Move denoising probe: {x.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.01" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#ffd166] mt-5 mb-2">✦ Adjust schedule strength: {schedule.toFixed(2)}</label>
          <input type="range" min="0.2" max="1.4" step="0.05" value={schedule} onChange={(e) => setSchedule(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Noise step</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1]">t = {Math.round(noise * 100)}</div>
            <div className="text-sm text-foreground-muted mt-2">Higher t means the sample is pushed toward a broader noisy distribution.</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3"><strong className="text-foreground">Why does this matter?</strong> Diffusion models repeatedly reason about probability distributions while generating an image. Understanding distributions means understanding the uncertainty they manipulate at every denoising step.</p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Distribution", desc: "A rule describing how likely outcomes are.", color: "#ffd166" },
    { label: "PMF / PDF", desc: "Discrete probabilities or continuous density.", color: "#ff5f9e" },
    { label: "Mean & Variance", desc: "Center and spread of uncertainty.", color: "#22e5c9" },
    { label: "Joint Distribution", desc: "Several variables modeled together.", color: "#a78bfa" },
    { label: "Feature Vector", desc: "Real-world data becomes numerical input.", color: "#34d399" },
    { label: "Naive Bayes", desc: "Classic AI combines probability clues.", color: "#6366f1" },
    { label: "Noise Process", desc: "A distribution can be used to corrupt data.", color: "#fb923c" },
    { label: "Diffusion Models", desc: "Generative AI learns to reverse noise.", color: "#6366f1" },
  ];
  return (
    <section className="space-y-6">
      <div><div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">8 · Concept Map</div><h2 className="text-2xl font-bold">The whole journey, in one screen</h2></div>
      <div className="bg-surface border border-border rounded-2xl p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{nodes.map((n) => <div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{ borderColor: `${n.color}55` }}><div className="text-xs font-bold font-mono" style={{ color: n.color }}>{n.label}</div><div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div></div>)}</div></div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">A distribution is the shape of uncertainty — it tells you what outcomes are common, what outcomes are rare, and how an AI model can reason about both.</p>
      <Link href="/probability" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Probability &amp; Statistics</Link>
    </footer>
  );
}

export default function DistributionsPage() {
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
