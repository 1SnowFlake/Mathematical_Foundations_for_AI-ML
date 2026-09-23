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

function NumberColor({ value, digits = 3 }: { value: number; digits?: number }) {
  return <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>{value.toFixed(digits)}</span>;
}

function bayesPosterior(prior: number, likelihood: number, falsePositive: number) {
  const numerator = likelihood * prior;
  const denominator = numerator + falsePositive * (1 - prior);
  return denominator === 0 ? 0 : numerator / denominator;
}

function odds(p: number) {
  return p <= 0 || p >= 1 ? null : p / (1 - p);
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / total);
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Probability &amp; Statistics · Topic 2
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Bayes&apos; Theorem?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine your phone says, “It might rain.” You look outside and see dark clouds. Your belief changes because you just got new evidence. <strong className="text-foreground">Bayes&apos; Theorem is the math for updating a belief when new evidence arrives.</strong>
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          The key trick is that a clue can be common even when the thing you care about is rare. Bayes forces you to combine the <em>starting belief</em> with the <em>evidence</em> instead of guessing from the clue alone.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          AI uses this idea in classifiers, spam filters, diagnosis systems, recommendation models, and probabilistic deep learning whenever predictions need to update from evidence.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [prior, setPrior] = useState(0.2);
  const evidenceStrength = 2.5;
  const falsePositive = 0.1;
  const posterior = bayesPosterior(prior, evidenceStrength * falsePositive, falsePositive);
  const p = Math.min(4.1, posterior * 4.1);
  const q = Math.min(4.1, (1 - posterior) * 4.1);
  const positive = toSvg(p, 2.4);
  const negative = toSvg(-q, 1.5);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">New evidence can flip what you believe</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a spam filter. Before reading an email, you have a starting belief about spam. Then you notice words, links, or patterns. Bayes combines the starting belief and the new clue into an updated belief.
        </p>
        <div className="mt-4"><MathBlock tex="P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs>
                <ArrowMarker id="bayes-post" color="#ffd166" />
                <ArrowMarker id="bayes-prior" color="#ff5f9e" />
              </defs>
              <GridLines />
              <line x1={OX} y1={OY - 150} x2={OX} y2={OY + 150} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
              <line x1={OX - 175} y1={OY + 130} x2={OX + 175} y2={OY + 130} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
              <VectorArrow2 x={prior * 4} y={-0.5} color="#ff5f9e" markerId="bayes-prior" label="prior" />
              <VectorArrow2 x={posterior * 4} y={1.4} color="#ffd166" markerId="bayes-post" label="posterior" />
              <circle cx={negative.x} cy={negative.y} r={7} fill="#22e5c9" fillOpacity={0.45} />
              <DragHandle x={prior * 4 - 2.5} y={-0.5} color="#ff5f9e" svgRef={svgRef} onDrag={(nx) => setPrior(Math.max(0.02, Math.min(0.78, (nx + 2.5) / 4)))} />
              <text x={OX + 16} y={OY - 165} fill="#ffd166" fontSize="12" fontWeight="bold">updated belief</text>
              <text x={OX + 155} y={OY + 125} fill="rgba(255,255,255,0.32)" fontSize="10">evidence arrives →</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Change the starting belief</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Prior P(A)", value: prior.toFixed(2), color: "border-[#ff5f9e] text-[#ff5f9e]" },
              { label: "Posterior P(A|B)", value: posterior.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
            ].map(s => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What changed?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">Prior</strong> means what you believed before the clue. <strong className="text-foreground">Posterior</strong> means what you believe after taking the clue into account.
          </p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live result</div>
            <div className="font-mono text-lg">P(A|B) = <NumberColor value={posterior} /></div>
            <div className="text-xs text-foreground-muted mt-2">The yellow arrow grows when the evidence makes A more believable.</div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Core idea</div>
            <MathBlock tex="\text{posterior} \propto \text{likelihood}\times\text{prior}" />
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> the same evidence can lead to a different answer when the starting belief changes. That is the heart of Bayesian reasoning.</p>
        </div>
      </div>
    </section>
  );
}

function VectorArrow2({ x, y, color, markerId, label }: { x: number; y: number; color: string; markerId: string; label: string }) {
  const end = toSvg(x, y);
  const origin = toSvg(0, 0);
  return <><line x1={origin.x} y1={origin.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={3} markerEnd={`url(#${markerId})`} /><text x={end.x + 8} y={end.y - 8} fill={color} fontSize="13" fontWeight="bold">{label}</text></>;
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [falsePositive, setFalsePositive] = useState(0.1);
  const prior = 0.2;
  const likelihood = 0.9;
  const posterior = bayesPosterior(prior, likelihood, falsePositive);
  const evidence = likelihood * prior + falsePositive * (1 - prior);
  const misleading = falsePositive > 0.4;
  const a = toSvg(-3.4, 1.8);
  const b = toSvg(3.2, 2.1);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">The denominator is the “how common is this clue?” check</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine a smoke alarm. A beep is strong evidence of fire — but if the alarm also beeps all the time when there is no fire, the clue becomes less convincing. Bayes keeps that false-alarm rate in the denominator.
        </p>
        <div className="mt-4"><MathBlock tex="P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              <rect x={90} y={90} width={110} height={170} rx={14} fill="#ff5f9e" fillOpacity={0.10} stroke="#ff5f9e" strokeOpacity={0.4} />
              <rect x={280} y={90} width={110} height={170} rx={14} fill="#22e5c9" fillOpacity={0.10} stroke="#22e5c9" strokeOpacity={0.4} />
              <text x={145} y={120} fill="#ff5f9e" textAnchor="middle" fontSize="14" fontWeight="bold">Fire</text>
              <text x={335} y={120} fill="#22e5c9" textAnchor="middle" fontSize="14" fontWeight="bold">No fire</text>
              <text x={145} y={150} fill="rgba(255,255,255,0.55)" textAnchor="middle" fontSize="11">90% alarm</text>
              <text x={335} y={150} fill="rgba(255,255,255,0.55)" textAnchor="middle" fontSize="11">{(falsePositive*100).toFixed(0)}% alarm</text>
              <line x1={200} y1={175} x2={280} y2={175} stroke="#ffd166" strokeWidth={5} strokeLinecap="round" />
              <circle cx={a.x} cy={a.y} r={7} fill="#ff5f9e" />
              <circle cx={b.x} cy={b.y} r={7} fill="#22e5c9" />
              <text x={OX - 205} y={OY + 170} fill="rgba(255,255,255,0.38)" fontSize="10">prior belief → evidence likelihood → posterior</text>
              <DragHandle x={falsePositive * 5 - 2.5} y={-2.3} color="#22e5c9" svgRef={svgRef} onDrag={(nx) => setFalsePositive(Math.max(0.01, Math.min(0.9, (nx + 2.5) / 5)))} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the green dot: increase false alarms</div>
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Watch the denominator react</h3>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${misleading ? "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]" : "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"}`}>
            {misleading ? "⚠️ Warning — the clue is becoming common even without A." : "✓ Notice how a rare false alarm keeps the clue informative."}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Evidence probability</div>
            <div className="font-mono text-lg">P(B) = <NumberColor value={evidence} /></div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Updated belief</div>
            <div className="text-3xl font-extrabold font-mono text-[#ffd166]">{posterior.toFixed(3)}</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">A clue is useful when it is much more likely under A than under not-A. Bayes compares both paths before updating your belief.</p>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const [priorPct, setPriorPct] = useState(20);
  const [likelihoodPct, setLikelihoodPct] = useState(90);
  const [falsePositivePct, setFalsePositivePct] = useState(10);
  const prior = priorPct / 100;
  const likelihood = likelihoodPct / 100;
  const falsePositive = falsePositivePct / 100;
  const posterior = bayesPosterior(prior, likelihood, falsePositive);
  const numerator = likelihood * prior;
  const denominator = numerator + falsePositive * (1 - prior);
  const priorOdds = odds(prior);
  const likelihoodRatio = falsePositive === 0 ? Infinity : likelihood / falsePositive;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Change the numbers. Watch the belief update.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">This is where the formula stops looking mysterious. Set a starting belief, describe how strong the evidence is, and tell Bayes how often the clue appears without the thing you care about.</p>
        <div className="mt-4"><MathBlock tex="P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B\mid A)P(A)+P(B\mid \neg A)P(\neg A)}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Bayes controls</h3>
            <SliderControl label={`✦ Prior P(A) = ${priorPct}%`} value={priorPct} min={1} max={80} step={1} color="#ff5f9e" onChange={setPriorPct} />
            <SliderControl label={`✦ Evidence given A = ${likelihoodPct}%`} value={likelihoodPct} min={10} max={100} step={1} color="#22e5c9" onChange={setLikelihoodPct} />
            <SliderControl label={`✦ False positive = ${falsePositivePct}%`} value={falsePositivePct} min={1} max={80} step={1} color="#a78bfa" onChange={setFalsePositivePct} />
          </div>

          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live calculation</div>
            <div className="font-mono text-base leading-loose">
              P(A|B) = <span className="text-[#22e5c9]">({likelihood.toFixed(2)})</span> × <span className="text-[#ff5f9e]">({prior.toFixed(2)})</span> / <span className="text-[#ffd166]">({denominator.toFixed(3)})</span>
            </div>
            <div className="mt-3 text-4xl font-extrabold font-mono text-[#6366f1]">{posterior.toFixed(3)}</div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className={`border rounded-xl p-6 ${posterior >= 0.5 ? "border-[#34d399]/40 bg-[#34d399]/10" : "border-[#fb923c]/40 bg-[#fb923c]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Decision view</div>
            <div className={`font-mono font-bold mt-2 ${posterior >= 0.5 ? "text-[#34d399]" : "text-[#fb923c]"}`}>{posterior >= 0.5 ? "✓ Posterior is above 50%" : "⚠️ Posterior is below 50%"}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Prior odds", value: priorOdds ? priorOdds.toFixed(2) : "0.00", color: "border-[#ff5f9e] text-[#ff5f9e]" },
              { label: "Likelihood ratio", value: Number.isFinite(likelihoodRatio) ? likelihoodRatio.toFixed(2) : "∞", color: "border-[#a78bfa] text-[#a78bfa]" },
            ].map(s => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">Try making the prior tiny and the false-positive rate large. Notice how even strong evidence may fail to create a huge posterior probability. That is Bayes correcting for base rates.</p>
        </div>
      </div>
    </section>
  );
}

function SliderControl({ label, value, min, max, step, color, onChange }: { label: string; value: number; min: number; max: number; step: number; color: string; onChange: (n: number) => void }) {
  return <div className="mb-5 last:mb-0"><label className="block text-xs font-mono mb-2" style={{ color }}>{label}</label><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" /></div>;
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prior, setPrior] = useState(0.2);
  const [like, setLike] = useState(0.9);
  const [fp, setFp] = useState(0.1);
  const posterior = bayesPosterior(prior, like, fp);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    const width = container.clientWidth;
    const height = 420;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(6, 5.5, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    scene.add(new THREE.GridHelper(10, 10, 0x444444, 0x222222));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 4, 0xff5f9e));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 4, 0x22e5c9));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 4, 0xffd166));

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const px = i / segments;
        const pz = j / segments;
        const post = bayesPosterior(Math.max(0.01, px), Math.max(0.01, 0.15 + pz * 0.85), fp);
        positions.push((px - 0.5) * 6, post * 4.5, (pz - 0.5) * 6);
        colors.push(0.50 + post * 0.45, 0.20 + post * 0.30, 0.55 + post * 0.40);
      }
    }
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + 1;
        const c = a + (segments + 1);
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 0.86 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const pointGeometry = new THREE.SphereGeometry(0.14, 20, 20);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set((prior - 0.5) * 6, posterior * 4.5, (like - 0.5) * 6);
    scene.add(point);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      point.position.set((prior - 0.5) * 6, posterior * 4.5, (like - 0.5) * 6);
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
      geometry.dispose();
      material.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [fp, like, posterior, prior]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">Bayesian reasoning is a surface, not just a number</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Think of this as a probability landscape. One direction changes your starting belief, another changes the strength of the evidence, and the height is the updated belief.</p>
        <div className="mt-4"><MathBlock tex="P(A\mid B)=f(P(A),P(B\mid A),P(B\mid \neg A))" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: 420 }} />
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move across the probability surface</h3>
          {[{ label: "Prior", value: prior, setter: setPrior, color: "#ff5f9e" }, { label: "P(B|A)", value: like, setter: setLike, color: "#22e5c9" }, { label: "P(B|¬A)", value: fp, setter: setFp, color: "#ffd166" }].map(axis => <div key={axis.label}><div className="text-xs font-mono mb-2" style={{ color: axis.color }}>✦ Move {axis.label}: {axis.value.toFixed(2)}</div><input type="range" min={0.01} max={0.99} step={0.01} value={axis.value} onChange={e => axis.setter(Number(e.target.value))} className="w-full" /></div>)}
          <div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Posterior height</div><div className="text-4xl font-extrabold font-mono text-[#ffd166]">{posterior.toFixed(3)}</div><div className="text-xs text-foreground-muted mt-2">Higher point = stronger updated belief.</div></div>
          <p className="text-sm text-foreground-muted leading-relaxed">The 3D shape makes a big Bayesian idea visible: changing one assumption can move the answer dramatically even though the formula itself never changes.</p>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const features = ["sender-known", "contains-link", "urgent-word", "many-images"];
  const [enabled, setEnabled] = useState<string[]>(["sender-known", "contains-link"]);
  const values: Record<string, number> = { "sender-known": 0.18, "contains-link": 0.44, "urgent-word": 0.23, "many-images": 0.31 };
  const score = enabled.reduce((sum, f) => sum + values[f], 0);
  const vector = enabled.map(f => values[f]);
  const spamProb = Math.min(0.97, 0.12 + score * 0.52);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#22e5c9] uppercase tracking-widest mb-2">5 · Real-World Data</div>
        <h2 className="text-2xl font-bold">A message becomes evidence</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">A spam filter does not see an email as “just text.” It turns clues into measurable features. Each feature becomes evidence that can shift the belief about whether the message is spam.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {features.map(f => {
              const on = enabled.includes(f);
              return <button key={f} onClick={() => setEnabled(cur => on ? cur.filter(x => x !== f) : [...cur, f])} className={`text-left border rounded-xl p-4 transition-all ${on ? "border-[#22e5c9] bg-[#22e5c9]/10" : "border-border bg-background"}`}><div className="text-xs font-mono text-[#22e5c9]">{on ? "✓" : "○"} {f}</div><div className="text-[11px] text-foreground-muted mt-2">evidence weight = {values[f].toFixed(2)}</div></button>;
            })}
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-3">Feature vector</div>
            <div className="font-mono text-xl leading-relaxed">[ {vector.length ? vector.map(v => v.toFixed(2)).join(" , ") : "—"} ]</div>
            <div className="text-xs text-foreground-muted mt-3">Turn features on/off and watch the evidence vector grow or shrink.</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What does the model believe?</h3>
          <div className={`border rounded-xl p-6 ${spamProb >= 0.5 ? "border-[#fb923c]/40 bg-[#fb923c]/10" : "border-[#34d399]/40 bg-[#34d399]/10"}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Spam probability</div><div className={`text-4xl font-extrabold font-mono mt-2 ${spamProb >= 0.5 ? "text-[#fb923c]" : "text-[#34d399]"}`}>{spamProb.toFixed(2)}</div></div>
          <p className="text-sm text-foreground-muted leading-relaxed">The vector is not the final answer. It is structured evidence that a probabilistic model can combine with a prior to produce an updated belief.</p>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [w1, setW1] = useState(1.4);
  const [w2, setW2] = useState(1.0);
  const [bias, setBias] = useState(-1.8);
  const logits = [bias, bias + w1, bias + w2, bias + w1 + w2];
  const probs = softmax(logits);
  const output = probs[3];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Bayes in Classic AI — Naive Bayes</div>
        <h2 className="text-2xl font-bold">A spam filter updates a probability from clues</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">You know how Gmail can warn you about spam before you open a message? A classic probabilistic approach is Naive Bayes: combine a prior with evidence from multiple features.</p>
        <div className="mt-4"><MathBlock tex="P(C\mid x_1,\ldots,x_n)\propto P(C)\prod_{i=1}^{n}P(x_i\mid C)" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {["normal", "suspicious", "urgent", "link-heavy"].map((label, i) => <div key={label} className="border border-border rounded-xl p-4 bg-background"><div className="text-xs font-mono text-[#6366f1]">{label}</div><div className="text-2xl font-bold font-mono mt-2">{probs[i].toFixed(2)}</div></div>)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SliderControl label={`✦ weight₁ = ${w1.toFixed(1)}`} value={w1} min={-2} max={3} step={0.1} color="#ff5f9e" onChange={setW1} />
            <SliderControl label={`✦ weight₂ = ${w2.toFixed(1)}`} value={w2} min={-2} max={3} step={0.1} color="#22e5c9" onChange={setW2} />
            <SliderControl label={`✦ bias = ${bias.toFixed(1)}`} value={bias} min={-4} max={2} step={0.1} color="#a78bfa" onChange={setBias} />
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Model output</div><div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-2">{output.toFixed(3)}</div></div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${output > 0.5 ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>{output > 0.5 ? "✓ Model fires — prediction: suspicious" : "✗ Below threshold — prediction: normal"}</div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is literally what a Naive Bayes classifier does at prediction time: it combines prior belief with feature evidence and normalizes the result into probabilities.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const words = ["refund", "free", "urgent", "meeting"];
  const [priorBias, setPriorBias] = useState(0.4);
  const [evidenceScale, setEvidenceScale] = useState(1.2);
  const [noise, setNoise] = useState(0.3);
  const matrix = useMemo(() => words.map((_, i) => words.map((_, j) => {
    const d = Math.abs(i - j);
    const raw = Math.exp(-(d + noise) / 1.8) * (0.55 + evidenceScale * 0.18) + priorBias * (1 / (1 + d));
    return Math.min(1, raw / 1.8);
  })), [priorBias, evidenceScale, noise]);
  const flat = matrix.flat();
  const max = Math.max(...flat);
  const sum = flat.reduce((a, b) => a + b, 0);
  const entropy = -flat.reduce((acc, p) => { const q = p / sum; return q > 0 ? acc + q * Math.log2(q) : acc; }, 0);
  const argmaxIndex = flat.indexOf(max);
  const argmaxRow = Math.floor(argmaxIndex / words.length);
  const argmaxCol = argmaxIndex % words.length;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Bayes in Deep Learning — Bayesian Neural Networks</div>
        <h2 className="text-2xl font-bold">Modern models can treat weights as uncertain, not fixed</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Instead of pretending every learned weight is perfectly known, Bayesian neural networks put distributions over weights. The model can then update uncertainty using data — the same belief-update idea from Bayes.</p>
        <div className="mt-4"><MathBlock tex="p(\mathbf{w}\mid D)\propto p(D\mid\mathbf{w})\,p(\mathbf{w})" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Posterior belief heatmap</div>
            <div className="grid grid-cols-4 gap-2">
              {matrix.flatMap((row, i) => row.map((val, j) => <div key={`${i}-${j}`} className="relative aspect-square rounded-md border border-[#6366f1]/20 flex items-center justify-center" style={{ backgroundColor: "#6366f1", opacity: Math.max(0.08, val) }}><span className="absolute text-[10px] font-mono text-white" style={{ opacity: 1 }}>{val.toFixed(2)}</span></div>))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">{words.map(w => <div key={w} className="text-center text-[10px] font-mono text-foreground-muted">{w}</div>)}</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Max posterior", value: max.toFixed(3) },
              { label: "Entropy", value: entropy.toFixed(3) },
              { label: "Strongest pair", value: `${words[argmaxRow]}→${words[argmaxCol]}` },
            ].map(s => <div key={s.label} className="border border-[#6366f1]/50 rounded-xl p-3 bg-background/60"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-lg font-bold font-mono mt-1 text-[#6366f1]">{s.value}</div></div>)}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Nudge the uncertainty model</h3>
          <SliderControl label={`✦ prior strength = ${priorBias.toFixed(2)}`} value={priorBias} min={0.05} max={1.0} step={0.05} color="#ffd166" onChange={setPriorBias} />
          <SliderControl label={`✦ evidence scale = ${evidenceScale.toFixed(2)}`} value={evidenceScale} min={0.2} max={2.5} step={0.05} color="#ff5f9e" onChange={setEvidenceScale} />
          <SliderControl label={`✦ noise = ${noise.toFixed(2)}`} value={noise} min={0.05} max={1.2} step={0.05} color="#22e5c9" onChange={setNoise} />
          <div className="text-xs font-mono px-3 py-2 rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 text-[#6366f1]">✓ Darker cells = stronger posterior belief under the current assumptions.</div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3"><strong className="text-foreground">Why does this matter?</strong> Bayesian deep learning brings uncertainty into the model instead of returning only a single confident-looking number. That matters when decisions involve noisy or incomplete data.</p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Belief", desc: "Start with a probability before seeing new evidence.", color: "#ffd166" },
    { label: "Condition", desc: "Ask how likely the evidence is under a hypothesis.", color: "#ff5f9e" },
    { label: "Normalize", desc: "Compare all ways the evidence could have appeared.", color: "#22e5c9" },
    { label: "3D Surface", desc: "Change prior and likelihood to move across a probability landscape.", color: "#a78bfa" },
    { label: "Features", desc: "Turn real observations into measurable evidence.", color: "#34d399" },
    { label: "Naive Bayes", desc: "Classic classifier combining feature likelihoods.", color: "#6366f1" },
    { label: "Bayesian NN", desc: "Deep model that represents uncertainty in weights.", color: "#fb923c" },
    { label: "Uncertainty", desc: "Reason about what the model knows — and what it does not.", color: "#ffd166" },
  ];
  return <section className="space-y-6"><div><div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">8 · Concept Map</div><h2 className="text-2xl font-bold">From one formula to AI systems</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Follow the same idea as it grows: a simple belief update becomes structured evidence, then a classic classifier, then uncertainty-aware deep learning.</p></div><div className="bg-surface border border-border rounded-2xl p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{nodes.map(n => <div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{ borderColor: n.color + "55" }}><div className="text-xs font-bold font-mono" style={{ color: n.color }}>{n.label}</div><div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div></div>)}</div></div></section>;
}

function PageFooter() {
  return <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4"><p className="text-foreground-muted text-sm max-w-lg">Bayes is basically the math move of saying: “Here is what I believed, here is what I just learned, so what should I believe now?”</p><Link href="/probability" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Probability &amp; Statistics</Link></footer>;
}

export default function BayesTheoremPage() {
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
