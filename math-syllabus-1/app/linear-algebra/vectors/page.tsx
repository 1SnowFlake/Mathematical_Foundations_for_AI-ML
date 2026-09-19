"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import EmbeddingsVisualizerSection from "@/components/primitives/EmbeddingsVisualizerSection";


// ─────────────────────────────────────────────────
//  SHARED HELPERS
// ─────────────────────────────────────────────────

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;

function toSvg(x: number, y: number) {
  return { x: OX + x * SCALE, y: OY - y * SCALE };
}

function toGrid(svgX: number, svgY: number, snap = 0.5) {
  const gx = (svgX - OX) / SCALE;
  const gy = -(svgY - OY) / SCALE;
  return {
    x: Math.round(gx / snap) * snap,
    y: Math.round(gy / snap) * snap,
  };
}

const LIMIT = 4.5;
function clamp(n: number) {
  return Math.max(-LIMIT, Math.min(LIMIT, n));
}

/** Arrowhead marker definition */
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
    </marker>
  );
}

/** Thin grid lines */
function GridLines() {
  const lines = [];
  for (let i = -5; i <= 5; i++) {
    const vp = toSvg(i, 0);
    const hp = toSvg(0, i);
    const bold = i === 0;
    lines.push(
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H}
        stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
        strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y}
        stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
        strokeWidth={bold ? 1.5 : 1} />
    );
    if (i !== 0) {
      const lv = toSvg(i, 0);
      const lh = toSvg(0, i);
      lines.push(
        <text key={`lv${i}`} x={lv.x} y={OY + 16} fill="rgba(255,255,255,0.25)"
          fontSize="9" textAnchor="middle">{i}</text>,
        <text key={`lh${i}`} x={OX - 14} y={lh.y + 3.5} fill="rgba(255,255,255,0.25)"
          fontSize="9" textAnchor="middle">{i}</text>
      );
    }
  }
  return <>{lines}</>;
}

/** Draggable vector head circle */
function DragHandle({
  x, y, color, svgRef,
  onDrag,
}: {
  x: number; y: number; color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);
  const p = toSvg(x, y);

  const onPointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const g = toGrid(e.clientX - rect.left, e.clientY - rect.top);
    onDrag(clamp(g.x), clamp(g.y));
  };
  const onPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <circle
      cx={p.x} cy={p.y} r={10}
      fill={color} fillOpacity={0.9}
      stroke="white" strokeWidth={2}
      style={{ cursor: "grab", filter: "drop-shadow(0 0 6px " + color + ")" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}

/** Renders one draggable vector from origin */
function DraggableVector({
  vec, color, markerId, svgRef, onDrag, label,
}: {
  vec: { x: number; y: number };
  color: string;
  markerId: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
  label?: string;
}) {
  const o = toSvg(0, 0);
  const h = toSvg(vec.x, vec.y);
  const mid = { x: (o.x + h.x) / 2 - 12, y: (o.y + h.y) / 2 - 8 };

  return (
    <>
      <line x1={o.x} y1={o.y} x2={h.x} y2={h.y}
        stroke={color} strokeWidth={3} markerEnd={`url(#${markerId})`} />
      {label && (
        <text x={mid.x} y={mid.y} fill={color} fontSize={13} fontWeight="bold"
          style={{ pointerEvents: "none", fontFamily: "monospace" }}>{label}</text>
      )}
      <DragHandle x={vec.x} y={vec.y} color={color} svgRef={svgRef} onDrag={onDrag} />
    </>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 1 – HERO: Drag any vector
// ─────────────────────────────────────────────────
function HeroVector() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v, setV] = useState({ x: 3, y: 2 });

  const mag = Math.sqrt(v.x ** 2 + v.y ** 2).toFixed(2);
  const deg = Math.round((Math.atan2(v.y, v.x) * 180) / Math.PI);

  const head = toSvg(v.x, v.y);
  const xp = toSvg(v.x, 0);
  const o = toSvg(0, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      <div className="relative flex-shrink-0">
        <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
          <defs>
            <ArrowMarker id="hero-v" color="#ffd166" />
            <ArrowMarker id="hero-x" color="#ff5f9e" />
            <ArrowMarker id="hero-y" color="#22e5c9" />
          </defs>
          <GridLines />
          {/* Component projections */}
          <line x1={o.x} y1={o.y} x2={xp.x} y2={xp.y}
            stroke="#ff5f9e" strokeWidth={2.5} strokeDasharray="5 3" markerEnd="url(#hero-x)" />
          <line x1={xp.x} y1={xp.y} x2={head.x} y2={head.y}
            stroke="#22e5c9" strokeWidth={2.5} strokeDasharray="5 3" markerEnd="url(#hero-y)" />
          {/* Main vector */}
          <line x1={o.x} y1={o.y} x2={head.x} y2={head.y}
            stroke="#ffd166" strokeWidth={3.5} markerEnd="url(#hero-v)" />
          <DragHandle x={v.x} y={v.y} color="#ffd166" svgRef={svgRef} onDrag={(x, y) => setV({ x, y })} />
        </svg>
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
          ✦ Drag the yellow dot
        </div>
      </div>

      {/* Live readout */}
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-3">Live Vector Decomposition</h3>
          {/* column vector */}
          <div className="flex items-start gap-6 font-mono">
            <div className="flex flex-col items-center text-3xl gap-0 font-bold leading-tight">
              <span className="text-foreground text-base mb-1">v =</span>
              <span className="border-l-4 border-r-4 border-foreground/60 px-3 py-1 flex flex-col items-center gap-1">
                <span className="text-[#ff5f9e]">{v.x}</span>
                <span className="text-[#22e5c9]">{v.y}</span>
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f9e] inline-block" />
                <span className="text-sm text-foreground-muted font-mono">x = {v.x} units →</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#22e5c9] inline-block" />
                <span className="text-sm text-foreground-muted font-mono">y = {v.y} units ↑</span>
              </div>
            </div>
          </div>
        </div>

        {/* stat chips */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Magnitude |v|", value: `${mag} units`, color: "border-[#ffd166] text-[#ffd166]" },
            { label: "Angle θ", value: `${deg}°`, color: "border-indigo-400 text-indigo-400" },
          ].map(s => (
            <div key={s.label}
              className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
              <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-accent pl-3">
          Every vector is secretly two simpler arrows working together — one horizontal, one vertical. These are called <strong className="text-foreground">components</strong>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 2 – Draggable Vector ADDITION
// ─────────────────────────────────────────────────
function VectorAdditionLab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState({ x: 2, y: 1 });
  const [b, setB] = useState({ x: -1, y: 3 });

  const r = { x: a.x + b.x, y: a.y + b.y };
  const o = toSvg(0, 0);
  const aTip = toSvg(a.x, a.y);
  const rTip = toSvg(r.x, r.y);
  // B drawn from tip of A
  const bTailSvg = aTip;
  const bTipSvg = toSvg(r.x, r.y);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      <div className="relative flex-shrink-0">
        <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
          <defs>
            <ArrowMarker id="add-a" color="#ff5f9e" />
            <ArrowMarker id="add-b" color="#22e5c9" />
            <ArrowMarker id="add-r" color="#ffd166" />
          </defs>
          <GridLines />

          {/* resultant first (behind) */}
          <line x1={o.x} y1={o.y} x2={rTip.x} y2={rTip.y}
            stroke="#ffd166" strokeWidth={4} markerEnd="url(#add-r)" strokeOpacity={0.7} />

          {/* A */}
          <line x1={o.x} y1={o.y} x2={aTip.x} y2={aTip.y}
            stroke="#ff5f9e" strokeWidth={3} markerEnd="url(#add-a)" />

          {/* B (tip-to-tail, starts at A's head) */}
          <line x1={bTailSvg.x} y1={bTailSvg.y} x2={bTipSvg.x} y2={bTipSvg.y}
            stroke="#22e5c9" strokeWidth={3} strokeDasharray="6 3" markerEnd="url(#add-b)" />

          {/* Drag handles for A and B heads */}
          <DragHandle x={a.x} y={a.y} color="#ff5f9e" svgRef={svgRef}
            onDrag={(x, y) => setA({ x, y })} />
          <DragHandle x={r.x} y={r.y} color="#22e5c9" svgRef={svgRef}
            onDrag={(x, y) => setB({ x: x - a.x, y: y - a.y })} />

          {/* Labels */}
          <text x={(o.x + aTip.x) / 2 - 14} y={(o.y + aTip.y) / 2 - 8}
            fill="#ff5f9e" fontSize={13} fontWeight="bold" fontFamily="monospace">A</text>
          <text x={(bTailSvg.x + bTipSvg.x) / 2 + 8} y={(bTailSvg.y + bTipSvg.y) / 2}
            fill="#22e5c9" fontSize={13} fontWeight="bold" fontFamily="monospace">B</text>
          <text x={(o.x + rTip.x) / 2 + 6} y={(o.y + rTip.y) / 2 + 14}
            fill="#ffd166" fontSize={13} fontWeight="bold" fontFamily="monospace">A+B</text>
        </svg>
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
          ✦ Drag pink dot (A) or cyan dot (A+B tip)
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <h3 className="text-lg font-bold">Tip-to-Tail Addition</h3>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Place the <span className="text-[#22e5c9] font-semibold">tail of B</span> at the <span className="text-[#ff5f9e] font-semibold">head of A</span>. The resultant is the straight arrow from the origin to where B's head lands.
        </p>

        {/* Live equation */}
        <div className="bg-background border border-border rounded-xl p-4 font-mono text-sm space-y-2">
          {[
            { label: "A", v: a, color: "#ff5f9e" },
            { label: "B", v: b, color: "#22e5c9" },
            { label: "A + B", v: r, color: "#ffd166" },
          ].map(({ label, v, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-10 font-bold" style={{ color }}>{label} =</span>
              <span className="border-l-2 border-r-2 border-foreground/40 px-2 flex flex-col items-center leading-tight" style={{ color }}>
                <span>{v.x}</span>
                <span>{v.y}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#ffd166]/10 border border-[#ffd166]/30 rounded-xl p-3 text-xs text-[#ffd166] font-mono">
          Component rule: add x-values together, add y-values together.<br />
          [{a.x}] + [{b.x}] = [{r.x}] &nbsp;|&nbsp; [{a.y}] + [{b.y}] = [{r.y}]
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 3 – Draggable DOT PRODUCT explorer
// ─────────────────────────────────────────────────
function DotProductExplorer() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState({ x: 3, y: 1 });
  const [b, setB] = useState({ x: 1, y: 3 });

  const dot = a.x * b.x + a.y * b.y;
  const magA = Math.sqrt(a.x ** 2 + a.y ** 2);
  const magB = Math.sqrt(b.x ** 2 + b.y ** 2);
  const cosTheta = magA && magB ? dot / (magA * magB) : 0;
  const angle = Math.round(Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI);

  const o = toSvg(0, 0);
  const aTip = toSvg(a.x, a.y);
  const bTip = toSvg(b.x, b.y);

  // Projection of a onto b
  let projLen = 0, projTip = { x: 0, y: 0 };
  if (magB > 0) {
    projLen = dot / magB;
    const bUnit = { x: b.x / magB, y: b.y / magB };
    projTip = toSvg(bUnit.x * projLen, bUnit.y * projLen);
  }

  const dotColor = dot > 0 ? "#22e5c9" : dot < 0 ? "#ff5f9e" : "#888";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      <div className="relative flex-shrink-0">
        <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
          <defs>
            <ArrowMarker id="dp-a" color="#ffd166" />
            <ArrowMarker id="dp-b" color="#a78bfa" />
          </defs>
          <GridLines />

          {/* Projection line (dashed, from a tip to b line) */}
          <line x1={aTip.x} y1={aTip.y} x2={projTip.x} y2={projTip.y}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="4 3" />
          <circle cx={projTip.x} cy={projTip.y} r={5} fill={dotColor} fillOpacity={0.8} />

          {/* Vectors */}
          <line x1={o.x} y1={o.y} x2={aTip.x} y2={aTip.y}
            stroke="#ffd166" strokeWidth={3.5} markerEnd="url(#dp-a)" />
          <line x1={o.x} y1={o.y} x2={bTip.x} y2={bTip.y}
            stroke="#a78bfa" strokeWidth={3.5} markerEnd="url(#dp-b)" />

          {/* Labels */}
          <text x={(o.x + aTip.x) / 2 - 14} y={(o.y + aTip.y) / 2 - 10}
            fill="#ffd166" fontSize={14} fontWeight="bold" fontFamily="monospace">a</text>
          <text x={(o.x + bTip.x) / 2 + 8} y={(o.y + bTip.y) / 2}
            fill="#a78bfa" fontSize={14} fontWeight="bold" fontFamily="monospace">b</text>

          <DragHandle x={a.x} y={a.y} color="#ffd166" svgRef={svgRef} onDrag={(x, y) => setA({ x, y })} />
          <DragHandle x={b.x} y={b.y} color="#a78bfa" svgRef={svgRef} onDrag={(x, y) => setB({ x, y })} />
        </svg>
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
          ✦ Drag both vector heads
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <h3 className="text-lg font-bold">Dot Product: How aligned are two vectors?</h3>
        <p className="text-sm text-foreground-muted leading-relaxed">
          The dot product measures how much two vectors point <em>in the same direction</em>. Drag both vectors to feel how the angle between them changes the result.
        </p>

        {/* Big dot product display */}
        <div className="flex items-center justify-center py-4 border border-border rounded-xl bg-background">
          <div className="text-center">
            <div className="text-xs text-foreground-muted font-mono mb-1 uppercase tracking-widest">a · b</div>
            <div className="text-5xl font-extrabold font-mono" style={{ color: dotColor }}>
              {dot.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center font-mono text-sm">
          <div className="border border-border bg-background rounded-xl p-3">
            <div className="text-foreground-muted text-[10px] mb-1">ANGLE θ</div>
            <div className="text-lg font-bold">{angle}°</div>
          </div>
          <div className="border border-border bg-background rounded-xl p-3">
            <div className="text-foreground-muted text-[10px] mb-1">|a|</div>
            <div className="text-lg font-bold text-[#ffd166]">{magA.toFixed(2)}</div>
          </div>
          <div className="border border-border bg-background rounded-xl p-3">
            <div className="text-foreground-muted text-[10px] mb-1">|b|</div>
            <div className="text-lg font-bold text-[#a78bfa]">{magB.toFixed(2)}</div>
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono text-foreground-muted">
          <div className="flex justify-between border-b border-border/20 pb-1">
            <span>a · b = aₓbₓ + a_y b_y</span>
            <span className="font-bold text-foreground">= {a.x}×{b.x} + {a.y}×{b.y} = <span style={{ color: dotColor }}>{dot}</span></span>
          </div>
          <div className={`text-center py-2 rounded-lg border px-3 ${
            angle < 90 ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
            : angle > 90 ? "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
            : "border-border bg-background text-foreground-muted"
          }`}>
            {angle < 90 ? "✦ Vectors point roughly the same way (dot > 0)" :
             angle > 90 ? "✦ Vectors point away from each other (dot < 0)" :
             "✦ Vectors are perpendicular — completely independent (dot = 0)"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 4 – SCALAR SCALING (drag to scale)
// ─────────────────────────────────────────────────
function ScalarLab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const base = { x: 2.5, y: 1.5 };
  const [scalar, setScalar] = useState(1.5);
  const scaledRef = useRef({ x: base.x * 1.5, y: base.y * 1.5 });

  // Drag the scaled vector's head to change the scalar
  const handleDrag = useCallback((x: number, y: number) => {
    // Project (x,y) onto direction of base vector to get scalar
    const mag2 = base.x ** 2 + base.y ** 2;
    if (mag2 === 0) return;
    const s = (x * base.x + y * base.y) / mag2;
    setScalar(parseFloat(Math.max(-2, Math.min(3, s)).toFixed(2)));
  }, [base.x, base.y]);

  const scaled = { x: base.x * scalar, y: base.y * scalar };
  const o = toSvg(0, 0);
  const baseTip = toSvg(base.x, base.y);
  const scaledTip = toSvg(scaled.x, scaled.y);

  const scColor = scalar > 0 ? "#ffd166" : "#ff5f9e";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      <div className="relative flex-shrink-0">
        <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
          <defs>
            <ArrowMarker id="sc-base" color="rgba(255,255,255,0.4)" />
            <ArrowMarker id="sc-scaled" color={scColor} />
          </defs>
          <GridLines />

          {/* Base (reference) */}
          <line x1={o.x} y1={o.y} x2={baseTip.x} y2={baseTip.y}
            stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeDasharray="4 3"
            markerEnd="url(#sc-base)" />
          <text x={(o.x + baseTip.x) / 2 + 6} y={(o.y + baseTip.y) / 2 - 8}
            fill="rgba(255,255,255,0.4)" fontSize={11} fontFamily="monospace">v (original)</text>

          {/* Scaled */}
          <line x1={o.x} y1={o.y} x2={scaledTip.x} y2={scaledTip.y}
            stroke={scColor} strokeWidth={4} markerEnd="url(#sc-scaled)" />

          <DragHandle x={scaled.x} y={scaled.y} color={scColor} svgRef={svgRef} onDrag={handleDrag} />
        </svg>
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
          ✦ Drag the tip along the vector's direction
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <h3 className="text-lg font-bold">Scalar Multiplication</h3>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Multiplying a vector by a number <em>stretches</em> or <em>shrinks</em> it. A negative scalar <em>flips its direction</em>. Drag the colored tip along the vector line.
        </p>

        <div className="flex items-center justify-center py-4 border border-border rounded-xl bg-background">
          <span className="text-5xl font-extrabold font-mono" style={{ color: scColor }}>
            {scalar}×
          </span>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 font-mono text-sm">
          <div className="flex items-center gap-4">
            <span style={{ color: scColor }}>{scalar}</span>
            <span>×</span>
            <span className="border-l-2 border-r-2 border-foreground/40 px-2 flex flex-col items-center leading-tight">
              <span>{base.x}</span><span>{base.y}</span>
            </span>
            <span>=</span>
            <span className="border-l-2 border-r-2 px-2 flex flex-col items-center leading-tight" style={{ borderColor: scColor, color: scColor }}>
              <span>{scaled.x.toFixed(1)}</span><span>{scaled.y.toFixed(1)}</span>
            </span>
          </div>
        </div>

        <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
          scalar < 0 ? "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]" :
          scalar === 0 ? "border-border bg-background text-foreground-muted" :
          "border-[#ffd166]/30 bg-[#ffd166]/5 text-[#ffd166]"
        }`}>
          {scalar < 0 ? "⚠️ Negative scalar — direction reversed!" :
           scalar === 0 ? "Zero scalar — collapses to the zero vector." :
           scalar < 1 ? "Scalar < 1 — vector shrinks." :
           "Scalar > 1 — vector stretches."}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 5 – LINEAR COMBINATION Explorer
// ─────────────────────────────────────────────────
function LinearCombinationLab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [alpha, setAlpha] = useState(2);
  const [beta, setBeta] = useState(1);
  const [e1, setE1] = useState({ x: 1, y: 0 });
  const [e2, setE2] = useState({ x: 0, y: 1 });

  const result = { x: alpha * e1.x + beta * e2.x, y: alpha * e1.y + beta * e2.y };
  const o = toSvg(0, 0);
  const e1Tip = toSvg(e1.x, e1.y);
  const e2Tip = toSvg(e2.x, e2.y);
  const resultTip = toSvg(result.x, result.y);
  // scale arrows
  const ae1Tip = toSvg(alpha * e1.x, alpha * e1.y);
  const be2Tail = ae1Tip;
  const be2TipS = toSvg(alpha * e1.x + beta * e2.x, alpha * e1.y + beta * e2.y);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      <div className="relative flex-shrink-0">
        <svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{ maxWidth: "100%" }}>
          <defs>
            <ArrowMarker id="lc-e1" color="#ff5f9e" />
            <ArrowMarker id="lc-e2" color="#22e5c9" />
            <ArrowMarker id="lc-r" color="#ffd166" />
          </defs>
          <GridLines />

          {/* Scaled e1 */}
          <line x1={o.x} y1={o.y} x2={ae1Tip.x} y2={ae1Tip.y}
            stroke="#ff5f9e" strokeWidth={3} markerEnd="url(#lc-e1)" />
          {/* Scaled e2 tip-to-tail */}
          <line x1={be2Tail.x} y1={be2Tail.y} x2={be2TipS.x} y2={be2TipS.y}
            stroke="#22e5c9" strokeWidth={3} strokeDasharray="5 3" markerEnd="url(#lc-e2)" />
          {/* Result */}
          <line x1={o.x} y1={o.y} x2={resultTip.x} y2={resultTip.y}
            stroke="#ffd166" strokeWidth={4} strokeOpacity={0.9} markerEnd="url(#lc-r)" />

          {/* Basis vectors (thin) */}
          <line x1={o.x} y1={o.y} x2={e1Tip.x} y2={e1Tip.y}
            stroke="rgba(255,95,158,0.3)" strokeWidth={1.5} markerEnd="url(#lc-e1)" />
          <line x1={o.x} y1={o.y} x2={e2Tip.x} y2={e2Tip.y}
            stroke="rgba(34,229,201,0.3)" strokeWidth={1.5} markerEnd="url(#lc-e2)" />

          <DragHandle x={e1.x} y={e1.y} color="#ff5f9e" svgRef={svgRef} onDrag={(x, y) => setE1({ x, y })} />
          <DragHandle x={e2.x} y={e2.y} color="#22e5c9" svgRef={svgRef} onDrag={(x, y) => setE2({ x, y })} />
        </svg>
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
          ✦ Drag basis vectors e₁ and e₂
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <h3 className="text-lg font-bold">Linear Combination</h3>
        <p className="text-sm text-foreground-muted leading-relaxed">
          Any vector can be built from <em>scaled basis vectors</em>. Change α and β to control how much of each basis contributes. Drag the basis vectors to change the coordinate system.
        </p>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between font-mono text-sm mb-1">
              <span className="text-[#ff5f9e]">α (scales e₁) =</span>
              <span className="text-[#ff5f9e] font-bold text-lg">{alpha}</span>
            </div>
            <input type="range" min={-3} max={3} step={0.5} value={alpha}
              onChange={e => setAlpha(parseFloat(e.target.value))}
              className="w-full accent-[#ff5f9e]" />
          </div>
          <div>
            <div className="flex justify-between font-mono text-sm mb-1">
              <span className="text-[#22e5c9]">β (scales e₂) =</span>
              <span className="text-[#22e5c9] font-bold text-lg">{beta}</span>
            </div>
            <input type="range" min={-3} max={3} step={0.5} value={beta}
              onChange={e => setBeta(parseFloat(e.target.value))}
              className="w-full accent-[#22e5c9]" />
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 font-mono text-sm text-center">
          <span className="text-[#ff5f9e]">{alpha}</span>
          <span className="text-foreground-muted mx-1">×</span>
          <span className="border-l border-r border-[#ff5f9e]/50 px-1 inline-flex flex-col leading-none text-[#ff5f9e]">
            <span>{e1.x}</span><span>{e1.y}</span>
          </span>
          <span className="text-foreground-muted mx-2">+</span>
          <span className="text-[#22e5c9]">{beta}</span>
          <span className="text-foreground-muted mx-1">×</span>
          <span className="border-l border-r border-[#22e5c9]/50 px-1 inline-flex flex-col leading-none text-[#22e5c9]">
            <span>{e2.x}</span><span>{e2.y}</span>
          </span>
          <span className="text-foreground-muted mx-2">=</span>
          <span className="border-l border-r border-[#ffd166] px-1 inline-flex flex-col leading-none text-[#ffd166] font-bold">
            <span>{result.x.toFixed(1)}</span><span>{result.y.toFixed(1)}</span>
          </span>
        </div>

        <p className="text-xs text-foreground-muted">
          This is the foundation of how matrices transform vectors in machine learning — by choosing new basis vectors, you rewrite every coordinate in a transformed space.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 6 – THREE.JS 3D PLAYGROUND (interactive)
// ─────────────────────────────────────────────────
function Vector3DPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 3, y: 2, z: 4 });

  useEffect(() => {
    if (!containerRef.current) return;
    const W3 = containerRef.current.clientWidth;
    const H3 = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    scene.fog = new THREE.Fog(0x080810, 18, 35);

    const camera = new THREE.PerspectiveCamera(45, W3 / H3, 0.1, 100);
    camera.position.set(8, 7, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W3, H3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI * 0.55;

    // Grid
    const grid = new THREE.GridHelper(14, 14, 0x2a2a3f, 0x16162a);
    scene.add(grid);

    // Axis arrows
    const origin = new THREE.Vector3(0, 0, 0);
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 6.5, 0xff5f9e, 0.5, 0.25));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 6.5, 0x22e5c9, 0.5, 0.25));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 6.5, 0xffd166, 0.5, 0.25));

    // Main vector
    const vDir = new THREE.Vector3(coords.x, coords.y, coords.z);
    const vLen = vDir.length();
    scene.add(new THREE.ArrowHelper(vDir.clone().normalize(), origin, vLen, 0x6366f1, 0.7, 0.35));

    // Shadow/projection lines
    const tip = new THREE.Vector3(coords.x, coords.y, coords.z);
    const groundTip = new THREE.Vector3(coords.x, 0, coords.z);

    const dashedMat = new THREE.LineDashedMaterial({ color: 0x888899, dashSize: 0.25, gapSize: 0.2 });
    const vertLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([tip, groundTip]), dashedMat);
    vertLine.computeLineDistances();
    scene.add(vertLine);

    const makeLine = (a: THREE.Vector3, b: THREE.Vector3, color: number) =>
      new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, opacity: 0.6, transparent: true }));

    scene.add(makeLine(origin, new THREE.Vector3(coords.x, 0, 0), 0xff5f9e));
    scene.add(makeLine(origin, new THREE.Vector3(0, 0, coords.z), 0xffd166));
    scene.add(makeLine(origin, new THREE.Vector3(0, coords.y, 0), 0x22e5c9));

    const dXZ = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(coords.x, 0, 0), groundTip,
      new THREE.Vector3(0, 0, coords.z), groundTip,
    ]), dashedMat);
    dXZ.computeLineDistances();
    scene.add(dXZ);

    // Sphere at tip
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.2),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x4040aa })
    );
    sphere.position.set(coords.x, coords.y, coords.z);
    scene.add(sphere);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(6, 10, 8);
    scene.add(dl);

    let id: number;
    const animate = () => { id = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / H3;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H3);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
      if (containerRef.current?.contains(renderer.domElement)) containerRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [coords]);

  const mag3 = Math.sqrt(coords.x ** 2 + coords.y ** 2 + coords.z ** 2).toFixed(2);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:flex-[2] relative">
          <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-border/50 bg-[#080810]" style={{ height: 420 }} />
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            🖱️ Drag to orbit · Scroll to zoom
          </div>
        </div>

        <div className="lg:flex-1 flex flex-col gap-4">
          <div className="bg-background border border-border rounded-xl p-4 font-mono text-center">
            <div className="text-xs text-foreground-muted mb-2 uppercase tracking-widest">v =</div>
            <div className="flex flex-col items-center border-l-4 border-r-4 border-foreground/50 px-4 py-2 text-2xl font-bold leading-snug mx-auto w-fit">
              <span className="text-[#ff5f9e]">{coords.x}</span>
              <span className="text-[#22e5c9]">{coords.y}</span>
              <span className="text-[#ffd166]">{coords.z}</span>
            </div>
            <div className="mt-3 text-indigo-400 font-bold text-sm">|v| = {mag3}</div>
          </div>

          {(["x", "y", "z"] as const).map((axis) => {
            const colors = { x: "#ff5f9e", y: "#22e5c9", z: "#ffd166" };
            return (
              <div key={axis}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span style={{ color: colors[axis] }} className="font-semibold">{axis.toUpperCase()} axis</span>
                  <span style={{ color: colors[axis] }}>{coords[axis]}</span>
                </div>
                <input
                  type="range" min={-5} max={5} step={1}
                  value={coords[axis]}
                  onChange={e => setCoords(p => ({ ...p, [axis]: parseInt(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: colors[axis] }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 7 – Data Vector Builder (click to pick features)
// ─────────────────────────────────────────────────
function DataVectorBuilder() {
  const features = [
    { key: "area", label: "Floor Area", unit: "sq ft", min: 500, max: 5000, step: 100, default: 1800, color: "#ffd166" },
    { key: "rooms", label: "Rooms", unit: "", min: 1, max: 10, step: 1, default: 4, color: "#ff5f9e" },
    { key: "age", label: "Building Age", unit: "yrs", min: 0, max: 100, step: 5, default: 15, color: "#22e5c9" },
    { key: "floor", label: "Floor Level", unit: "", min: 1, max: 40, step: 1, default: 3, color: "#a78bfa" },
    { key: "dist", label: "City Distance", unit: "km", min: 0, max: 50, step: 1, default: 8, color: "#34d399" },
  ];

  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(features.map(f => [f.key, f.default]))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(["area", "rooms", "age"]));

  const toggleFeature = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else next.add(key);
      return next;
    });
  };

  const activeFeatures = features.filter(f => selected.has(f.key));

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: feature toggles + sliders */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground-muted uppercase tracking-widest text-[11px]">
              Toggle features (dimensions)
            </h4>
            <div className="flex flex-wrap gap-2">
              {features.map(f => (
                <button
                  key={f.key}
                  onClick={() => toggleFeature(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all ${
                    selected.has(f.key)
                      ? "text-background border-transparent"
                      : "bg-background/40 border-border text-foreground-muted hover:border-foreground/30"
                  }`}
                  style={selected.has(f.key) ? { backgroundColor: f.color, borderColor: f.color } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {activeFeatures.map(f => (
              <div key={f.key}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span style={{ color: f.color }}>{f.label}</span>
                  <span style={{ color: f.color }}>{vals[f.key]} {f.unit}</span>
                </div>
                <input
                  type="range" min={f.min} max={f.max} step={f.step}
                  value={vals[f.key]}
                  onChange={e => setVals(p => ({ ...p, [f.key]: parseFloat(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: f.color }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: visual vector */}
        <div className="flex flex-col items-center justify-center bg-background border border-border/50 rounded-xl p-6 gap-4">
          <div className="text-xs font-mono text-foreground-muted uppercase tracking-widest">This object, as a vector</div>

          <div className="flex items-start gap-4 font-mono text-lg">
            <span className="text-foreground mt-2">x =</span>
            <div className="flex flex-col items-stretch gap-0.5">
              {activeFeatures.map(f => (
                <div
                  key={f.key}
                  className="border-b last:border-b-0 border-l-4 border-r border-r-foreground/30 pl-3 pr-3 py-1 bg-background/40"
                  style={{ borderLeftColor: f.color }}
                >
                  <span style={{ color: f.color }} className="font-bold">{vals[f.key]}</span>
                  <span className="text-[10px] text-foreground-muted ml-2">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-foreground-muted text-center mt-2">
            <span className="border border-border px-2 py-0.5 rounded font-mono">{activeFeatures.length}D vector</span>
            {" "}— each row is one dimension of information
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  SECTION 8 – Neuron Visual (interactive weights)
// ─────────────────────────────────────────────────
function NeuronViz() {
  const inputs = [1800, 3, 2, 1];
  const labels = ["Area", "Beds", "Baths", "Garage"];
  const colors = ["#ffd166", "#ff5f9e", "#22e5c9", "#a78bfa"];
  const [weights, setWeights] = useState([0.15, 0.4, 0.3, 0.25]);
  const bias = 0.1;

  const z = inputs.reduce((s, v, i) => s + v / 1000 * weights[i], 0) + bias;
  const activation = Math.max(0, z); // ReLU

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Inputs */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-foreground-muted mb-4">Input Vector x</div>
          {inputs.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 h-8 rounded bg-background border flex items-center justify-center font-mono text-sm" style={{ borderColor: colors[i], color: colors[i] }}>
                {v}
              </div>
              <span className="text-xs text-foreground-muted">{labels[i]}</span>
            </div>
          ))}
        </div>

        {/* Weights */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-foreground-muted mb-4">Weights w (drag to change)</div>
          {weights.map((w, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span style={{ color: colors[i] }}>w{i + 1}</span>
                <span style={{ color: colors[i] }}>{w.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={w}
                onChange={e => {
                  const nw = [...weights];
                  nw[i] = parseFloat(e.target.value);
                  setWeights(nw);
                }}
                className="w-full"
                style={{ accentColor: colors[i] }}
              />
              <div className="text-[10px] text-foreground-muted font-mono text-right">
                {(inputs[i] / 1000 * w).toFixed(3)} contribution
              </div>
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-mono uppercase tracking-widest text-foreground-muted mb-4">Neuron Output</div>
          <div className="bg-background border border-border rounded-xl p-4 text-center space-y-2">
            <div className="text-[10px] font-mono text-foreground-muted">z = wᵀx + b</div>
            <div className="text-2xl font-bold font-mono text-foreground">{z.toFixed(3)}</div>
          </div>
          <div className="bg-background border border-indigo-500 rounded-xl p-4 text-center space-y-2">
            <div className="text-[10px] font-mono text-indigo-400">f(z) = ReLU(z) = max(0,z)</div>
            <div className="text-3xl font-extrabold font-mono text-indigo-300">{activation.toFixed(3)}</div>
          </div>
          <div className="text-xs text-foreground-muted text-center leading-relaxed">
            ReLU fires when z &gt; 0. Adjust weights to control the neuron's sensitivity.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  CONCEPT MAP
// ─────────────────────────────────────────────────
function ConceptMap() {
  const nodes = [
    { label: "Vector", color: "#6366f1", desc: "An arrow or ordered list of numbers" },
    { label: "Components", color: "#ff5f9e", desc: "x, y, z — movement along each axis" },
    { label: "Operations", color: "#ffd166", desc: "Addition, scaling, dot product" },
    { label: "Basis", color: "#22e5c9", desc: "The fundamental directions of a space" },
    { label: "Matrix", color: "#a78bfa", desc: "A collection of vectors / transformation" },
    { label: "Data Point", color: "#34d399", desc: "Real-world object as a vector" },
    { label: "Neuron", color: "#fb923c", desc: "wᵀx + b — a weighted dot product" },
    { label: "Deep Learning", color: "#f43f5e", desc: "Layers of vector transformations" },
  ];

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {nodes.map((n, i) => (
          <div key={n.label} className="relative bg-background border rounded-xl p-3 flex flex-col gap-1 group hover:scale-[1.03] transition-transform cursor-default"
            style={{ borderColor: n.color + "55" }}>
            {i < nodes.length - 1 && (
              <div className="absolute -bottom-3 left-1/2 w-px h-3 bg-border hidden md:block" style={{ zIndex: 0 }} />
            )}
            <div className="text-xs font-bold font-mono" style={{ color: n.color }}>{n.label}</div>
            <div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────
export default function Page() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
      </div>

      {/* ── HERO ── */}
      <header className="space-y-4">
        <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
          Linear Algebra · Topic 1
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          What is a{" "}
          <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
            Vector?
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-foreground-muted leading-relaxed">
          An arrow. A movement. An ordered list of numbers. And eventually — one of the core numerical structures behind every modern AI model.
        </p>
      </header>

      {/* 1 ── HERO DRAGGABLE VECTOR */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">1 · Geometric Arrow ↔ Numbers</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          Drag the yellow dot around the plane. Watch how the geometric arrow and the column of numbers always stay in sync — they are the same object, described two different ways.
        </p>
        <HeroVector />
      </section>

      {/* 2 ── VECTOR ADDITION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2 · Adding Two Vectors</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          Vector addition follows the <em>tip-to-tail</em> rule: place B&apos;s tail where A&apos;s head lands. Drag both vector heads freely.
        </p>
        <VectorAdditionLab />
      </section>

      {/* 3 ── DOT PRODUCT */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3 · The Dot Product — Measuring Alignment</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          The dot product asks: <em>how much do these two vectors agree on direction?</em> It is everywhere in machine learning — similarity, attention, projections.
        </p>
        <DotProductExplorer />
      </section>

      {/* 4 ── SCALAR */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">4 · Scaling a Vector</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          Drag the colored tip <em>along the vector&apos;s direction</em> to scale it. Cross to the other side of the origin and the scalar turns negative — the arrow flips.
        </p>
        <ScalarLab />
      </section>

      {/* 5 ── LINEAR COMBINATION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">5 · Linear Combinations &amp; Basis Vectors</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          Any vector can be <em>composed</em> from scaled basis vectors. Drag e₁ and e₂ (the axes themselves!) to see how a new coordinate system rewrites every point.
        </p>
        <LinearCombinationLab />
      </section>

      {/* 6 ── 3D */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">6 · Into 3D Space</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          A third number adds a third axis. The rules don&apos;t change — only the dimension count does. Orbit the scene to see projection lines from all three axes.
        </p>
        <Vector3DPlayground />
      </section>

      {/* 7 ── DATA VECTOR */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">7 · Real Objects as Vectors</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          Every measurable attribute becomes a dimension. Toggle features on and off to change how many dimensions the data vector lives in.
        </p>
        <DataVectorBuilder />
      </section>

      {/* 8 ── NEURON */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">8 · From Data Vector to Artificial Neuron</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          A neuron is essentially a <strong>weighted dot product</strong> followed by a nonlinear activation. Adjust the weights and see how the neuron&apos;s output responds.
        </p>
        <NeuronViz />
      </section>

      {/* 9 ── CONCEPT MAP */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">9 · The Conceptual Thread</h2>
        <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
          From an arrow in space to a deep neural network — every step on this journey used the same underlying idea.
        </p>
        <ConceptMap />
      </section>

      {/* 10 ── EMBEDDINGS VISUALIZER */}
      <EmbeddingsVisualizerSection />

      <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
        <p className="text-foreground-muted text-sm max-w-lg">
          Vectors aren&apos;t just textbook arrows. They are the language modern AI systems use to represent and transform information.
        </p>
        <Link href="/linear-algebra" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">
          ← Linear Algebra
        </Link>
      </footer>
    </div>
  );
}
