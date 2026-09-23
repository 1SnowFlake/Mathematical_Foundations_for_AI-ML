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

interface Feature {
  key: string;
  label: string;
  value: string;
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

function VectorArrow({ x, y, color, markerId, label }: { x: number; y: number; color: string; markerId: string; label: string }) {
  const end = toSvg(x, y);
  const origin = toSvg(0, 0);
  return (
    <>
      <line x1={origin.x} y1={origin.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={3} markerEnd={`url(#${markerId})`} />
      <text x={end.x + 10} y={end.y - 10} fill={color} fontSize="14" fontWeight="bold">{label}</text>
    </>
  );
}

function NumberColor({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-[#34d399] font-mono" : "text-[#fb923c] font-mono"}>{value.toFixed(2)}</span>;
}

function paraboloid(x: number, y: number, cx: number, cy: number) {
  return (x - cx) ** 2 + 0.7 * (y - cy) ** 2;
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function softmax(values: number[]) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Calculus · Topic 4
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What is{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Gradient?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine standing on a foggy mountain with only one superpower: you can feel which way the ground rises fastest. <strong className="text-foreground">The gradient is that direction arrow for a function.</strong>
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          A derivative tells you a slope along one direction. A gradient collects the slopes from <em>every input</em> and points toward the steepest uphill climb. Turn the arrow around and you get the steepest downhill route.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI, gradients are the signals that tell a model how to change its weights so its predictions become less wrong during training.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(2);
  const [y, setY] = useState(1);
  const gx = 2 * x;
  const gy = 1.4 * y;
  const mag = Math.hypot(gx, gy);
  const gradAngle = Math.atan2(gy, gx) * 180 / Math.PI;
  const start = toSvg(x, y);
  const end = toSvg(x + (mag ? gx / mag : 0), y + (mag ? gy / mag : 0));
  const p0 = toSvg(x, y);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">The gradient is a compass for a surface</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think about a hiking game. Your character stands at one point on a hill and wants to find the fastest way upward. The gradient gives that player a direction and a strength, based on how steep the surface is in each coordinate direction.
        </p>
        <div className="mt-4"><MathBlock tex="\nabla f(x,y)=\begin{bmatrix}\frac{\partial f}{\partial x}\\[4pt]\frac{\partial f}{\partial y}\end{bmatrix}" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="grad" color="#ffd166" /></defs>
              <GridLines />
              <circle cx={p0.x} cy={p0.y} r={45} fill="#a78bfa" fillOpacity={0.08} />
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#ffd166" strokeWidth={4} markerEnd="url(#grad)" />
              <DragHandle x={x} y={y} color="#ff5f9e" svgRef={svgRef} onDrag={(nx, ny) => { setX(nx); setY(ny); }} />
              <text x={start.x + 12} y={start.y + 20} fill="#ff5f9e" fontSize="13" fontWeight="bold">point ({x.toFixed(1)}, {y.toFixed(1)})</text>
              <text x={end.x + 10} y={end.y - 10} fill="#ffd166" fontSize="14" fontWeight="bold">∇f</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Move the point and watch ∇f rotate</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Gradient magnitude", value: mag.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Steepest direction", value: `${gradAngle.toFixed(0)}°`, color: "border-indigo-400 text-indigo-400" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What are you seeing?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">The surface is represented by <MathBlock tex="f(x,y)=x^2+0.7y^2" inline />. Its gradient at your point is an arrow whose components are the two partial derivatives.</p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live gradient</div>
            <div className="font-mono text-lg">∇f = [ <NumberColor value={gx} /> , <NumberColor value={gy} /> ]</div>
            <div className="text-xs text-foreground-muted mt-2">First component = x-slope · second component = y-slope</div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Direction rule</div>
            <MathBlock tex="\text{steepest uphill direction}=\frac{\nabla f}{\|\nabla f\|}" />
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> moving the point changes both slope components at once, so the gradient arrow automatically changes direction and length.</p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(2);
  const [y, setY] = useState(-1.5);
  const direction = Math.atan2(1.4 * y, 2 * x);
  const gx = 2 * x;
  const gy = 1.4 * y;
  const mag = Math.hypot(gx, gy);
  const unit = mag > 0.001 ? { x: gx / mag, y: gy / mag } : { x: 0, y: 0 };
  const end = toSvg(x + unit.x * 2.4, y + unit.y * 2.4);
  const negativeEnd = toSvg(x - unit.x * 2.0, y - unit.y * 2.0);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">The gradient points uphill — negative gradient points downhill</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Picture a skateboard rolling down a ramp. You do not need to test every possible direction; the negative gradient gives the local direction of fastest decrease. That is the geometric reason gradient descent works.
        </p>
        <div className="mt-4"><MathBlock tex="\nabla f\cdot\mathbf{v}=\|\nabla f\|\|\mathbf{v}\|\cos\theta" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="uphill" color="#34d399" /><ArrowMarker id="downhill" color="#fb923c" /></defs>
              <GridLines />
              <line x1={toSvg(x, y).x} y1={toSvg(x, y).y} x2={end.x} y2={end.y} stroke="#34d399" strokeWidth={4} markerEnd="url(#uphill)" />
              <line x1={toSvg(x, y).x} y1={toSvg(x, y).y} x2={negativeEnd.x} y2={negativeEnd.y} stroke="#fb923c" strokeWidth={4} markerEnd="url(#downhill)" />
              <DragHandle x={x} y={y} color="#ff5f9e" svgRef={svgRef} onDrag={(nx, ny) => { setX(nx); setY(ny); }} />
              <text x={end.x + 8} y={end.y - 8} fill="#34d399" fontSize="13" fontWeight="bold">+∇f uphill</text>
              <text x={negativeEnd.x + 8} y={negativeEnd.y - 8} fill="#fb923c" fontSize="13" fontWeight="bold">−∇f downhill</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the pink point to compare both directions</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="border rounded-xl p-3 bg-background/60 border-[#34d399] text-[#34d399]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Uphill angle</div><div className="text-2xl font-bold font-mono mt-1">{(direction * 180 / Math.PI).toFixed(0)}°</div></div>
            <div className="border rounded-xl p-3 bg-background/60 border-[#fb923c] text-[#fb923c]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Downhill angle</div><div className="text-2xl font-bold font-mono mt-1">{((direction * 180 / Math.PI + 180 + 540) % 360 - 180).toFixed(0)}°</div></div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Why is the gradient special?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">For a fixed step length, the dot product is largest when your movement points in the same direction as the gradient. So the gradient is not merely <em>a</em> direction — it is the direction of the fastest local increase.</p>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${mag > 0.2 ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]" : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>
            {mag > 0.2 ? "✓ Notice how the gradient gets stronger when the surface gets steeper." : "⚠️ Near a flat spot, the gradient becomes tiny — there is little local direction information."}
          </div>
          <div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Key idea</div><MathBlock tex="\text{downhill step}= -\eta\nabla f" /><p className="text-xs text-foreground-muted mt-2">η (eta) is the step size: how big a move you make.</p></div>
          <p className="text-sm text-foreground-muted leading-relaxed">That single minus sign is the heart of gradient descent: <strong className="text-foreground">measure the slope, then walk the other way.</strong></p>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const [x, setX] = useState(2.5);
  const [y, setY] = useState(-1.5);
  const [step, setStep] = useState(0.25);
  const gx = 2 * x;
  const gy = 1.4 * y;
  const nextX = x - step * gx;
  const nextY = y - step * gy;
  const fNow = paraboloid(x, y, 0, 0);
  const fNext = paraboloid(nextX, nextY, 0, 0);
  const delta = fNext - fNow;
  const status = Math.abs(delta) < 0.001 ? "Almost flat" : delta < 0 ? "Loss goes down ✓" : "Step is too large — it goes up";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Run one gradient-descent step by hand</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Think of adjusting a game character toward the lowest valley. You know your current position, you measure the gradient, and then you make one controlled step in the opposite direction.</p>
        <div className="mt-4"><MathBlock tex="\mathbf{x}_{new}=\mathbf{x}_{old}-\eta\nabla f(\mathbf{x}_{old})" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Step controls</h3>
            <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Set x = {x.toFixed(2)}</label>
            <input type="range" min="-4" max="4" step="0.1" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Set y = {y.toFixed(2)}</label>
            <input type="range" min="-4" max="4" step="0.1" value={y} onChange={(e) => setY(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#ffd166] mt-6 mb-2">✦ Choose step size η = {step.toFixed(2)}</label>
            <input type="range" min="0.02" max="0.6" step="0.01" value={step} onChange={(e) => setStep(Number(e.target.value))} className="w-full" />
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live substitution</div>
            <div className="font-mono text-sm leading-loose">
              x<sub>new</sub> = <span className="text-[#ff5f9e]">{x.toFixed(2)}</span> − <span className="text-[#ffd166]">{step.toFixed(2)}</span> × <span className="text-[#a78bfa]">{gx.toFixed(2)}</span> = <span className={nextX >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>{nextX.toFixed(2)}</span>
              <br />
              y<sub>new</sub> = <span className="text-[#22e5c9]">{y.toFixed(2)}</span> − <span className="text-[#ffd166]">{step.toFixed(2)}</span> × <span className="text-[#a78bfa]">{gy.toFixed(2)}</span> = <span className={nextY >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>{nextY.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <div className={`border rounded-xl p-6 ${delta < 0 ? "border-[#34d399]/40 bg-[#34d399]/10" : delta > 0 ? "border-[#fb923c]/40 bg-[#fb923c]/10" : "border-[#ffd166]/40 bg-[#ffd166]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Surface value</div>
            <div className="font-mono font-bold mt-2">f now = {fNow.toFixed(3)} → f next = {fNext.toFixed(3)}</div>
            <div className={`font-mono font-bold mt-2 ${delta < 0 ? "text-[#34d399]" : delta > 0 ? "text-[#fb923c]" : "text-[#ffd166]"}`}>{status}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-3 bg-background/60 border-[#a78bfa] text-[#a78bfa]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">|∇f|</div><div className="text-2xl font-bold font-mono mt-1">{Math.hypot(gx, gy).toFixed(2)}</div></div>
            <div className="border rounded-xl p-3 bg-background/60 border-[#ffd166] text-[#ffd166]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Δf</div><div className="text-2xl font-bold font-mono mt-1">{delta.toFixed(3)}</div></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Try making η large.</strong> A tiny step can move safely downhill, while a huge step can overshoot the valley. That trade-off becomes the learning-rate problem in machine learning.</p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const pointRef = useRef<THREE.Mesh | null>(null);
  const [x, setX] = useState(2.2);
  const [y, setY] = useState(1.5);
  const [z, setZ] = useState(2.2);
  const magnitude = Math.sqrt(x * x + y * y + z * z);

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
    const origin = new THREE.Vector3(0, 0, 0);
    scene.add(
      new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 4, 0xff5f9e),
      new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 4, 0x22e5c9),
      new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 4, 0xffd166),
    );
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: 0xa78bfa });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    lineRef.current = line;
    const point = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    scene.add(point);
    pointRef.current = point;
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    const onResize = () => {
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      point.geometry.dispose();
      (point.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      lineRef.current = null;
      pointRef.current = null;
    };
  }, []);

  useEffect(() => {
    lineRef.current?.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
    pointRef.current?.position.set(x, y, z);
  }, [x, y, z]);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">In 3D, the gradient becomes a full vector</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Think about a drone game: left/right is one coordinate, forward/back is another, and height is a third. A 3D gradient can combine all three slopes into one arrow.</p>
        <div className="mt-4"><MathBlock tex="\nabla f(x,y,z)=\begin{bmatrix}\frac{\partial f}{\partial x}\\\frac{\partial f}{\partial y}\\\frac{\partial f}{\partial z}\end{bmatrix}" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl overflow-hidden">
            <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: 420 }} />
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move through 3D</h3>
          {[
            { label: "X axis", value: x, setter: setX, color: "#ff5f9e" },
            { label: "Y axis", value: y, setter: setY, color: "#22e5c9" },
            { label: "Z axis", value: z, setter: setZ, color: "#ffd166" },
          ].map((axis) => (
            <div key={axis.label}>
              <div className="text-xs font-mono mb-2" style={{ color: axis.color }}>✦ Move {axis.label}: {axis.value.toFixed(1)}</div>
              <input type="range" min="-4" max="4" step="0.1" value={axis.value} onChange={(e) => axis.setter(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Vector display</div>
            <div className="font-mono text-xl leading-relaxed">[ <span className="text-[#ff5f9e]">{x.toFixed(1)}</span><br /><span className="text-[#22e5c9]">{y.toFixed(1)}</span><br /><span className="text-[#ffd166]">{z.toFixed(1)}</span> ]</div>
            <div className="text-sm text-foreground-muted mt-2">Magnitude = <span className="text-[#a78bfa] font-mono">{magnitude.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const all: Feature[] = [
    { key: "height", label: "Height", value: "cm", color: "#ff5f9e" },
    { key: "weight", label: "Weight", value: "kg", color: "#22e5c9" },
    { key: "speed", label: "Speed", value: "km/h", color: "#ffd166" },
    { key: "battery", label: "Battery", value: "%", color: "#a78bfa" },
    { key: "angle", label: "Tilt", value: "degrees", color: "#6366f1" },
  ];
  const [features, setFeatures] = useState<Feature[]>(all.slice(0, 2));
  const toggle = (key: string) => setFeatures((prev) => prev.some((f) => f.key === key) ? prev.filter((f) => f.key !== key) : [...prev, all.find((f) => f.key === key)!]);
  const dim = features.length;
  const influence = features.reduce((s, f, i) => s + (i + 1) * 0.35, 0);
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div>
        <h2 className="text-2xl font-bold">A game character can become a gradient-friendly feature vector</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">A model cannot see a character, robot, or object the way you do. It sees numbers. Once an object is represented by features, the gradient can tell the model how each feature should change to improve an objective.</p>
        <div className="mt-4"><MathBlock tex="\mathbf{x}=[x_1,x_2,\ldots,x_n]^T" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-6 h-[420px] overflow-hidden">
            <div className="absolute inset-0 opacity-70">
              {Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => {
                const v = 0.05 + Math.min(0.85, 0.08 + (Math.sin(r * 0.8 + c * 0.45 + influence) + 1) * 0.18);
                return <div key={`${r}-${c}`} className="absolute rounded-md border border-white/5 bg-[#6366f1]" style={{ left: `${8 + c * 11}%`, top: `${8 + r * 11}%`, width: "9%", height: "9%", opacity: v }} />;
              }))}
            </div>
            <div className="relative z-10 text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Feature landscape · {dim} dimensions</div>
            <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
              <div className="bg-background/85 border border-[#ff5f9e]/40 rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">data dimensions</div><div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-1">{dim}</div></div>
              <div className="bg-background/85 border border-[#22e5c9]/40 rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">gradient channels</div><div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-1">{dim}</div></div>
            </div>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Toggle features on the right</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Add or remove dimensions</h3>
          <div className="grid grid-cols-2 gap-2">
            {all.map((f) => {
              const active = features.some((x) => x.key === f.key);
              return <button key={f.key} onClick={() => toggle(f.key)} className={`border rounded-xl p-3 text-left transition-all ${active ? "bg-[#6366f1]/10" : "bg-background"}`} style={{ borderColor: active ? f.color : "rgba(255,255,255,0.12)" }}><div className="text-xs font-bold font-mono" style={{ color: f.color }}>{active ? "✓" : "+"} {f.label}</div><div className="text-[10px] text-foreground-muted mt-1">{f.value}</div></button>;
            })}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-3">Feature vector</div>
            <div className="font-mono text-lg leading-loose">[ {features.map((f, i) => <React.Fragment key={f.key}><span style={{ color: f.color }}>{f.label}</span>{i < features.length - 1 ? <span className="text-foreground-muted">, </span> : null}</React.Fragment>)} ]</div>
            <div className="text-sm text-foreground-muted mt-2">Every active feature can receive its own gradient signal during training.</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Why this matters:</strong> gradients scale naturally from two inputs to thousands or millions of parameters — the bookkeeping is the same, just bigger.</p>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [w, setW] = useState(0.8);
  const [b, setB] = useState(-0.6);
  const [lr, setLr] = useState(0.1);
  const x = 2.2;
  const target = 4.0;
  const pred = w * x + b;
  const loss = 0.5 * (pred - target) ** 2;
  const dLdw = (pred - target) * x;
  const dLdb = pred - target;
  const nextW = w - lr * dLdw;
  const nextB = b - lr * dLdb;
  const nextPred = nextW * x + nextB;
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Gradient in Classic AI — Linear Regression</div>
        <h2 className="text-2xl font-bold">A prediction can tell you exactly which way to move its weights</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Think of a simple predictor estimating travel time from distance. If the prediction is too high or too low, the gradient measures how the error changes when you change the model's weight and bias.</p>
        <div className="mt-4"><MathBlock tex="L=\frac12(\hat y-y)^2,\quad \nabla_\theta L=\begin{bmatrix}\frac{\partial L}{\partial w}\\\frac{\partial L}{\partial b}\end{bmatrix}" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-5 h-[340px] overflow-hidden">
            <div className="absolute inset-0 opacity-60">{Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => <div key={`${r}-${c}`} className="absolute rounded-sm bg-[#6366f1]" style={{ left: `${c * 8.33}%`, top: `${r * 8.33}%`, width: "7.5%", height: "7.5%", opacity: 0.05 + Math.min(0.65, Math.abs(loss) / 10 + c * 0.01) }} />))}</div>
            <div className="relative z-10 text-xs font-mono text-foreground-muted">input x = {x.toFixed(1)} · target y = {target.toFixed(1)}</div>
            <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
              <div className="bg-background/85 border border-[#ff5f9e]/40 rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">∂L/∂w</div><div className="text-3xl font-bold font-mono text-[#ff5f9e] mt-1">{dLdw.toFixed(3)}</div></div>
              <div className="bg-background/85 border border-[#22e5c9]/40 rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">∂L/∂b</div><div className="text-3xl font-bold font-mono text-[#22e5c9] mt-1">{dLdb.toFixed(3)}</div></div>
            </div>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Move the weight, bias, or learning-rate sliders</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Change weight w = {w.toFixed(2)}</label>
          <input type="range" min="-1" max="3" step="0.05" value={w} onChange={(e) => setW(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Change bias b = {b.toFixed(2)}</label>
          <input type="range" min="-3" max="3" step="0.05" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#ffd166] mt-5 mb-2">✦ Change learning rate η = {lr.toFixed(2)}</label>
          <input type="range" min="0.01" max="0.5" step="0.01" value={lr} onChange={(e) => setLr(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Model output</div><div className="text-4xl font-extrabold font-mono text-[#6366f1]">{pred.toFixed(3)}</div><div className="text-sm font-mono mt-2">loss = {loss.toFixed(3)} → next loss = {(0.5 * (nextPred - target) ** 2).toFixed(3)}</div></div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${Math.abs(nextPred - target) < Math.abs(pred - target) ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
            {Math.abs(nextPred - target) < Math.abs(pred - target) ? "✓ Gradient step moves the prediction closer." : "✗ This step did not improve the prediction. Try a smaller η."}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is literally what gradient descent does in a classic model: compute the slope of the loss with respect to each parameter, then move each parameter in the direction that lowers the loss.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const [q0, setQ0] = useState(1.2);
  const [q1, setQ1] = useState(0.3);
  const [scale, setScale] = useState(1);
  const keys = [[1.0, 0.2], [0.1, 1.2], [-0.8, 0.4]];
  const q = [q0, q1];
  const scores = keys.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2);
  const weights = softmax(scores);
  const target = 0;
  const loss = -Math.log(Math.max(weights[target], 1e-8));
  const eps = 0.002;
  const gradQ = [0, 1].map((i) => {
    const plus = [...q]; plus[i] += eps * scale;
    const minus = [...q]; minus[i] -= eps * scale;
    const pScores = keys.map((k) => (plus[0] * k[0] + plus[1] * k[1]) / Math.SQRT2);
    const mScores = keys.map((k) => (minus[0] * k[0] + minus[1] * k[1]) / Math.SQRT2);
    const p = softmax(pScores), m = softmax(mScores);
    return (-Math.log(Math.max(p[target], 1e-8)) + Math.log(Math.max(m[target], 1e-8))) / (2 * eps * scale);
  });
  const cells = [gradQ[0], gradQ[1], weights[0], weights[1], weights[2], loss];
  const entropy = -weights.reduce((s, p) => s + p * Math.log(Math.max(p, 1e-8)), 0);
  const argmax = weights.indexOf(Math.max(...weights));
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Gradient in Deep Learning — Transformer Training</div>
        <h2 className="text-2xl font-bold">Transformers learn by pushing gradients through many connected operations</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">You have seen one gradient for a simple model. A Transformer repeats the same idea through embeddings, projections, attention, and output layers. Backpropagation carries gradient information backward so every parameter can be updated.</p>
        <div className="mt-4"><MathBlock tex="\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V,\qquad \theta\leftarrow\theta-\eta\nabla_\theta L" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative rounded-xl bg-[#0a0a0c] p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-4">Live attention + gradient heatmap</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-[#6366f1] mb-2">gradient channels</div>
                <div className="grid grid-cols-3 gap-2">{cells.map((v, i) => <div key={i} className="aspect-square rounded-lg flex flex-col items-center justify-center border border-[#6366f1]/30 bg-[#6366f1]" style={{ opacity: Math.max(0.12, Math.min(0.95, 0.12 + Math.abs(v) * 0.45)) }}><span className="font-mono text-xs">{v.toFixed(2)}</span><span className="text-[9px] text-foreground-muted">g{i + 1}</span></div>)}</div>
              </div>
              <div>
                <div className="text-xs font-mono text-[#a78bfa] mb-2">attention weights</div>
                <div className="grid grid-cols-3 gap-2">{weights.map((v, i) => <div key={i} className="aspect-square rounded-lg flex items-center justify-center border border-[#a78bfa]/30 bg-[#a78bfa]" style={{ opacity: Math.max(0.08, Math.min(0.95, v)) }}><span className="font-mono text-sm">{v.toFixed(2)}</span></div>)}</div>
              </div>
            </div>
            <div className="mt-5 bg-background/70 border border-border rounded-xl p-4"><div className="text-xs font-mono text-foreground-muted">target token = key 1 · live loss = {loss.toFixed(3)}</div><div className="text-sm text-foreground-muted mt-2">The gradient cells show how sensitive the loss is to the query values. The attention cells show where the query is currently looking.</div></div>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Move Q sliders or scale the gradient</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Change Q₁: {q0.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={q0} onChange={(e) => setQ0(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Change Q₂: {q1.toFixed(2)}</label>
          <input type="range" min="-2" max="2" step="0.05" value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#ffd166] mt-5 mb-2">✦ Scale the gradient signal: {scale.toFixed(2)}</label>
          <input type="range" min="0.25" max="2.5" step="0.05" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Live metrics</div><div className="grid grid-cols-3 gap-2 font-mono text-sm"><div>max |g|<br /><span className="text-[#6366f1]">{Math.max(...gradQ.map(Math.abs)).toFixed(3)}</span></div><div>entropy<br /><span className="text-[#a78bfa]">{entropy.toFixed(3)}</span></div><div>focus<br /><span className="text-[#ffd166]">key {argmax + 1}</span></div></div></div>
          <div className="text-4xl font-extrabold font-mono text-[#6366f1]">{loss.toFixed(3)}</div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3"><strong className="text-foreground">This exact idea</strong> runs throughout Transformer training: compute how the loss changes with parameters, send those signals backward, and update the parameters so the next training step is a little better.</p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Gradient", desc: "A vector of partial derivatives.", color: "#ffd166" },
    { label: "Slope", desc: "One direction's rate of change.", color: "#ff5f9e" },
    { label: "Gradient Descent", desc: "Move opposite the gradient.", color: "#22e5c9" },
    { label: "3D Vector", desc: "The idea extends to more dimensions.", color: "#a78bfa" },
    { label: "Feature Vector", desc: "Real objects become numerical inputs.", color: "#34d399" },
    { label: "Linear Regression", desc: "Classic model trained with gradients.", color: "#6366f1" },
    { label: "Backpropagation", desc: "Gradients travel backward through layers.", color: "#fb923c" },
    { label: "Transformer Training", desc: "Modern language models use gradient updates.", color: "#6366f1" },
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
      <p className="text-foreground-muted text-sm max-w-lg">A gradient is basically the math arrow saying “here is the direction that changes the most” — and AI uses that arrow to learn.</p>
      <Link href="/calculus" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Calculus</Link>
    </footer>
  );
}

export default function GradientPage() {
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
