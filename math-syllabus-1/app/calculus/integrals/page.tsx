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

function curvePath(fn: (x: number) => number, start = -4.5, end = 4.5, steps = 140) {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = start + ((end - start) * i) / steps;
    const y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > 8) continue;
    const p = toSvg(x, y);
    points.push(`${points.length === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return points.join(" ");
}

function IntegralFunction(x: number) {
  return 0.22 * x * x + 0.9;
}

function IntegralArea(x: number) {
  return (0.22 / 3) * (x * x * x) + 0.9 * x;
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Calculus · Topic 2
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        What are{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">Integrals?</span>
      </h1>
      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine a fitness app counting every tiny bit of movement during a workout. An <strong className="text-foreground">integral</strong> adds up lots of tiny pieces to find a total — distance, area, energy, probability, or anything that accumulates.
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          On a graph, an integral can measure the <strong className="text-foreground">area under a curve</strong>. Instead of asking “how fast is it changing?”, you ask “how much has built up?”
        </p>
        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          In AI and machine learning, integrals appear when models work with continuous probability distributions, expected values, energy functions, and continuous-time neural networks.
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [right, setRight] = useState(2.5);
  const left = -1;
  const area = IntegralArea(right) - IntegralArea(left);
  const curve = (x: number) => IntegralFunction(x);
  const samples = Array.from({ length: 18 }, (_, i) => left + ((right - left) * i) / 17);
  const points = samples.map((x, i) => {
    const y = Math.max(0, curve(x));
    const p = toSvg(x, y);
    return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }).join(" ");
  const top = samples.map((x) => {
    const y = Math.max(0, curve(x));
    const p = toSvg(x, y);
    return `${p.x} ${p.y}`;
  }).join(" ");
  const l = toSvg(left, 0);
  const r = toSvg(right, 0);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div>
        <h2 className="text-2xl font-bold">An integral is a “totalizer” for tiny pieces</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of filling a swimming pool with a hose whose flow changes every second. The integral adds every tiny amount of water so you know how much is in the pool altogether. Drag the yellow handle to change how far you accumulate.
        </p>
        <div className="mt-4"><MathBlock tex="\int_a^b f(x)\,dx" /></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <defs><ArrowMarker id="area-x" color="#ffd166" /></defs>
              <GridLines />
              <path d={curvePath(curve)} fill="none" stroke="#22e5c9" strokeWidth={3} />
              <polygon points={`${l.x},${l.y} ${top} ${r.x},${r.y}`} fill="#ffd166" fillOpacity={0.18} stroke="#ffd166" strokeOpacity={0.45} />
              <line x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke="#ffd166" strokeWidth={2} markerEnd="url(#area-x)" />
              <DragHandle x={right} y={0} color="#ffd166" svgRef={svgRef} onDrag={(nx) => setRight(Math.max(0.25, nx))} />
              <text x={r.x + 12} y={r.y + 22} fill="#ffd166" fontSize="13" fontWeight="bold">b = {right.toFixed(2)}</text>
              <text x={OX - 12} y={OY - 12} fill="#22e5c9" fontSize="13" fontWeight="bold">f(x)</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag me! Move the yellow endpoint</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Accumulated area", value: area.toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "Interval width", value: (right - left).toFixed(2), color: "border-indigo-400 text-indigo-400" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">What is being added?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            The golden region is built from many very thin rectangles. Make the interval wider and there are more pieces to add, so the total grows.
          </p>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Area formula</div>
            <MathBlock tex="\text{Area}=\int_a^b f(x)\,dx" />
            <div className="mt-3"><MathBlock tex="F(b)-F(a)" /></div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live readout</div>
            <div className="font-mono text-lg space-y-2">
              <div>a = <NumberColor value={left} /></div>
              <div>b = <NumberColor value={right} /></div>
              <div>∫ f(x)dx = <NumberColor value={area} /></div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> changing only one endpoint changes the total. That is the central idea of accumulation: small contributions become one useful quantity.</p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(2.5);
  const [n, setN] = useState(8);
  const a = 0;
  const exact = IntegralArea(x) - IntegralArea(a);
  const dx = (x - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const mid = a + (i + 0.5) * dx;
    sum += IntegralFunction(mid) * dx;
  }
  const error = sum - exact;
  const bars = Array.from({ length: n }, (_, i) => {
    const x0 = a + i * dx;
    const xm = x0 + dx / 2;
    const y = IntegralFunction(xm);
    const p0 = toSvg(x0, 0);
    const p1 = toSvg(x0 + dx, 0);
    const py = toSvg(x0 + dx, y);
    return <rect key={i} x={p0.x + 1} y={py.y} width={Math.max(2, p1.x - p0.x - 2)} height={Math.max(0, p0.y - py.y)} fill="#a78bfa" fillOpacity={0.25} stroke="#a78bfa" strokeOpacity={0.5} />;
  });
  const end = toSvg(x, IntegralFunction(x));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div>
        <h2 className="text-2xl font-bold">Rectangles become infinitely thin</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Imagine measuring a curved skate ramp with little blocks. Big blocks leave gaps or overshoot. Make the blocks thinner and the estimate hugs the curve more closely. The definite integral is the limit of this process.
        </p>
        <div className="mt-4"><MathBlock tex="\int_a^b f(x)\,dx=\lim_{n\to\infty}\sum_{i=1}^{n}f(x_i^*)\,\Delta x" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
              <GridLines />
              <path d={curvePath(IntegralFunction, 0, 4.5)} fill="none" stroke="#ffd166" strokeWidth={3} />
              {bars}
              <circle cx={end.x} cy={end.y} r={7} fill="#22e5c9" stroke="white" strokeWidth={2} />
              <DragHandle x={x} y={0} color="#ff5f9e" svgRef={svgRef} onDrag={(nx) => setX(Math.max(0.5, nx))} />
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag the pink endpoint · use the slider for thinner blocks</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Rectangle estimate", value: sum.toFixed(3), color: "border-[#a78bfa] text-[#a78bfa]" },
              { label: "Exact integral", value: exact.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Watch the approximation improve</h3>
          <label className="block text-xs font-mono text-[#a78bfa] mb-2">✦ Number of rectangles: {n}</label>
          <input type="range" min="2" max="32" step="1" value={n} onChange={(e) => setN(Number(e.target.value))} className="w-full" />
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${Math.abs(error) < 0.02 ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]" : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>
            {Math.abs(error) < 0.02 ? "✓ Notice how the rectangle estimate is almost exact." : "⚠️ Make the rectangles thinner and watch the gap shrink."}
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Current slice width</div>
            <div className="font-mono text-xl">Δx = <NumberColor value={dx} /></div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">When <MathBlock tex="\Delta x" inline /> gets tiny, the sum becomes a precise mathematical area. That limiting process is what turns “roughly add these blocks” into “this is the exact accumulation.”</p>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(3);
  const [c, setC] = useState(0.22);
  const [base, setBase] = useState(0.9);
  const antiderivative = (x: number) => (c / 3) * x * x * x + base * x;
  const result = antiderivative(b) - antiderivative(a);
  const signed = b >= a ? result : -result;
  const status = Math.abs(signed) < 0.01 ? "Zero accumulation" : signed > 0 ? "Positive accumulation" : "Negative accumulation (direction reversed)";

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div>
        <h2 className="text-2xl font-bold">Change the curve. Change the total.</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a delivery route. Change the route’s speed profile or the time window, and the total distance changes. Here you can control the curve and the interval while the integral updates instantly.
        </p>
        <div className="mt-4"><MathBlock tex="\int_a^b (cx^2+k)\,dx=\frac{c}{3}(b^3-a^3)+k(b-a)" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="bg-background border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold mb-4">Integral controls</h3>
            <label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Move a: {a.toFixed(1)}</label>
            <input type="range" min="-2" max="2" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#ffd166] mt-6 mb-2">✦ Move b: {b.toFixed(1)}</label>
            <input type="range" min="0" max="4" step="0.5" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Stretch c: {c.toFixed(2)}</label>
            <input type="range" min="-0.4" max="0.6" step="0.02" value={c} onChange={(e) => setC(Number(e.target.value))} className="w-full" />
            <label className="block text-xs font-mono text-[#a78bfa] mt-6 mb-2">✦ Shift k: {base.toFixed(2)}</label>
            <input type="range" min="0" max="1.8" step="0.1" value={base} onChange={(e) => setBase(Number(e.target.value))} className="w-full" />
          </div>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">Live calculation</div>
            <div className="font-mono text-xl leading-loose">
              ∫<sub>{a.toFixed(1)}</sub><sup>{b.toFixed(1)}</sup> ({c.toFixed(2)}x² + {base.toFixed(2)}) dx
            </div>
            <div className="mt-4 text-4xl font-extrabold font-mono"><NumberColor value={signed} /></div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <div className={`border rounded-xl p-6 ${signed > 0 ? "border-[#34d399]/40 bg-[#34d399]/10" : signed < 0 ? "border-[#fb923c]/40 bg-[#fb923c]/10" : "border-[#ffd166]/40 bg-[#ffd166]/10"}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Accumulation status</div>
            <div className={`font-mono font-bold mt-2 ${signed > 0 ? "text-[#34d399]" : signed < 0 ? "text-[#fb923c]" : "text-[#ffd166]"}`}>{status}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "F(b) − F(a)", value: signed.toFixed(2), color: signed >= 0 ? "border-[#34d399] text-[#34d399]" : "border-[#fb923c] text-[#fb923c]" },
              { label: "Interval", value: (b - a).toFixed(2), color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
                <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Try a negative coefficient.</strong> The curve can dip below the axis, and signed area can become negative. Integrals keep track of direction, not just size.</p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(1.7);
  const [y, setY] = useState(2.1);
  const [z, setZ] = useState(1.4);

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
    scene.add(new THREE.GridHelper(10, 10, 0x444444, 0x222222));
    const origin = new THREE.Vector3(0, 0, 0);
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 4, 0xff5f9e);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 4, 0x22e5c9);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 4, 0xffd166);
    scene.add(xAxis, yAxis, zAxis);
    const planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.28, side: THREE.DoubleSide, wireframe: true });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.scale.set(3.5, 3.5, 3.5);
    scene.add(plane);
    const vectorGeometry = new THREE.BufferGeometry();
    const vectorMaterial = new THREE.LineBasicMaterial({ color: 0xffd166 });
    const vectorLine = new THREE.Line(vectorGeometry, vectorMaterial);
    scene.add(vectorLine);
    const pointGeometry = new THREE.SphereGeometry(0.16, 24, 24);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    scene.add(point);
    const updateVector = () => {
      vectorGeometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
      point.position.set(x, y, z);
      plane.position.set(x / 2, 0, z / 2);
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
      planeGeometry.dispose();
      planeMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [x, y, z]);

  const magnitude = Math.sqrt(x * x + y * y + z * z);
  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div>
        <h2 className="text-2xl font-bold">Accumulation can live in more than one dimension</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          A game world can track position, height, and depth all at once. Multivariable integrals extend accumulation to surfaces and volumes — useful whenever your data lives across multiple continuous coordinates.
        </p>
        <div className="mt-4"><MathBlock tex="\iiint_V f(x,y,z)\,dV" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: 420 }} />
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Move the point through 3D</h3>
          {[
            { label: "X axis", value: x, setter: setX, color: "#ff5f9e" },
            { label: "Y axis", value: y, setter: setY, color: "#22e5c9" },
            { label: "Z axis", value: z, setter: setZ, color: "#ffd166" },
          ].map((axis) => (
            <div key={axis.label}>
              <div className="text-xs font-mono mb-2" style={{ color: axis.color }}>✦ Move {axis.label}: {axis.value.toFixed(1)}</div>
              <input type="range" min="-3.5" max="3.5" step="0.1" value={axis.value} onChange={(e) => axis.setter(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Position</div>
            <div className="font-mono text-lg">[{x.toFixed(1)}, {y.toFixed(1)}, {z.toFixed(1)}]</div>
            <div className="text-2xl font-bold font-mono mt-2 text-[#ffd166]">|p| = {magnitude.toFixed(2)}</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice:</strong> the same “add tiny pieces” idea survives even when the tiny pieces are little volume elements instead of line segments.</p>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const [features, setFeatures] = useState<Feature[]>([
    { key: "time", label: "Time", value: "seconds", color: "#ff5f9e" },
    { key: "speed", label: "Speed", value: "m/s", color: "#22e5c9" },
  ]);
  const all: Feature[] = [
    { key: "time", label: "Time", value: "seconds", color: "#ff5f9e" },
    { key: "speed", label: "Speed", value: "m/s", color: "#22e5c9" },
    { key: "accel", label: "Acceleration", value: "m/s²", color: "#ffd166" },
    { key: "energy", label: "Energy rate", value: "watts", color: "#a78bfa" },
    { key: "prob", label: "Probability density", value: "1/unit", color: "#6366f1" },
  ];
  const toggle = (key: string) => {
    setFeatures((prev) => prev.some((f) => f.key === key) ? prev.filter((f) => f.key !== key) : [...prev, all.find((f) => f.key === key)!]);
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div>
        <h2 className="text-2xl font-bold">A moving object becomes a stream of tiny measurements</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Think of a fitness watch. It samples your speed, acceleration, heart-related signals, and more over time. An integral can turn a changing rate into a total quantity — for example, speed into distance or power into energy.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Choose the dimensions</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">Toggle features to see how a real measurement vector grows from a few signals into many.</p>
          <div className="grid grid-cols-2 gap-3">
            {all.map((f) => {
              const active = features.some((x) => x.key === f.key);
              return <button key={f.key} onClick={() => toggle(f.key)} className={`text-left border rounded-xl p-3 transition-all ${active ? "bg-background border-border" : "bg-background/40 border-border/60 opacity-60"}`}>
                <div className="text-xs font-bold font-mono" style={{ color: f.color }}>{active ? "●" : "○"} {f.label}</div>
                <div className="text-[10px] text-foreground-muted mt-1">{f.value}</div>
              </button>;
            })}
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">Measurement vector</h3>
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="font-mono text-lg leading-relaxed">
              <span className="text-foreground-muted">x = </span>
              <span className="text-[#ffd166]">[</span>
              {features.map((f, i) => <React.Fragment key={f.key}><span style={{ color: f.color }}>{i ? ", " : ""}{f.label.toLowerCase()}</span></React.Fragment>)}
              <span className="text-[#ffd166]">]</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-4 text-[#34d399]">{features.length} active features</div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">The integral does not care whether the signal came from a phone, a car, or a robot. It only needs a rate or density and a rule for accumulating tiny contributions.</p>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [mu, setMu] = useState(0.2);
  const [sigma, setSigma] = useState(1.1);
  const [x, setX] = useState(0.8);
  const [threshold, setThreshold] = useState(0.65);
  const gaussian = (t: number) => Math.exp(-0.5 * ((t - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
  const xs = Array.from({ length: 40 }, (_, i) => -3 + (6 * i) / 39);
  const totalProb = xs.slice(0, -1).reduce((acc, _, i) => acc + ((gaussian(xs[i]) + gaussian(xs[i + 1])) / 2) * (xs[i + 1] - xs[i]), 0);
  const density = gaussian(x);
  const output = 1 / (1 + Math.exp(-density * 6));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">6 · Integrals in Classic AI — Probability Models</div>
        <h2 className="text-2xl font-bold">“How likely is this value?” often means area under a curve</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          You know how a spam filter asks how plausible a message is? Probability models use density curves, and integrals turn pieces of those curves into actual probabilities. The total area under a probability density curve must add up to 1.
        </p>
        <div className="mt-4"><MathBlock tex="P(a\le X\le b)=\int_a^b p(x)\,dx" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <svg width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none" style={{ maxWidth: "100%" }}>
              <GridLines />
              <path d={curvePath(gaussian, -3, 3)} fill="none" stroke="#6366f1" strokeWidth={3} />
              <line x1={OX + x * SCALE} y1={OY} x2={OX + x * SCALE} y2={OY - density * SCALE} stroke="#ffd166" strokeWidth={2} strokeDasharray="5 4" />
              <circle cx={OX + x * SCALE} cy={OY - density * SCALE} r={8} fill="#ffd166" stroke="white" strokeWidth={2} />
              <text x={OX + x * SCALE + 10} y={OY - density * SCALE - 12} fill="#ffd166" fontSize="12" fontWeight="bold">p(x)</text>
              <text x={18} y={30} fill="#6366f1" fontSize="12" fontWeight="bold">density curve</text>
            </svg>
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Use the sliders to move x and reshape the distribution</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Approx. total probability", value: totalProb.toFixed(3), color: "border-[#34d399] text-[#34d399]" },
              { label: "Density at x", value: density.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-2xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Tune the probability model</h3>
          <label className="block text-xs font-mono text-[#6366f1] mb-2">✦ Move the mean μ = {mu.toFixed(2)}</label>
          <input type="range" min="-1" max="1" step="0.05" value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Change the spread σ = {sigma.toFixed(2)}</label>
          <input type="range" min="0.5" max="1.8" step="0.05" value={sigma} onChange={(e) => setSigma(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#ffd166] mt-5 mb-2">✦ Inspect x = {x.toFixed(2)}</label>
          <input type="range" min="-2.5" max="2.5" step="0.05" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#ff5f9e] mt-5 mb-2">✦ Prediction threshold = {threshold.toFixed(2)}</label>
          <input type="range" min="0.2" max="0.9" step="0.05" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">AI output</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-2">{output.toFixed(3)}</div>
            <div className={`text-xs font-mono px-3 py-2 rounded-lg border mt-3 ${output > threshold ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]" : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>
              {output > threshold ? "✓ Model fires — prediction: HIGH" : "✗ Below threshold — prediction: LOW"}
            </div>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">This is the same basic idea used by probability-based AI: integrate a density over a region to turn a smooth curve into a probability you can reason with.</p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const [tau, setTau] = useState(0.75);
  const [noise, setNoise] = useState(0.3);
  const [steps, setSteps] = useState(8);
  const weights = Array.from({ length: 4 }, (_, i) => {
    const raw = Math.exp(-((i + 1) * tau + noise) / Math.max(0.5, steps / 8));
    return raw;
  });
  const max = Math.max(...weights);
  const entropy = -weights.reduce((acc, v) => {
    const p = v / weights.reduce((s, q) => s + q, 0);
    return acc + p * Math.log(p + 1e-9);
  }, 0);
  const integratedSignal = weights.reduce((s, v) => s + v / max, 0) / weights.length;
  const curveVals = Array.from({ length: 18 }, (_, i) => Math.sin((i + 1) * tau) * Math.exp(-noise * i / 10) + 1.2);

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">7 · Integrals in Deep Learning — Neural ODEs</div>
        <h2 className="text-2xl font-bold">A neural network can evolve continuously</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          Most neural networks jump from layer to layer. A <strong className="text-foreground">Neural ODE</strong> treats hidden-state change like continuous motion: instead of adding a fixed number of layers, it integrates a differential equation along the way.
        </p>
        <div className="mt-4"><MathBlock tex="\mathbf{h}(T)=\mathbf{h}(0)+\int_0^T f(\mathbf{h}(t),t,\theta)\,dt" /></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5">
          <div className="relative bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-3">Continuous hidden-state flow</div>
            <svg width="100%" viewBox="0 0 480 330" className="select-none">
              {curveVals.map((v, i) => {
                const x = 18 + i * 25;
                const y = 265 - v * 80;
                const opacity = 0.15 + 0.85 * (v - Math.min(...curveVals)) / (Math.max(...curveVals) - Math.min(...curveVals) + 1e-6);
                return <React.Fragment key={i}><rect x={x} y={40} width={20} height={220} rx={5} fill="#6366f1" fillOpacity={Math.max(0.05, opacity * 0.22)} /><circle cx={x + 10} cy={y} r={7} fill="#ffd166" fillOpacity={opacity} /><text x={x + 10} y={300} fontSize={8} fill="rgba(255,255,255,0.35)" textAnchor="middle">{i + 1}</text></React.Fragment>;
              })}
              <path d={curveVals.map((v, i) => `${i === 0 ? "M" : "L"} ${28 + i * 25} ${265 - v * 80}`).join(" ")} fill="none" stroke="#a78bfa" strokeWidth={2.5} />
              <text x={18} y={25} fill="#a78bfa" fontSize={12} fontWeight="bold">integrated trajectory</text>
            </svg>
            <div className="text-[10px] font-mono text-foreground-muted mt-2">✦ Change τ, noise, and integration steps to reshape the trajectory</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Mean signal", value: integratedSignal.toFixed(3), color: "border-[#ffd166] text-[#ffd166]" },
              { label: "State entropy", value: entropy.toFixed(3), color: "border-indigo-400 text-indigo-400" },
              { label: "Final weight", value: (weights[weights.length - 1] / max).toFixed(3), color: "border-[#34d399] text-[#34d399]" },
            ].map((s) => <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}><div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div><div className="text-xl font-bold font-mono mt-1">{s.value}</div></div>)}
          </div>
        </div>
        <div className="w-full lg:w-2/5 space-y-5">
          <h3 className="text-lg font-bold">Control the continuous path</h3>
          <label className="block text-xs font-mono text-[#6366f1] mb-2">✦ Dynamics scale τ = {tau.toFixed(2)}</label>
          <input type="range" min="0.2" max="1.4" step="0.05" value={tau} onChange={(e) => setTau(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#fb923c] mt-5 mb-2">✦ Noise = {noise.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.05" value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="w-full" />
          <label className="block text-xs font-mono text-[#22e5c9] mt-5 mb-2">✦ Integration steps = {steps}</label>
          <input type="range" min="2" max="16" step="1" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full" />
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Live model output</div>
            <div className="text-4xl font-extrabold font-mono text-[#6366f1]">{integratedSignal.toFixed(3)}</div>
            <div className="mt-2"><MathBlock tex="\mathbf{h}(T)=\mathbf{h}(0)+\int_0^T f(\mathbf{h}(t),t,\theta)\,dt" /></div>
          </div>
          <div className="text-xs font-mono px-3 py-2 rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 text-[#6366f1]">✓ The network accumulates tiny state updates along a continuous path.</div>
          <p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Why this matters:</strong> integrals let continuous-time deep-learning models replace a stack of discrete updates with a mathematically controlled trajectory.</p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes: ConceptNode[] = [
    { label: "Accumulation", desc: "Add tiny contributions into a total.", color: "#ffd166" },
    { label: "Area", desc: "Integral measures signed area under a curve.", color: "#ff5f9e" },
    { label: "Riemann Sum", desc: "Approximate the area using thin rectangles.", color: "#22e5c9" },
    { label: "Volume", desc: "Extend accumulation to 3D regions.", color: "#a78bfa" },
    { label: "Real Data", desc: "Turn changing rates and densities into totals.", color: "#34d399" },
    { label: "Probability Models", desc: "Integrate density to get probability.", color: "#6366f1" },
    { label: "Neural ODEs", desc: "Integrate hidden-state dynamics continuously.", color: "#fb923c" },
    { label: "Continuous-Time AI", desc: "Use differential equations as trainable models.", color: "#ffd166" },
  ];
  return (
    <section className="space-y-5">
      <div>
        <div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">8 · Concept Map</div>
        <h2 className="text-2xl font-bold">From tiny pieces to modern AI</h2>
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Follow the idea from pure calculus to continuous-time machine learning.</p>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{ borderColor: n.color + "55" }}>
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
      <p className="text-foreground-muted text-sm max-w-lg">Basically: an integral turns lots of tiny changes into one useful total — and that simple trick shows up from measuring area to modelling continuous AI systems.</p>
      <Link href="/calculus" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Calculus</Link>
    </footer>
  );
}

export default function IntegralsPage() {
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
