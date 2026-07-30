"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import { useProgress } from "@/components/layout/ProgressProvider";

// ---------------------------------------------------------------------------
// Linear algebra helpers (2x2 only — enough to make eigen-stuff tangible)
// ---------------------------------------------------------------------------

interface Vec2 {
  x: number;
  y: number;
}

interface Matrix2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

function applyMatrix(m: Matrix2, v: Vec2): Vec2 {
  return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

interface EigenResult {
  kind: "real" | "complex" | "repeated";
  trace: number;
  det: number;
  discriminant: number;
  lambda1: number;
  lambda2: number;
  imagPart: number;
  v1: Vec2 | null;
  v2: Vec2 | null;
}

function computeEigen(m: Matrix2): EigenResult {
  const trace = m.a + m.d;
  const det = m.a * m.d - m.b * m.c;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < -1e-9) {
    const real = trace / 2;
    const imag = Math.sqrt(-discriminant) / 2;
    return {
      kind: "complex",
      trace,
      det,
      discriminant,
      lambda1: real,
      lambda2: real,
      imagPart: imag,
      v1: null,
      v2: null,
    };
  }

  const sq = Math.sqrt(Math.max(discriminant, 0));
  const lambda1 = (trace + sq) / 2;
  const lambda2 = (trace - sq) / 2;

  const eigenvectorFor = (lambda: number): Vec2 => {
    // Solve (A - lambda I) v = 0
    const A = m.a - lambda;
    const B = m.b;
    const C = m.c;
    if (Math.abs(B) > 1e-9) return normalize({ x: B, y: -A });
    if (Math.abs(C) > 1e-9) return normalize({ x: -(m.d - lambda), y: C });
    // Diagonal matrix — fall back to standard basis
    return Math.abs(A) < 1e-6 ? normalize({ x: 1, y: 0 }) : normalize({ x: 0, y: 1 });
  };

  return {
    kind: Math.abs(discriminant) < 1e-9 ? "repeated" : "real",
    trace,
    det,
    discriminant,
    lambda1,
    lambda2,
    imagPart: 0,
    v1: eigenvectorFor(lambda1),
    v2: eigenvectorFor(lambda2),
  };
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESETS: { label: string; m: Matrix2 }[] = [
  { label: "Symmetric stretch", m: { a: 2, b: 1, c: 1, d: 2 } },
  { label: "Shear", m: { a: 1, b: 1, c: 0, d: 1 } },
  { label: "Rotation (complex)", m: { a: 0, b: -1, c: 1, d: 0 } },
  { label: "Reflection", m: { a: 1, b: 0, c: 0, d: -1 } },
  { label: "Identity", m: { a: 1, b: 0, c: 0, d: 1 } },
];

// ---------------------------------------------------------------------------
// SVG canvas geometry
// ---------------------------------------------------------------------------

const SCALE = 34; // px per unit
const CENTER = 210; // px
const VIEW = 420;

function toScreen(v: Vec2) {
  return { sx: CENTER + v.x * SCALE, sy: CENTER - v.y * SCALE };
}

function unitCirclePath(m: Matrix2 | null) {
  const steps = 72;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const raw = { x: Math.cos(t), y: Math.sin(t) };
    const p = m ? applyMatrix(m, raw) : raw;
    const { sx, sy } = toScreen(p);
    pts.push(`${sx.toFixed(2)},${sy.toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

function eigenLineEndpoints(dir: Vec2, extent = 6.2) {
  const p1 = toScreen({ x: dir.x * extent, y: dir.y * extent });
  const p2 = toScreen({ x: -dir.x * extent, y: -dir.y * extent });
  return { p1, p2 };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EigenvaluesPage() {
  const { markCompleted } = useProgress();

  const [matrix, setMatrix] = useState<Matrix2>({ a: 2, b: 1, c: 1, d: 2 });
  const [v, setV] = useState<Vec2>({ x: 1, y: 0.6 });
  const [dragging, setDragging] = useState(false);
  const [showTransformedGrid, setShowTransformedGrid] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const eigen = useMemo(() => computeEigen(matrix), [matrix]);
  const av = useMemo(() => applyMatrix(matrix, v), [matrix, v]);

  const [challengeAnswer, setChallengeAnswer] = useState({ l1: "", l2: "" });
  const [challengeResult, setChallengeResult] = useState<"idle" | "correct" | "wrong">("idle");

  const [completed, setCompleted] = useState(false);

  function setEntry(key: keyof Matrix2, value: number) {
    setMatrix((prev) => ({ ...prev, [key]: value }));
  }

  function pointFromEvent(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: (loc.x - CENTER) / SCALE, y: -(loc.y - CENTER) / SCALE };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const p = pointFromEvent(e);
    if (!p) return;
    const clampedX = Math.max(-6, Math.min(6, p.x));
    const clampedY = Math.max(-6, Math.min(6, p.y));
    setV({ x: clampedX, y: clampedY });
  }

  function checkChallenge() {
    const guesses = [parseFloat(challengeAnswer.l1), parseFloat(challengeAnswer.l2)].sort(
      (x, y) => x - y
    );
    const truth = [2, 3].sort((x, y) => x - y);
    const ok =
      Math.abs(guesses[0] - truth[0]) < 0.15 && Math.abs(guesses[1] - truth[1]) < 0.15;
    setChallengeResult(ok ? "correct" : "wrong");
  }

  const tip = toScreen(v);
  const avTip = toScreen(av);
  const origin = toScreen({ x: 0, y: 0 });

  return (
    <div
      className="relative min-h-screen text-foreground"
      style={
        {
          "--glow-a": "rgba(34,229,201,0.15)",
          "--glow-b": "rgba(255,209,102,0.10)",
          "--glow-c": "rgba(99,102,241,0.12)",
        } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap");

            .font-display { font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
            .font-body    { font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
            .font-score   { font-family: "Space Mono", ui-monospace, monospace; }

            @keyframes pulse-dot {
              0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
              40% { opacity: 1; transform: scale(1); }
            }
            .thinking-dot { animation: pulse-dot 1.1s ease-in-out infinite; }
            .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
            .thinking-dot:nth-child(3) { animation-delay: 0.3s; }

            @keyframes rise-in {
              from { opacity: 0; transform: translateY(14px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .rise-in { animation: rise-in 0.6s ease-out both; }

            @keyframes pop-in {
              0% { opacity: 0; transform: scale(0.85); }
              70% { transform: scale(1.04); }
              100% { opacity: 1; transform: scale(1); }
            }
            .pop-in { animation: pop-in 0.28s ease-out both; }

            @keyframes drift {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(24px, -18px); }
            }
            .drift-a { animation: drift 24s ease-in-out infinite; }
            .drift-b { animation: drift 26s ease-in-out infinite reverse; }

            .challenge-block {
              background: linear-gradient(135deg, rgba(255,209,102,0.08), rgba(255,95,158,0.06));
              border: 1px solid rgba(255,209,102,0.35);
              border-radius: var(--radius-lg, 16px);
              padding: 1.5rem;
              margin: 2rem 0;
            }
          `,
        }}
      />

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div
          className="drift-a absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--glow-a)" }}
        />
        <div
          className="drift-b absolute -right-24 top-1/3 h-[30rem] w-[30rem] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--glow-b)" }}
        />
        <div
          className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full blur-[130px]"
          style={{ backgroundColor: "var(--glow-c)" }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-14 font-body sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="rise-in">
          <p className="font-score text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Linear Algebra
          </p>
          <h1 className="font-display mt-3 bg-gradient-to-r from-[#22e5c9] via-[#ffd166] to-[#ff5f9e] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Eigenvalues &amp; Eigenvectors
          </h1>
          <p className="mt-3 max-w-2xl text-foreground-muted">
            Most vectors get pushed off their line when a matrix acts on them. Eigenvectors
            are the special ones that don&apos;t — a matrix only stretches or flips them,
            never rotates them off their own span. The scale factor is the eigenvalue.
          </p>
        </header>

        {/* Theory / Formula */}
        <section className="widget-card rise-in backdrop-blur-xl">
          <p className="widget-card__title">Theory &amp; Formula</p>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            The Eigenvalue Equation
          </h2>
          <p className="mt-3 max-w-2xl text-foreground-muted">
            A vector <span className="font-score text-foreground">v</span> is an eigenvector
            of matrix <span className="font-score text-foreground">A</span> with eigenvalue{" "}
            <span className="font-score text-foreground">λ</span> if applying{" "}
            <span className="font-score text-foreground">A</span> only rescales it:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-background-secondary p-4 ring-1 ring-border">
            <MathBlock tex={String.raw`A\mathbf{v} = \lambda \mathbf{v}, \qquad \mathbf{v} \neq \mathbf{0}`} />
          </div>
          <p className="mt-5 text-foreground-muted">
            Rearranging gives <span className="font-score text-foreground">(A − λI)v = 0</span>,
            which only has a nonzero solution when the matrix{" "}
            <span className="font-score text-foreground">(A − λI)</span> is singular — that is,
            when its determinant vanishes:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-background-secondary p-4 ring-1 ring-border">
            <MathBlock tex={String.raw`\det(A - \lambda I) = 0`} />
          </div>
          <p className="mt-5 text-foreground-muted">
            For a 2×2 matrix, this characteristic polynomial has a closed form in terms of the
            trace and determinant:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-background-secondary p-4 ring-1 ring-border">
            <MathBlock
              tex={String.raw`\lambda = \frac{\operatorname{tr}(A) \pm \sqrt{\operatorname{tr}(A)^2 - 4\det(A)}}{2}`}
            />
          </div>

          <ol className="mt-6 space-y-3.5 text-sm text-foreground-subtle">
            <li className="flex gap-3">
              <span className="font-score flex-none rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                1
              </span>
              <span>
                <span className="font-semibold text-foreground">Write the characteristic equation.</span>{" "}
                Subtract λ from the diagonal, then set the determinant to zero.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-score flex-none rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                2
              </span>
              <span>
                <span className="font-semibold text-foreground">Solve for λ.</span> Each root is
                an eigenvalue. A real n×n matrix has up to n of them, possibly repeated or complex.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-score flex-none rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                3
              </span>
              <span>
                <span className="font-semibold text-foreground">Plug λ back in.</span> Solve{" "}
                <span className="font-score text-foreground">(A − λI)v = 0</span> for the null
                space direction — that&apos;s the eigenvector.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-score flex-none rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                4
              </span>
              <span>
                <span className="font-semibold text-foreground">Read the geometry.</span> |λ| &gt; 1
                stretches along that direction, |λ| &lt; 1 compresses it, and λ &lt; 0 flips it.
              </span>
            </li>
          </ol>
        </section>

        {/* Interactive Widget */}
        <section className="widget-card rise-in backdrop-blur-xl">
          <p className="widget-card__title">Interactive Widget</p>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Play With a 2×2 Transformation
          </h2>
          <p className="mt-3 max-w-2xl text-foreground-muted">
            Drag the gold vector, or tune the matrix entries below. The teal/pink dashed lines
            are the eigenvector directions — notice they never move off their own line, no
            matter what the matrix does to everything else.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Canvas */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW} ${VIEW}`}
                className="w-full touch-none select-none"
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDragging(false)}
                onPointerLeave={() => setDragging(false)}
              >
                <defs>
                  <marker id="arrow-gold" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="#ffd166" />
                  </marker>
                  <marker id="arrow-teal" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="#22e5c9" />
                  </marker>
                  <marker id="arrow-pink" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="#ff5f9e" />
                  </marker>
                </defs>

                {/* grid */}
                {Array.from({ length: 13 }, (_, i) => i - 6).map((g) => (
                  <g key={`grid-${g}`} stroke="var(--border)" strokeWidth={g === 0 ? 1.4 : 0.6}>
                    <line x1={CENTER + g * SCALE} y1={0} x2={CENTER + g * SCALE} y2={VIEW} />
                    <line x1={0} y1={CENTER - g * SCALE} x2={VIEW} y2={CENTER - g * SCALE} />
                  </g>
                ))}

                {/* unit circle image (ellipse under the transform) */}
                {showTransformedGrid && (
                  <>
                    <path d={unitCirclePath(null)} fill="none" stroke="var(--border-strong)" strokeDasharray="2 3" strokeWidth={1} />
                    <path d={unitCirclePath(matrix)} fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth={1.5} />
                  </>
                )}

                {/* eigenvector lines */}
                {eigen.kind !== "complex" && eigen.v1 && (
                  <line
                    {...(() => {
                      const { p1, p2 } = eigenLineEndpoints(eigen.v1!);
                      return { x1: p1.sx, y1: p1.sy, x2: p2.sx, y2: p2.sy };
                    })()}
                    stroke="#22e5c9"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.75}
                  />
                )}
                {eigen.kind !== "complex" && eigen.v2 && (
                  <line
                    {...(() => {
                      const { p1, p2 } = eigenLineEndpoints(eigen.v2!);
                      return { x1: p1.sx, y1: p1.sy, x2: p2.sx, y2: p2.sy };
                    })()}
                    stroke="#ff5f9e"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    opacity={0.75}
                  />
                )}

                {/* Av vector */}
                <line
                  x1={origin.sx}
                  y1={origin.sy}
                  x2={avTip.sx}
                  y2={avTip.sy}
                  stroke="#22e5c9"
                  strokeWidth={2.5}
                  markerEnd="url(#arrow-teal)"
                />

                {/* v vector (draggable) */}
                <line
                  x1={origin.sx}
                  y1={origin.sy}
                  x2={tip.sx}
                  y2={tip.sy}
                  stroke="#ffd166"
                  strokeWidth={2.5}
                  markerEnd="url(#arrow-gold)"
                />
                <circle
                  cx={tip.sx}
                  cy={tip.sy}
                  r={10}
                  fill="#ffd166"
                  fillOpacity={dragging ? 0.85 : 0.55}
                  stroke="#1c1917"
                  strokeOpacity={0.15}
                  className="cursor-grab active:cursor-grabbing pop-in"
                  onPointerDown={(e) => {
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setDragging(true);
                  }}
                />
              </svg>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-foreground-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ffd166]" /> drag me — vector v
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#22e5c9]" /> Av (and eigen-line 1)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f9e]" /> eigen-line 2
                </span>
                <label className="ml-auto inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={showTransformedGrid}
                    onChange={(e) => setShowTransformedGrid(e.target.checked)}
                  />
                  show unit circle image
                </label>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-5">
              <div>
                <p className="widget-card__title">Matrix A</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
                  {(["a", "b", "c", "d"] as const).map((key) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs text-foreground-muted">
                        <span className="font-score">{key}</span>
                        <span className="font-score text-foreground">{matrix[key].toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min={-3}
                        max={3}
                        step={0.1}
                        value={matrix[key]}
                        onChange={(e) => setEntry(key, parseFloat(e.target.value))}
                        className="w-full accent-[#22e5c9]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="widget-card__title">Presets</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setMatrix(p.m)}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground-muted transition hover:border-accent hover:bg-surface-hover"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background-secondary p-4">
                <p className="widget-card__title">Eigenvalues</p>
                {eigen.kind === "complex" ? (
                  <p className="font-score mt-2 text-sm text-foreground">
                    λ = {eigen.lambda1.toFixed(2)} ± {eigen.imagPart.toFixed(2)}i
                    <span className="ml-2 block text-xs font-body text-foreground-subtle">
                      Complex eigenvalues — no real eigenvector direction exists. Pure rotations
                      like this one spin every vector, so nothing stays on its own line.
                    </span>
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    <p className="font-score text-sm">
                      <span className="text-[#22e5c9]">λ₁ = {eigen.lambda1.toFixed(2)}</span>
                    </p>
                    <p className="font-score text-sm">
                      <span className="text-[#ff5f9e]">λ₂ = {eigen.lambda2.toFixed(2)}</span>
                    </p>
                  </div>
                )}
                <div className="mt-3 border-t border-border pt-3 text-xs text-foreground-subtle">
                  <p className="font-score">
                    v = ({v.x.toFixed(2)}, {v.y.toFixed(2)})
                  </p>
                  <p className="font-score">
                    Av = ({av.x.toFixed(2)}, {av.y.toFixed(2)})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ML Connection */}
        <section className="widget-card rise-in backdrop-blur-xl">
          <p className="widget-card__title">Why This Matters in ML</p>
          <h2 className="font-display mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Eigenvectors Show Up Everywhere in Machine Learning
          </h2>
          <p className="mt-3 max-w-2xl text-foreground-muted">
            Whenever a model reduces to "which directions matter most," eigenvalues are doing
            the work under the hood.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <p className="font-display text-sm font-semibold text-foreground">
                PCA &amp; dimensionality reduction
              </p>
              <p className="mt-1.5 text-sm text-foreground-subtle">
                Principal Component Analysis eigen-decomposes the data&apos;s covariance matrix.
                The eigenvectors are the principal axes; each eigenvalue is the variance
                captured along that axis. Keeping the top-k eigenvalues is exactly how you
                compress a high-dimensional dataset with minimal information loss.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <p className="font-display text-sm font-semibold text-foreground">
                Optimization landscapes
              </p>
              <p className="mt-1.5 text-sm text-foreground-subtle">
                The eigenvalues of a loss function&apos;s Hessian tell you the local shape: all
                positive means a bowl-shaped minimum, mixed signs mean a saddle point. This is
                why saddle points, not bad minima, are the real obstacle in high-dimensional
                training.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <p className="font-display text-sm font-semibold text-foreground">
                Spectral clustering &amp; graphs
              </p>
              <p className="mt-1.5 text-sm text-foreground-subtle">
                Spectral clustering eigen-decomposes a graph&apos;s Laplacian; the eigenvectors
                with the smallest eigenvalues reveal natural groupings — nodes that move
                together under the graph&apos;s structure end up on the same eigenvector.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <p className="font-display text-sm font-semibold text-foreground">
                Power iteration &amp; PageRank
              </p>
              <p className="mt-1.5 text-sm text-foreground-subtle">
                Repeatedly multiplying a vector by a matrix and renormalizing converges to the
                eigenvector with the largest eigenvalue. That single trick, applied to a web
                link matrix, is the core of PageRank.
              </p>
            </div>
          </div>
        </section>

        {/* Challenge */}
        <section className="challenge-block rise-in">
          <p className="font-score text-xs font-semibold uppercase tracking-[0.3em] text-[#ffd166]">
            Try It Yourself
          </p>
          <h2 className="font-display mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Find the eigenvalues, by hand
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
            This one is upper-triangular on purpose — no need for the quadratic formula.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl bg-background-secondary p-4 ring-1 ring-border">
            <MathBlock tex={String.raw`A = \begin{pmatrix} 3 & 4 \\ 0 & 2 \end{pmatrix}`} />
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              λ₁
              <input
                value={challengeAnswer.l1}
                onChange={(e) => setChallengeAnswer((s) => ({ ...s, l1: e.target.value }))}
                placeholder="?"
                className="font-score w-20 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              λ₂
              <input
                value={challengeAnswer.l2}
                onChange={(e) => setChallengeAnswer((s) => ({ ...s, l2: e.target.value }))}
                placeholder="?"
                className="font-score w-20 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-accent"
              />
            </label>
            <button
              onClick={checkChallenge}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-surface-hover"
            >
              Check answer
            </button>
            {challengeResult === "correct" && (
              <span className="pop-in font-score text-sm font-semibold text-[#22e5c9]">
                Correct — for a triangular matrix, the eigenvalues are just the diagonal. ✨
              </span>
            )}
            {challengeResult === "wrong" && (
              <span className="pop-in font-score text-sm font-semibold text-[#ff5f9e]">
                Not quite. Hint: try λ = 3 and λ = 2.
              </span>
            )}
          </div>
        </section>

        {/* Completion */}
        <div className="rise-in mt-8 flex justify-center">
          <button
            onClick={() => {
              markCompleted("linear-algebra/eigenvalues");
              setCompleted(true);
            }}
            disabled={completed}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${completed
                ? "cursor-default bg-[#22e5c9]/15 text-[#22e5c9] ring-1 ring-[#22e5c9]/30"
                : "bg-accent text-white hover:bg-accent-hover"
              }`}
          >
            {completed ? "✓ Marked as complete" : "Mark this topic as complete"}
          </button>
        </div>
      </div>
    </div>
  );
}