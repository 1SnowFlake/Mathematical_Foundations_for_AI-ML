"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H}
        stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
        strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y}
        stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
        strokeWidth={bold ? 1.5 : 1} />,
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
      cx={p.x} cy={p.y} r={10} fill={color} fillOpacity={0.9} stroke="white" strokeWidth={2}
      style={{ cursor: "grab", filter: `drop-shadow(0 0 6px ${color})` }}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        if (!dragging.current || !svgRef.current) return;
        const r = svgRef.current.getBoundingClientRect();
        const g = toGrid(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
        onDrag(clamp(g.x), clamp(g.y));
      }}
      onPointerUp={(e) => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
    />
  );
}

function NumberColor({ value, digits = 2 }: { value: number; digits?: number }) {
  return <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>{value.toFixed(digits)}</span>;
}

function weightedExpectedValue(values: number[], probabilities: number[]) {
  return values.reduce((sum, value, i) => sum + value * probabilities[i], 0);
}

function normalize(values: number[]) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  return values.map(v => v / total);
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-xs font-mono mb-2" style={{ color }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Probability &amp; Statistics · Topic 3
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Expected Value?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine opening a game reward chest. You might get 10 coins, 50 coins, or a super-rare 500-coin prize. <strong className="text-foreground">Expected value is the long-run average payoff you would get if you could repeat the same random situation many times.</strong>
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          It does not tell you what happens on the next try. It combines every possible outcome with its probability, so unlikely jackpots count less than common small rewards.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI, this same weighted-average idea appears in decision making, reinforcement learning, and Transformer attention whenever a model combines many possible outcomes according to their probabilities.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [jackpotChance, setJackpotChance] = useState(0.2);
  const outcomes = [10, 50, 500];
  const base = [0.62, Math.max(0.08, 0.38 - jackpotChance), jackpotChance];
  const probabilities = normalize(base);
  const ev = weightedExpectedValue(outcomes, probabilities);
  const jackpotX = -3.2 + jackpotChance * 6.2;
  const meanPoint = toSvg((ev - 50) / 90, 0.9);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">Expected value is the balance point of randomness</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a prize wheel. The center of mass is not necessarily one of the prizes. Expected value is similar: it lands at the probability-weighted average of all the outcomes.
        </p>
        <div className="mt-4"><MathBlock tex="E[X]=\sum_i x_iP(X=x_i)" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs>
                <ArrowMarker id="ev-mean" color="#ffd166" />
                <ArrowMarker id="ev-outcome" color="#ff5f9e" />
              </defs>
              <GridLines />
              <line x1={60} y1={OY - 20} x2={420} y2={OY - 20} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />

              {[10, 50, 500].map((v, i) => {
                const x = 100 + i * 140;
                const h = 90 + probabilities[i] * 170;
                return (
                  <g key={v}>
                    <rect x={x - 34} y={OY - 20 - h} width={68} height={h} rx={10} fill={i === 2 ? "#a78bfa" : i === 1 ? "#22e5c9" : "#ff5f9e"} fillOpacity={0.22} stroke={i === 2 ? "#a78bfa" : i === 1 ? "#22e5c9" : "#ff5f9e"} strokeOpacity={0.65} />
                    <text x={x} y={OY + 12} fill="rgba(255,255,255,0.55)" textAnchor="middle" fontSize="11">₹{v}</text>
                    <text x={x} y={OY - 30 - h} fill="rgba(255,255,255,0.65)" textAnchor="middle" fontSize="11">{(probabilities[i] * 100).toFixed(0)}%</text>
                  </g>
                );
              })}

              <line x1={meanPoint.x} y1={OY - 250} x2={meanPoint.x} y2={OY - 20} stroke="#ffd166" strokeWidth={4} markerEnd="url(#ev-mean)" />
              <text x={meanPoint.x + 10} y={OY - 260} fill="#ffd166" fontSize="13" fontWeight="bold">expected value</text>

              <DragHandle
                x={jackpotX}
                y={-2.7}
                color="#a78bfa"
                svgRef={svgRef}
                onDrag={(nx) => setJackpotChance(Math.max(0.05, Math.min(0.25, (nx + 3.2) / 6.2)))}
              />
              <text x={60} y={40} fill="rgba(255,255,255,0.35)" fontSize="10">more purple = more jackpot probability</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Change the jackpot chance</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Jackpot chance", value: `${(jackpotChance * 100).toFixed(0)}%`, color: "border-[#a78bfa] text-[#a78bfa]" },
              { label: "Expected value", value: `₹${ev.toFixed(1)}`, color: "border-[#ffd166] text-[#ffd166]" },
            ].map(s => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Why is the answer not ₹500?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Each prize is multiplied by how often it appears. The huge prize has a big value, but its small probability keeps it from dominating the average.
          </p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live expected value</div>
            <div className="font-mono text-lg">E[X] = <NumberColor value={ev} /></div>
            <div className="text-xs text-foreground-muted mt-2">That is a long-run average, not a promise for one chest.</div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Weighted pieces</div>
            <div className="font-mono text-sm space-y-1">
              <div><span className="text-[#ff5f9e]">10</span> × {probabilities[0].toFixed(2)}</div>
              <div><span className="text-[#22e5c9]">50</span> × {probabilities[1].toFixed(2)}</div>
              <div><span className="text-[#a78bfa]">500</span> × {probabilities[2].toFixed(2)}</div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> making the rare prize more likely pulls the expected value toward ₹500 even though the prize values themselves never change.</p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pRare, setPRare] = useState(0.18);
  const pCommon = Math.max(0, 0.72 - pRare);
  const pMedium = 1 - pCommon - pRare;
  const probs = [pCommon, pMedium, pRare];
  const values = [20, 100, 420];
  const ev = weightedExpectedValue(values, probs);
  const spread = values[2] - ev;
  const unstable = spread > 300 && pRare > 0.2;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">Probability pulls the average toward each outcome</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a playlist. A song you hear 80% of the time should matter more to your “typical listening experience” than a song you hear once. Expected value uses the same weighting rule.
        </p>
        <div className="mt-4"><MathBlock tex="E[X]=x_1p_1+x_2p_2+x_3p_3" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              {[0, 1, 2].map(i => {
                const x = 90 + i * 150;
                const h = 70 + probs[i] * 250;
                const c = i === 0 ? "#ff5f9e" : i === 1 ? "#22e5c9" : "#a78bfa";
                return <g key={i}><rect x={x - 40} y={390 - h} width={80} height={h} rx={10} fill={c} fillOpacity={0.22} stroke={c} strokeOpacity={0.7} /><text x={x} y={405} fill={c} textAnchor="middle" fontSize="12" fontWeight="bold">₹{values[i]}</text><text x={x} y={390 - h - 12} fill="rgba(255,255,255,0.65)" textAnchor="middle" fontSize="11">{(probs[i] * 100).toFixed(0)}%</text></g>;
              })}
              <line x1={OX - 150} y1={60} x2={OX + 150} y2={60} stroke="#ffd166" strokeWidth={3} />
              <circle cx={OX + (ev - 200) * 0.6} cy={60} r={8} fill="#ffd166" stroke="white" strokeWidth={2} />
              <text x={OX - 145} y={45} fill="#ffd166" fontSize="12" fontWeight="bold">balance point = ₹{ev.toFixed(1)}</text>
              <DragHandle x={pRare * 8 - 2.2} y={-3.7} color="#a78bfa" svgRef={svgRef} onDrag={(nx) => setPRare(Math.max(0.05, Math.min(0.3, (nx + 2.2) / 8)))} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the purple dot: change rare-outcome probability</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Expected value", value: `₹${ev.toFixed(1)}`, color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Rare-outcome pull", value: `₹${spread.toFixed(1)}`, color: spread >= 0 ? "border-[#a78bfa] text-[#a78bfa]" : "border-[#fb923c] text-[#fb923c]" },
            ].map(s => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Three outcomes, one average</h3>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${unstable ? "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]" : "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"}`}>
            {unstable ? "⚠️ Warning — rare high rewards are pulling the average sharply." : "✓ Notice how common outcomes keep the average anchored."}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Current probabilities</div>
            <div className="font-mono text-sm space-y-1"><div><span className="text-[#ff5f9e]">p₁</span> = {pCommon.toFixed(2)}</div><div><span className="text-[#22e5c9]">p₂</span> = {pMedium.toFixed(2)}</div><div><span className="text-[#a78bfa]">p₃</span> = {pRare.toFixed(2)}</div></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">The probabilities always add to 1. Increasing one probability forces probability away from the others, so the expected value moves rather than simply “adding” another outcome.</p>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const [pA, setPA] = useState(20);
  const [pB, setPB] = useState(30);
  const [a, setA] = useState(10);
  const [b, setB] = useState(60);
  const [c, setC] = useState(-20);
  const p1 = pA / 100;
  const p2 = pB / 100;
  const p3 = Math.max(0, 1 - p1 - p2);
  const ev = weightedExpectedValue([a, b, c], [p1, p2, p3]);
  const valid = pA + pB <= 100;
  const status = !valid ? "Probabilities cannot add past 100%" : ev > 0 ? "Positive expected payoff" : ev < 0 ? "Negative expected payoff" : "Break-even expected payoff";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Change the probabilities and payoffs yourself</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">This is where the formula becomes a calculation engine. Choose the probability of two outcomes and the third probability is whatever remains. Then change the outcomes and watch the expected value update instantly.</p>
        <div className="mt-4"><MathBlock tex="E[X]=\sum_i x_ip_i" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Probability controls</h3>
            <SliderControl label={`✦ p₁ = ${pA}%`} value={pA} min={0} max={100} step={1} color="#ff5f9e" onChange={setPA} />
            <SliderControl label={`✦ p₂ = ${pB}%`} value={pB} min={0} max={100} step={1} color="#22e5c9" onChange={setPB} />
            <div className="text-xs font-mono text-[#ffd166] mt-1">p₃ = {Math.round(p3 * 100)}% remaining</div>
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Outcome controls</h3>
            <SliderControl label={`✦ outcome₁ = ${a}`} value={a} min={-100} max={200} step={5} color="#ffd166" onChange={setA} />
            <SliderControl label={`✦ outcome₂ = ${b}`} value={b} min={-100} max={200} step={5} color="#34d399" onChange={setB} />
            <SliderControl label={`✦ outcome₃ = ${c}`} value={c} min={-100} max={200} step={5} color="#fb923c" onChange={setC} />
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live calculation</div>
            <div className="font-mono text-base leading-loose">E[X] = <span className="text-[#ff5f9e]">{p1.toFixed(2)}×{a}</span> + <span className="text-[#22e5c9]">{p2.toFixed(2)}×{b}</span> + <span className="text-[#fb923c]">{p3.toFixed(2)}×{c}</span></div>
            <div className="mt-3 text-4xl font-extrabold font-mono text-[#6366f1]"><NumberColor value={ev} /></div>
          </div>

          <div className={`border rounded-xl p-6 ${!valid ? "border-[#fb923c]/40 bg-[#fb923c]/10" : ev > 0 ? "border-[#34d399]/40 bg-[#34d399]/10" : ev < 0 ? "border-[#fb923c]/40 bg-[#fb923c]/10" : "border-[#ffd166]/40 bg-[#ffd166]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Result status</div>
            <div className={`font-mono font-bold mt-2 ${!valid || ev < 0 ? "text-[#fb923c]" : ev > 0 ? "text-[#34d399]" : "text-[#ffd166]"}`}>{status}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Mean payoff", value: ev.toFixed(2), color: ev >= 0 ? "border-[#34d399] text-[#34d399]" : "border-[#fb923c] text-[#fb923c]" },
              { label: "Probability sum", value: `${(p1 + p2 + p3).toFixed(2)}`, color: "border-[#a78bfa] text-[#a78bfa]" },
            ].map(s => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">Try making a negative outcome very likely. Notice that a few high rewards do not automatically make a risky game good — the probabilities have to pull the average upward.</p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0.55);
  const [reward, setReward] = useState(8);
  const [cost, setCost] = useState(-3);
  const ev = p * reward + (1 - p) * cost;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const width = container.clientWidth;
    const height = 420;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(7, 6, 8);

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

    const curveGeometry = new THREE.BufferGeometry();
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xa78bfa });
    const curve = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curve);

    const pointGeometry = new THREE.SphereGeometry(0.16, 24, 24);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);

    const updateScene = () => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const px = -4 + i * 0.2;
        const py = (px + 4) / 8;
        const pReward = px + 4;
        const pCost = -2.5;
        const value = py * pReward + (1 - py) * pCost;
        pts.push(new THREE.Vector3(px, value, 0));
      }
      curveGeometry.setFromPoints(pts);
      const px = (p * 8) - 4;
      point.position.set(px, ev, 0);
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
      curveGeometry.dispose();
      curveMaterial.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [p, reward, cost, ev]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">Expected value can become a whole landscape</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine tuning a game character where one setting changes the chance of a win and two settings change the rewards. In 3D, each combination becomes a point on an expected-value surface.
        </p>
        <div className="mt-4"><MathBlock tex="E[X]=p\,r+(1-p)\,c" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative"><div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: 420 }} /><div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div></div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move through the payoff landscape</h3>
          <SliderControl label={`✦ X = win chance ${p.toFixed(2)}`} value={p} min={0} max={1} step={0.01} color="#ff5f9e" onChange={setP} />
          <SliderControl label={`✦ Y = win reward ${reward.toFixed(1)}`} value={reward} min={1} max={12} step={0.5} color="#22e5c9" onChange={setReward} />
          <SliderControl label={`✦ Z = loss/cost ${cost.toFixed(1)}`} value={cost} min={-10} max={0} step={0.5} color="#ffd166" onChange={setCost} />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Column vector</div>
            <div className="font-mono text-lg leading-relaxed">[ <span className="text-[#ff5f9e]">{p.toFixed(2)}</span><br />&nbsp;&nbsp;<span className="text-[#22e5c9]">{reward.toFixed(1)}</span><br />&nbsp;&nbsp;<span className="text-[#ffd166]">{cost.toFixed(1)}</span> ]</div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#6366f1]">E[X] = {ev.toFixed(2)}</div>
          <p className="text-sm text-foreground-muted leading-relaxed">The yellow point moves as the sliders change. It shows one choice of probability and rewards sitting inside a larger expected-value landscape.</p>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const [features, setFeatures] = useState([true, true, false, true]);
  const labels = ["Common reward", "Rare bonus", "Time cost", "Jackpot chance"];
  const values = ["₹25", "₹150", "−₹10", "+0.08"];
  const probabilities = [0.55, 0.25, 0.15, 0.05];
  const activeCount = features.filter(Boolean).length;
  const activeValues = features.map((on, i) => on ? probabilities[i] : 0);
  const totalActive = activeValues.reduce((a, b) => a + b, 0) || 1;
  const normalized = activeValues.map(v => v / totalActive);
  const cashValues = [25, 150, -10, 220];
  const ev = weightedExpectedValue(cashValues, normalized);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div>
        <h2 className="text-2xl font-bold">A game chest becomes a probability table</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A real game reward is more than a single number. It can have common rewards, rare bonuses, costs, and jackpot events. We can turn those pieces into features and use their probabilities to estimate the long-run value.
        </p>
        <div className="mt-4"><MathBlock tex="E[X]=\sum_i x_ip_i" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {labels.map((label, i) => (
              <button key={label} onClick={() => setFeatures(prev => prev.map((x, j) => j === i ? !x : x))} className={`text-left border rounded-xl p-4 transition-all ${features[i] ? "border-[#34d399]/60 bg-[#34d399]/10" : "border-border bg-background"}`}>
                <div className="text-xs font-mono" style={{ color: ["#ffd166", "#a78bfa", "#fb923c", "#22e5c9"][i] }}>{features[i] ? "ON" : "OFF"}</div>
                <div className="text-sm font-bold mt-1">{label}</div>
                <div className="text-[11px] text-foreground-muted mt-2">data value: {values[i]}</div>
              </button>
            ))}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">Feature vector · {activeCount} active dimensions</div>
            <div className="font-mono text-xl leading-loose">[ {features.map((on, i) => on ? <span key={i} className={i % 2 === 0 ? "text-[#ffd166]" : "text-[#a78bfa]"}>{i ? <>,&nbsp;</> : null}{values[i]}</span> : null)} ]</div>
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Toggle a dimension</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">In machine learning, a feature is one measurable property of an example. Turning a feature on means we are choosing to include that source of variation in our summary.</p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Normalized active probabilities</div>
            <div className="font-mono text-sm space-y-1">{normalized.map((v, i) => <div key={i}>feature {i + 1}: {v.toFixed(2)}</div>)}</div>
          </div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${ev >= 0 ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
            {ev >= 0 ? "✓ Current feature set has positive expected cash value." : "⚠️ Current feature set has negative expected cash value."}
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#ffd166]">₹{ev.toFixed(2)}</div>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [policy, setPolicy] = useState(60);
  const [r1, setR1] = useState(3);
  const [r2, setR2] = useState(-2);
  const [q1, setQ1] = useState(8);
  const [q2, setQ2] = useState(2);
  const [gamma, setGamma] = useState(0.9);
  const p1 = policy / 100;
  const p2 = 1 - p1;
  const target1 = r1 + gamma * q1;
  const target2 = r2 + gamma * q2;
  const expectedTarget = p1 * target1 + p2 * target2;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Expected Value in Classic AI — Expected SARSA</div>
        <h2 className="text-2xl font-bold">A learning agent can average over its possible next choices</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine a game bot deciding what to do next. Instead of assuming the agent will always pick one perfect action, Expected SARSA averages the future value of actions according to the current policy.
        </p>
        <div className="mt-4"><MathBlock tex="Q(s,a)=\mathbb{E}[r+\gamma Q(s',a')\mid s,a]" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Move A", target: target1, p: p1, color: "#ff5f9e" },
              { name: "Move B", target: target2, p: p2, color: "#22e5c9" },
            ].map(m => <div key={m.name} className="bg-background border border-border rounded-xl p-5"><div className="text-xs font-mono" style={{ color: m.color }}>{m.name}</div><div className="text-3xl font-extrabold font-mono mt-2">{m.target.toFixed(2)}</div><div className="text-xs text-foreground-muted mt-1">policy probability = {(m.p * 100).toFixed(0)}%</div></div>)}
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Weighted next-state value</div>
            <div className="font-mono text-sm">{p1.toFixed(2)} × {target1.toFixed(2)} + {p2.toFixed(2)} × {target2.toFixed(2)}</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-2">{expectedTarget.toFixed(3)}</div>
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Let the policy move</h3>
          <SliderControl label={`✦ policy chooses A = ${policy}%`} value={policy} min={0} max={100} step={1} color="#ffd166" onChange={setPolicy} />
          <SliderControl label={`✦ immediate reward A = ${r1}`} value={r1} min={-10} max={10} step={1} color="#ff5f9e" onChange={setR1} />
          <SliderControl label={`✦ immediate reward B = ${r2}`} value={r2} min={-10} max={10} step={1} color="#22e5c9" onChange={setR2} />
          <SliderControl label={`✦ future value A = ${q1}`} value={q1} min={0} max={10} step={1} color="#a78bfa" onChange={setQ1} />
          <SliderControl label={`✦ future value B = ${q2}`} value={q2} min={0} max={10} step={1} color="#34d399" onChange={setQ2} />
          <SliderControl label={`✦ discount γ = ${gamma.toFixed(2)}`} value={gamma} min={0} max={1} step={0.05} color="#fb923c" onChange={setGamma} />
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${expectedTarget >= 0 ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>{expectedTarget >= 0 ? "✓ Expected future return is positive." : "✗ Expected future return is negative."}</div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is literally what Expected SARSA uses when it evaluates an action: reward plus future value, averaged over what the policy is likely to do next.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const tokens = ["I", "love", "AI", "math"];
  const [focus, setFocus] = useState(1.3);
  const [temperature, setTemperature] = useState(1.0);
  const [valueShift, setValueShift] = useState(0.0);

  const matrix = useMemo(() => {
    const raw = tokens.map((_, i) => {
      const row: number[] = [];
      for (let j = 0; j < tokens.length; j++) {
        const distance = Math.abs(i - j);
        const score = focus * Math.exp(-distance * 0.75) + (i === j ? 0.35 : 0) + valueShift * (j - 1.5) * 0.15;
        row.push(score / Math.max(0.25, temperature));
      }
      return normalize(row.map(v => Math.exp(v)));
    });
    return raw;
  }, [focus, temperature, valueShift]);

  const row = matrix[2];
  const weightedValue = row.reduce((sum, w, i) => sum + w * (i * 2 + 1), 0);
  const max = Math.max(...row);
  const entropy = -row.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);
  const argmax = row.indexOf(max);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Expected Value in Deep Learning — Transformer Self-Attention</div>
        <h2 className="text-2xl font-bold">Attention is a probability-weighted average</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how a teacher might combine several clues before deciding what a sentence is about? A Transformer gives different amounts of attention to different tokens, then takes a weighted sum of their value vectors. That is mathematically the same shape as an expected value.
        </p>
        <div className="mt-4"><MathBlock tex="\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Attention probability heatmap · query = &quot;AI&quot;</div>
            <svg width={360} height={300} viewBox="0 0 360 300" className="mx-auto max-w-full">
              {tokens.map((token, i) => <text key={`t${token}`} x={75 + i * 65} y={30} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.55)">{token}</text>)}
              {matrix.map((r, i) => r.map((val, j) => (
                <g key={`${i}-${j}`}>
                  <rect x={45 + j * 65} y={45 + i * 55} width={57} height={47} rx={6} fill="#6366f1" fillOpacity={Math.max(0.06, Math.min(1, val))} />
                  <text x={73 + j * 65} y={73 + i * 55} textAnchor="middle" fontSize={10} fill="white">{val.toFixed(2)}</text>
                </g>
              )))}
              {tokens.map((token, i) => <text key={`row-${token}`} x={18} y={74 + i * 55} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)">{token}</text>)}
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "max attention", value: max.toFixed(3) },
              { label: "entropy", value: entropy.toFixed(3) },
              { label: "argmax token", value: tokens[argmax] },
            ].map(s => <div key={s.label} className="border border-[#6366f1]/50 rounded-xl p-3 bg-background/60"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-lg font-bold font-mono mt-1 text-[#6366f1]">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Nudge the attention distribution</h3>
          <SliderControl label={`✦ focus strength = ${focus.toFixed(2)}`} value={focus} min={0.2} max={3} step={0.1} color="#ffd166" onChange={setFocus} />
          <SliderControl label={`✦ temperature = ${temperature.toFixed(2)}`} value={temperature} min={0.3} max={2.5} step={0.05} color="#ff5f9e" onChange={setTemperature} />
          <SliderControl label={`✦ value shift = ${valueShift.toFixed(2)}`} value={valueShift} min={-2} max={2} step={0.1} color="#22e5c9" onChange={setValueShift} />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Weighted value summary</div>
            <div className="font-mono text-base">Σ αᵢvᵢ = <span className="text-[#6366f1]">{weightedValue.toFixed(3)}</span></div>
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#6366f1]">{weightedValue.toFixed(3)}</div>
          <div className="text-xs font-mono px-3 py-2 rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 text-[#6366f1]">✓ Darker cells = more weight in the weighted average.</div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3"><strong className="text-foreground">Why does this matter?</strong> The attention weights act like probabilities over tokens, and the value vectors are averaged using those weights. The exact operation is one of the key building blocks inside modern Transformer models.</p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Random Outcome", desc: "A quantity whose value changes from trial to trial.", color: "#ffd166" },
    { label: "Probability", desc: "How likely each possible outcome is.", color: "#ff5f9e" },
    { label: "Weighted Average", desc: "Multiply each outcome by its probability, then add.", color: "#22e5c9" },
    { label: "3D Payoff", desc: "See expected value change across probability and reward settings.", color: "#a78bfa" },
    { label: "Features", desc: "Turn a real object or event into measurable quantities.", color: "#34d399" },
    { label: "Expected SARSA", desc: "Classic reinforcement learning uses expected future return.", color: "#6366f1" },
    { label: "Transformer Attention", desc: "Modern deep learning forms weighted sums using attention probabilities.", color: "#fb923c" },
    { label: "Decision Under Uncertainty", desc: "Use weighted outcomes to reason about actions and future rewards.", color: "#ffd166" },
  ];
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">8 · Concept Map</div>
        <h2 className="text-2xl font-bold">From one weighted average to AI</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Follow the journey: a random variable gets probabilities, probabilities create a weighted average, that average becomes a data tool, and the same math appears in reinforcement learning and Transformers.</p>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{nodes.map(n => <div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{ borderColor: n.color + "55" }}><div className="text-xs font-bold font-mono" style={{ color: n.color }}>{n.label}</div><div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div></div>)}</div></div>
    </section>
  );
}

function PageFooter() {
  return <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4"><p className="text-foreground-muted text-sm max-w-lg">Expected value is basically the math move of asking, “What average should I expect when every possible outcome gets the amount of influence its probability deserves?”</p><Link href="/probability" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Probability &amp; Statistics</Link></footer>;
}

export default function ExpectedValuePage() {
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
