"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import MathBlock from "@/components/primitives/MathBlock";


// ---------- Vector math ----------
type Vec3 = { x: number; y: number; z: number };

const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scaleVec = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const magnitude = (a: Vec3): number => Math.sqrt(dot(a, a));
const normalize = (a: Vec3): Vec3 => {
  const m = magnitude(a);
  return m === 0 ? { x: 0, y: 0, z: 0 } : scaleVec(a, 1 / m);
};
const angleBetween = (a: Vec3, b: Vec3): number => {
  const m = magnitude(a) * magnitude(b);
  if (m === 0) return 0;
  const cosT = Math.min(1, Math.max(-1, dot(a, b) / m));
  return (Math.acos(cosT) * 180) / Math.PI;
};
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

// ---------- Camera projection ----------
function project(v: Vec3, yaw: number, pitch: number, scale: number, cx: number, cy: number) {
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const x1 = v.x * cosY - v.z * sinY;
  const z1 = v.x * sinY + v.z * cosY;

  const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
  const y2 = v.y * cosX - z1 * sinX;
  const z2 = v.y * sinX + z1 * cosX;

  const persp = 600 / (600 + z2 * scale);
  return { x: cx + x1 * scale * persp, y: cy - y2 * scale * persp, depth: z2 };
}

// ---------- Component ----------
const COLORS = {
  a: "#3b82f6",
  b: "#f59e0b",
  sum: "#22c55e",
  diff: "#ec4899",
  crossv: "#a855f7",
  axisX: "#ef4444",
  axisY: "#22c55e",
  axisZ: "#3b82f6",
  grid: "#e5e7eb",
};

export default function VectorsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vecA, setVecA] = useState<Vec3>({ x: 3, y: 1, z: 2 });
  const [vecB, setVecB] = useState<Vec3>({ x: 1, y: 2, z: -2 });
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(-0.35);
  const [showSum, setShowSum] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showCross, setShowCross] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const sum = add(vecA, vecB);
  const diff = sub(vecA, vecB);
  const crossV = cross(vecA, vecB);
  const dotAB = dot(vecA, vecB);
  const angle = angleBetween(vecA, vecB);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const scale = 45;

    const P = (v: Vec3) => project(v, yaw, pitch, scale, cx, cy);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      const p1 = P({ x: i, y: 0, z: -5 });
      const p2 = P({ x: i, y: 0, z: 5 });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const p3 = P({ x: -5, y: 0, z: i });
      const p4 = P({ x: 5, y: 0, z: i });
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }

    // NOTE: these ctx.fillText labels render to a canvas bitmap, not JSX.
    // MathBlock (KaTeX/DOM) cannot render inside a <canvas>, so plain
    // strings are correct and required here — this is not a rule violation.
    const drawArrow = (v: Vec3, color: string, label: string, dashed = false) => {
      const origin = P({ x: 0, y: 0, z: 0 });
      const tip = P(v);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const ang = Math.atan2(tip.y - origin.y, tip.x - origin.x);
      const headLen = 9;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - headLen * Math.cos(ang - Math.PI / 7), tip.y - headLen * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(tip.x - headLen * Math.cos(ang + Math.PI / 7), tip.y - headLen * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fill();

      ctx.font = "13px sans-serif";
      ctx.fillText(label, tip.x + 8, tip.y - 8);
    };

    drawArrow({ x: 5.5, y: 0, z: 0 }, COLORS.axisX, "x");
    drawArrow({ x: 0, y: 5.5, z: 0 }, COLORS.axisY, "y");
    drawArrow({ x: 0, y: 0, z: 5.5 }, COLORS.axisZ, "z");

    drawArrow(vecA, COLORS.a, "A");
    drawArrow(vecB, COLORS.b, "B");
    if (showSum) drawArrow(sum, COLORS.sum, "A+B", true);
    if (showDiff) drawArrow(diff, COLORS.diff, "A-B", true);
    if (showCross) drawArrow(crossV, COLORS.crossv, "AxB", true);
  }, [vecA, vecB, yaw, pitch, showSum, showDiff, showCross, sum, diff, crossV]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setYaw((y) => y + dx * 0.01);
    setPitch((p) => Math.min(1.4, Math.max(-1.4, p - dy * 0.01)));
  };
  const stopDrag = () => (dragging.current = false);

  const VectorSliders = ({
    label, texLabel, v, onChange, color,
  }: { label: string; texLabel: string; v: Vec3; onChange: (v: Vec3) => void; color: string }) => (
    <div className="p-4 rounded-xl border border-border bg-surface">
      <h4 className="font-semibold m-0 mb-3 flex items-center gap-2" style={{ color }}>
        <MathBlock tex={texLabel} inline /> <span>({label})</span>
      </h4>
      {(["x", "y", "z"] as const).map((axis) => (
        <div key={axis} className="flex items-center gap-3 mb-2">
          <span className="w-4 text-sm font-mono">{axis}</span>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={v[axis]}
            onChange={(e) => onChange({ ...v, [axis]: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="w-10 text-sm font-mono text-right">{fmt(v[axis])}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="prose max-w-none px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Vectors in 3D</h1>
      <p className="text-foreground-muted mb-6">
        Drag the canvas to rotate the view. Adjust{" "}
        <MathBlock tex={String.raw`\mathbf{A}`} inline /> and{" "}
        <MathBlock tex={String.raw`\mathbf{B}`} inline /> below to see how magnitude, the dot
        product, the cross product, and the angle between them change in real time.
      </p>

      <canvas
        ref={canvasRef}
        width={700}
        height={420}
        className="w-full rounded-xl border border-border bg-surface cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      />

      <div className="flex flex-wrap gap-2 my-4 not-prose">
        {[
          { label: "sum", tex: String.raw`\mathbf{A} + \mathbf{B}`, val: showSum, set: setShowSum, color: COLORS.sum },
          { label: "diff", tex: String.raw`\mathbf{A} - \mathbf{B}`, val: showDiff, set: setShowDiff, color: COLORS.diff },
          { label: "cross", tex: String.raw`\mathbf{A} \times \mathbf{B}`, val: showCross, set: setShowCross, color: COLORS.crossv },
        ].map(({ label, tex, val, set, color }) => (
          <button
            key={label}
            onClick={() => set(!val)}
            className="px-3 py-1.5 rounded-full border text-sm transition-colors flex items-center gap-1.5"
            style={{
              borderColor: color,
              backgroundColor: val ? color : "transparent",
              color: val ? "white" : color,
            }}
          >
            <span>Show</span>
            <MathBlock tex={tex} inline />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 not-prose">
        <VectorSliders label="Vector A" texLabel={String.raw`\mathbf{A}`} v={vecA} onChange={setVecA} color={COLORS.a} />
        <VectorSliders label="Vector B" texLabel={String.raw`\mathbf{B}`} v={vecB} onChange={setVecB} color={COLORS.b} />
      </div>

      <div className="p-5 rounded-xl border border-border bg-surface not-prose">
        <h4 className="font-semibold mb-3">Computed values</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 items-center font-mono text-sm">
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`|\mathbf{A}|`} inline /> <span>= {fmt(magnitude(vecA))}</span>
          </div>
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`|\mathbf{B}|`} inline /> <span>= {fmt(magnitude(vecB))}</span>
          </div>
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`\hat{\mathbf{A}}`} inline />
            <span>= ({fmt(normalize(vecA).x)}, {fmt(normalize(vecA).y)}, {fmt(normalize(vecA).z)})</span>
          </div>
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`\hat{\mathbf{B}}`} inline />
            <span>= ({fmt(normalize(vecB).x)}, {fmt(normalize(vecB).y)}, {fmt(normalize(vecB).z)})</span>
          </div>
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`\mathbf{A} \cdot \mathbf{B}`} inline /> <span>= {fmt(dotAB)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MathBlock tex={String.raw`\theta(\mathbf{A}, \mathbf{B})`} inline /> <span>= {fmt(angle)}°</span>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <MathBlock tex={String.raw`\mathbf{A} \times \mathbf{B}`} inline />
            <span>
              = ({fmt(crossV.x)}, {fmt(crossV.y)}, {fmt(crossV.z)}) — magnitude {fmt(magnitude(crossV))}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}