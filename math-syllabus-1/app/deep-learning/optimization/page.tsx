"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import MathBlock from "@/components/primitives/MathBlock";

/* -------------------------------------------------------------------------- */
/* MATH HELPERS                                                               */
/* -------------------------------------------------------------------------- */

// 1D toy loss: a simple bowl with minimum at theta = 3
function loss1D(theta: number) {
  return (theta - 3) ** 2 + 1;
}
function grad1D(theta: number) {
  return 2 * (theta - 3);
}

// 2D toy loss: an elongated bowl (different curvature per axis)
function loss2D(t1: number, t2: number) {
  return 0.25 * t1 * t1 + 1.5 * t2 * t2;
}
function grad2D(t1: number, t2: number) {
  return { g1: 0.5 * t1, g2: 3 * t2 };
}

function simulateGD(
  theta0: number,
  lr: number,
  steps: number
): number[] {
  const path = [theta0];
  let theta = theta0;
  for (let i = 0; i < steps; i++) {
    theta = theta - lr * grad1D(theta);
    if (!isFinite(theta) || Math.abs(theta) > 50) {
      path.push(theta > 0 ? 50 : -50);
      break;
    }
    path.push(theta);
  }
  return path;
}

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* -------------------------------------------------------------------------- */
/* SHARED PRIMITIVES                                                          */
/* -------------------------------------------------------------------------- */

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono pointer-events-none">
      ✦ {children}
    </div>
  );
}

function StatChips({
  items,
}: {
  items: { label: string; value: React.ReactNode; color: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s) => (
        <div
          key={s.label}
          className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
        >
          <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
            {s.label}
          </div>
          <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  index,
  label,
  title,
  desc,
}: {
  index: string;
  label: string;
  title: string;
  desc?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
        {index} · {label}
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      {desc && (
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          {desc}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 0 — HERO                                                           */
/* -------------------------------------------------------------------------- */

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Deep Learning · Topic 2
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        How does a network{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
          actually learn?
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          A neural network starts out knowing nothing — its millions of
          internal &quot;knobs&quot; (called{" "}
          <strong className="text-foreground">parameters</strong>) are
          basically random. Training is the process of turning those knobs,
          one tiny nudge at a time, until the network stops guessing wrong.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          Picture a tiny ball dropped onto a bumpy, hilly landscape. Gravity
          pulls it downhill. <strong className="text-foreground">
            Optimization
          </strong>{" "}
          is the math that plays the role of gravity for a neural network,
          rolling it toward the lowest point it can find — the point where
          the network makes the fewest mistakes.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          Every single training step of GPT-style models, self-driving car
          vision systems, and Instagram filters runs the exact same loop:{" "}
          <span className="font-mono text-xs">
            data → prediction → loss → gradient → update
          </span>
          . This page walks through that loop from one knob to a billion.
        </p>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 1 — FIRST INTUITION: ONE PARAMETER                                 */
/* -------------------------------------------------------------------------- */

function FirstIntuition() {
  const [theta, setTheta] = useState(-2);
  const currentLoss = loss1D(theta);
  const gradient = grad1D(theta);

  const W = 400,
    H = 220;
  const toX = (t: number) => W / 2 + t * 30;
  const toY = (l: number) => H - 20 - l * 12;

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let t = -6; t <= 6; t += 0.25) {
      pts.push(`${toX(t)},${toY(loss1D(t))}`);
    }
    return pts.join(" ");
  }, []);

  function takeStep(lr: number) {
    setTheta((prev) => clampNum(prev - lr * grad1D(prev), -6, 6));
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        index="1"
        label="First Intuition"
        title="One knob, one hill"
        desc={
          <>
            Imagine your model has just{" "}
            <strong className="text-foreground">one parameter</strong>,{" "}
            <MathBlock tex="\theta" inline />. The curve below is the{" "}
            <strong className="text-foreground">loss</strong> — how wrong the
            model is — for every possible value of that knob. Lower is
            better. Drag the point and watch the loss change.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56">
            <polyline
              points={curvePoints}
              fill="none"
              stroke="#a78bfa"
              strokeWidth={2.5}
            />
            <line
              x1={toX(3)}
              y1={0}
              x2={toX(3)}
              y2={H}
              stroke="#34d399"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <text x={toX(3) + 4} y={14} fill="#34d399" fontSize="10" fontFamily="monospace">
              minimum
            </text>
            <circle
              cx={toX(theta)}
              cy={toY(currentLoss)}
              r={9}
              fill="#ff5f9e"
              stroke="white"
              strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 6px #ff5f9e)" }}
            />
          </svg>
          <input
            type="range"
            min={-6}
            max={6}
            step={0.1}
            value={theta}
            onChange={(e) => setTheta(Number(e.target.value))}
            className="w-full"
          />
          <Hint>Drag theta with the slider</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Which way is downhill?</h3>

          <MathBlock tex="\theta \leftarrow \theta - \eta \nabla L(\theta)" />
          <p className="text-sm text-foreground-muted leading-relaxed">
            <span className="font-mono text-[#ff5f9e]">θ</span> is the
            parameter, <span className="font-mono text-[#a78bfa]">L</span> is
            the loss, <span className="font-mono text-[#22e5c9]">∇L</span> is
            the <strong className="text-foreground">gradient</strong> — an
            arrow pointing toward increasing loss — and{" "}
            <span className="font-mono text-[#ffd166]">η</span> (eta) is the{" "}
            <strong className="text-foreground">learning rate</strong>, how
            big a step to take. The minus sign is what sends us{" "}
            <em>downhill</em> instead of up.
          </p>

          <StatChips
            items={[
              {
                label: "Loss L(θ)",
                value: currentLoss.toFixed(2),
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Gradient ∇L",
                value: gradient.toFixed(2),
                color:
                  gradient >= 0
                    ? "border-[#fb923c] text-[#fb923c]"
                    : "border-[#34d399] text-[#34d399]",
              },
            ]}
          />

          <div className="flex gap-2">
            <button
              onClick={() => takeStep(0.3)}
              className="px-3 py-2 bg-background border border-[#22e5c9]/50 rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              take one gradient step
            </button>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed">
            A positive gradient means &quot;going up&quot; to your right, so
            the optimizer subtracts it — stepping left instead. That&apos;s
            the entire idea behind <strong className="text-foreground">
              gradient descent
            </strong>.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 2 — DEEPER MECHANICS: TWO PARAMETERS                              */
/* -------------------------------------------------------------------------- */

function DeeperMechanics() {
  const [point, setPoint] = useState({ t1: 3.2, t2: 2 });
  const { g1, g2 } = grad2D(point.t1, point.t2);
  const [lr, setLr] = useState(0.15);
  const [trail, setTrail] = useState<{ t1: number; t2: number }[]>([]);

  const size = 300,
    scale = 26,
    origin = size / 2;
  const toSvg = (t1: number, t2: number) => ({
    x: origin + t1 * scale,
    y: origin - t2 * scale,
  });

  const rings = [0.5, 1.5, 3, 5, 7.5];

  function step() {
    setTrail((prev) => [...prev, point]);
    setPoint({
      t1: clampNum(point.t1 - lr * g1, -5, 5),
      t2: clampNum(point.t2 - lr * g2, -5, 5),
    });
  }

  const p = toSvg(point.t1, point.t2);
  const gEnd = toSvg(point.t1 - g1 * 0.3, point.t2 - g2 * 0.3);

  return (
    <section className="space-y-6">
      <SectionHeader
        index="2"
        label="Deeper Mechanics"
        title="Two knobs: a landscape instead of a curve"
        desc={
          <>
            With two parameters, the loss becomes a{" "}
            <strong className="text-foreground">surface</strong>, shown here
            as contour rings — each ring is a line of equal loss, like
            elevation lines on a map. The gradient now points in{" "}
            <em>two dimensions</em> at once.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-72 mx-auto">
            {rings.map((level, idx) => (
              <ellipse
                key={level}
                cx={origin}
                cy={origin}
                rx={Math.sqrt(level / 0.25) * scale}
                ry={Math.sqrt(level / 1.5) * scale}
                fill="none"
                stroke="#a78bfa"
                strokeOpacity={0.15 + idx * 0.05}
                strokeWidth={1.5}
              />
            ))}
            <circle cx={origin} cy={origin} r={4} fill="#34d399" />
            <text x={origin + 6} y={origin - 6} fill="#34d399" fontSize="9" fontFamily="monospace">
              minimum
            </text>

            {trail.map((pt, i) => {
              const s = toSvg(pt.t1, pt.t2);
              return (
                <circle key={i} cx={s.x} cy={s.y} r={3} fill="#ff5f9e" fillOpacity={0.4} />
              );
            })}

            <line
              x1={p.x}
              y1={p.y}
              x2={gEnd.x}
              y2={gEnd.y}
              stroke="#22e5c9"
              strokeWidth={2.5}
              markerEnd="url(#arrow2d)"
            />
            <defs>
              <marker id="arrow2d" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#22e5c9" />
              </marker>
            </defs>

            <circle
              cx={p.x}
              cy={p.y}
              r={9}
              fill="#ff5f9e"
              stroke="white"
              strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 6px #ff5f9e)" }}
            />
          </svg>
          <Hint>Click "take a step" to descend</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Follow the gradient downhill</h3>

          <div className="text-xs font-mono text-[#ffd166] mb-1">
            ✦ Learning rate η: {lr.toFixed(2)}
          </div>
          <input
            type="range"
            min={0.02}
            max={0.6}
            step={0.02}
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="w-full"
          />

          <button
            onClick={step}
            className="px-3 py-2 bg-background border border-[#22e5c9]/50 rounded-lg text-sm font-mono hover:border-[#22e5c9] w-full"
          >
            take a step
          </button>

          <StatChips
            items={[
              {
                label: "Loss",
                value: loss2D(point.t1, point.t2).toFixed(2),
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Steps taken",
                value: trail.length,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            A real network doesn&apos;t have 2 parameters — GPT-scale models
            have <strong className="text-foreground">billions</strong>. But
            the update rule barely changes: compute one gradient number{" "}
            <em>per parameter</em>, and nudge each one downhill,
            simultaneously.{" "}
            <span className="text-[#6366f1]">
              Backpropagation
            </span>{" "}
            is simply the algorithm that computes all of those millions of
            partial derivatives efficiently — optimization is what does the
            nudging.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 3 — NUMBER CRUNCHING LAB: LEARNING RATE                           */
/* -------------------------------------------------------------------------- */

function NumberCrunchingLab() {
  const [lr, setLr] = useState(0.4);
  const steps = 12;
  const path = useMemo(() => simulateGD(-4.5, lr, steps), [lr]);
  const losses = path.map(loss1D);

  const status =
    lr < 0.15 ? "Too small — crawling" : lr > 0.9 ? "Too large — diverging" : "Just right";
  const statusColor =
    lr < 0.15
      ? "border-[#fb923c] text-[#fb923c]"
      : lr > 0.9
        ? "border-[#fb923c] text-[#fb923c]"
        : "border-[#34d399] text-[#34d399]";

  const W = 380,
    H = 200;
  const maxLoss = Math.max(5, ...losses.filter((l) => isFinite(l) && l < 500));
  const toX = (i: number) => 10 + (i / (steps - 1)) * (W - 20);
  const toY = (l: number) => H - 10 - clampNum(l, 0, maxLoss) * ((H - 20) / maxLoss);

  const chartPoints = losses
    .map((l, i) => `${toX(i)},${toY(l)}`)
    .join(" ");

  return (
    <section className="space-y-6">
      <SectionHeader
        index="3"
        label="Number Crunching Lab"
        title="The learning rate makes or breaks training"
        desc={
          <>
            Too small a learning rate and training crawls forever. Too large
            and it overshoots the minimum, bouncing further away each step —
            the loss can even explode toward infinity.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52">
            <polyline
              points={chartPoints}
              fill="none"
              stroke={lr > 0.9 ? "#fb923c" : "#34d399"}
              strokeWidth={2.5}
            />
            {losses.map((l, i) => (
              <circle
                key={i}
                cx={toX(i)}
                cy={toY(l)}
                r={3}
                fill={lr > 0.9 ? "#fb923c" : "#34d399"}
              />
            ))}
          </svg>
          <Hint>Drag the learning rate slider</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Try breaking it</h3>

          <div className="text-xs font-mono text-[#ffd166] mb-1">
            ✦ Learning rate η: {lr.toFixed(2)}
          </div>
          <input
            type="range"
            min={0.02}
            max={1.1}
            step={0.02}
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="w-full"
          />

          <StatChips
            items={[
              {
                label: "Status",
                value: status,
                color: statusColor,
              },
              {
                label: "Final loss",
                value: isFinite(losses[losses.length - 1])
                  ? losses[losses.length - 1].toFixed(1)
                  : "∞",
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            This is exactly why real training uses{" "}
            <strong className="text-foreground">
              learning-rate schedules
            </strong>{" "}
            — starting small (a &quot;warmup&quot;), rising to a good
            cruising speed, then decaying near the end so the last steps are
            gentle and precise instead of overshooting the minimum.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 4 — 3D SPACE: THE LOSS LANDSCAPE                                  */
/* -------------------------------------------------------------------------- */

function ThreeDSpace() {
  const [tilt, setTilt] = useState(35);
  const rings = [0, 1, 2, 3, 4];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="4"
        label="Three Dimensions"
        title="Zoom out: the loss landscape is a mountain range"
        desc={
          <>
            With millions of parameters, the loss &quot;surface&quot; can't
            be drawn — but it behaves like a bumpy, high-dimensional
            landscape full of valleys, ridges, and flat plateaus. Tilt the
            view to feel the 3D shape of a single bowl-shaped valley.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5 flex items-center justify-center h-72">
          <div
            style={{ perspective: "700px" }}
            className="relative w-64 h-40"
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `rotateX(${tilt}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {rings.map((r) => (
                <div
                  key={r}
                  className="absolute rounded-full border-2"
                  style={{
                    borderColor: `rgba(167,139,250,${0.7 - r * 0.12})`,
                    width: `${40 + r * 45}px`,
                    height: `${40 + r * 45}px`,
                    left: `calc(50% - ${(40 + r * 45) / 2}px)`,
                    top: `calc(50% - ${(40 + r * 45) / 2}px)`,
                    transform: `translateZ(${-r * 14}px)`,
                  }}
                />
              ))}
              <div
                className="absolute w-4 h-4 rounded-full bg-[#ff5f9e]"
                style={{
                  left: "calc(50% - 8px)",
                  top: "calc(50% - 8px)",
                  transform: "translateZ(4px)",
                  boxShadow: "0 0 12px #ff5f9e",
                }}
              />
            </div>
          </div>
          <Hint>Tilt the landscape</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Tilt the view</h3>

          <div className="text-xs font-mono text-[#a78bfa] mb-1">
            ✦ Tilt: {tilt}°
          </div>
          <input
            type="range"
            min={0}
            max={70}
            step={1}
            value={tilt}
            onChange={(e) => setTilt(Number(e.target.value))}
            className="w-full"
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            Real loss landscapes are almost never one clean bowl. They
            contain <strong className="text-foreground">local minima</strong>{" "}
            (small dips that look like the bottom but aren&apos;t),{" "}
            <strong className="text-foreground">saddle points</strong>{" "}
            (flat in one direction, sloped in another), and one theoretical{" "}
            <strong className="text-foreground">global minimum</strong> — the
            true best setting of all the parameters.
          </p>
          <p className="text-sm text-foreground-muted leading-relaxed">
            This is called{" "}
            <strong className="text-foreground">non-convex optimization</strong>
            : there's no guarantee of finding the perfect bottom, only a
            &quot;good enough&quot; valley.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 5 — REAL WORLD DATA: BATCH SIZE                                   */
/* -------------------------------------------------------------------------- */

function RealWorldData() {
  const [batchSize, setBatchSize] = useState(4);
  const trueGrad = { x: 40, y: -20 };

  const noisyArrows = useMemo(() => {
    const arrows = [];
    const noiseScale = 1 / Math.sqrt(batchSize);
    for (let i = 0; i < Math.min(batchSize, 12); i++) {
      const seed = (i * 97 + batchSize * 13) % 100;
      const nx = ((seed % 40) - 20) * noiseScale;
      const ny = (((seed * 3) % 40) - 20) * noiseScale;
      arrows.push({ x: trueGrad.x + nx, y: trueGrad.y + ny });
    }
    return arrows;
  }, [batchSize]);

  const label =
    batchSize <= 2
      ? "Stochastic (per example) — noisy but cheap"
      : batchSize >= 10
        ? "Full batch — smooth but expensive"
        : "Mini-batch — the usual real-world compromise";

  const origin = { x: 60, y: 100 };

  return (
    <section className="space-y-6">
      <SectionHeader
        index="5"
        label="Real World Data"
        title="You never see the true gradient"
        desc={
          <>
            Computing the exact gradient means running the loss over your{" "}
            <em>entire</em> dataset — for LLMs, that's billions of examples.
            Instead, real training estimates the gradient from a small{" "}
            <strong className="text-foreground">batch</strong>. More examples
            per batch means a more accurate, less noisy estimate.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <svg viewBox="0 0 220 140" className="w-full h-56">
            {noisyArrows.map((a, i) => (
              <line
                key={i}
                x1={origin.x}
                y1={origin.y}
                x2={origin.x + a.x}
                y2={origin.y + a.y}
                stroke="#22e5c9"
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
            ))}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={origin.x + trueGrad.x}
              y2={origin.y + trueGrad.y}
              stroke="#ffd166"
              strokeWidth={3}
              markerEnd="url(#arrow5)"
            />
            <defs>
              <marker id="arrow5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#ffd166" />
              </marker>
            </defs>
            <circle cx={origin.x} cy={origin.y} r={4} fill="white" />
          </svg>
          <Hint>Change the batch size</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Batch size</h3>

          <div className="text-xs font-mono text-[#22e5c9] mb-1">
            ✦ Batch size: {batchSize}
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full"
          />

          <StatChips
            items={[
              {
                label: "Mode",
                value: label.split(" — ")[0],
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
              {
                label: "Noise level",
                value: (1 / Math.sqrt(batchSize)).toFixed(2),
                color: "border-[#fb923c] text-[#fb923c]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            The gold arrow is the true gradient direction; the faint teal
            arrows are single noisy estimates from individual examples.{" "}
            <strong className="text-foreground">
              Stochastic Gradient Descent (SGD)
            </strong>{" "}
            takes those noisy steps directly — and surprisingly, that noise
            can actually help the model hop out of shallow local minima.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 6 — CLASSIC AI: MOMENTUM                                          */
/* -------------------------------------------------------------------------- */

function bumpyLoss(t: number) {
  return (t - 4) ** 2 * 0.15 + 1.2 + 0.6 * Math.sin(t * 2.2) * Math.exp(-0.15 * Math.abs(t - 4));
}
function bumpyGrad(t: number) {
  const h = 0.001;
  return (bumpyLoss(t + h) - bumpyLoss(t - h)) / (2 * h);
}

function ClassicAI() {
  const [useMomentum, setUseMomentum] = useState(false);
  const [theta, setTheta] = useState(-2);
  const [velocity, setVelocity] = useState(0);
  const [trail, setTrail] = useState<number[]>([-2]);
  const lr = 0.15;
  const beta = 0.85;

  const W = 380,
    H = 160;
  const toX = (t: number) => 20 + ((t + 6) / 12) * (W - 40);
  const toY = (l: number) => H - 15 - l * 20;

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let t = -6; t <= 6; t += 0.2) pts.push(`${toX(t)},${toY(bumpyLoss(t))}`);
    return pts.join(" ");
  }, []);

  function step() {
    const g = bumpyGrad(theta);
    let newTheta: number;
    let newV = velocity;
    if (useMomentum) {
      newV = beta * velocity - lr * g;
      newTheta = theta + newV;
    } else {
      newTheta = theta - lr * g;
    }
    newTheta = clampNum(newTheta, -6, 6);
    setVelocity(newV);
    setTheta(newTheta);
    setTrail((prev) => [...prev, newTheta]);
  }

  function reset() {
    setTheta(-2);
    setVelocity(0);
    setTrail([-2]);
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        index="6"
        label="Classic Building Block"
        title="Momentum: rolling through small bumps"
        desc={
          <>
            Plain gradient descent can get stuck in a shallow dip. Adding{" "}
            <strong className="text-foreground">momentum</strong> gives the
            ball memory of its past velocity — like a real ball rolling
            downhill, it can carry enough speed to roll straight through
            small bumps instead of stopping in them.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
            <polyline points={curvePoints} fill="none" stroke="#a78bfa" strokeWidth={2} />
            {trail.map((t, i) => (
              <circle key={i} cx={toX(t)} cy={toY(bumpyLoss(t))} r={3} fill="#ff5f9e" fillOpacity={0.35} />
            ))}
            <circle
              cx={toX(theta)}
              cy={toY(bumpyLoss(theta))}
              r={8}
              fill={useMomentum ? "#34d399" : "#ff5f9e"}
              stroke="white"
              strokeWidth={2}
            />
          </svg>
          <Hint>Toggle momentum, then step</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Toggle momentum</h3>

          <button
            onClick={() => {
              setUseMomentum((v) => !v);
              reset();
            }}
            className={`w-full px-3 py-2 rounded-lg text-sm font-mono border transition-all ${useMomentum
                ? "bg-[#34d399]/15 border-[#34d399] text-[#34d399]"
                : "bg-background border-border text-foreground-muted"
              }`}
          >
            Momentum: {useMomentum ? "ON" : "OFF"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={step}
              className="flex-1 px-3 py-2 bg-background border border-[#22e5c9]/50 rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              step
            </button>
            <button
              onClick={reset}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono hover:border-white/30"
            >
              reset
            </button>
          </div>

          <StatChips
            items={[
              {
                label: "Steps",
                value: trail.length - 1,
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Velocity",
                value: velocity.toFixed(2),
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            Vanilla gradient descent often stalls in the little wiggle near
            the middle. With momentum turned on, click step repeatedly — the
            ball builds up speed and glides through it.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 7 — DEEP LEARNING AI: ADAPTIVE OPTIMIZERS & TRAINING LOOP         */
/* -------------------------------------------------------------------------- */

const OPTIMIZERS = [
  {
    name: "SGD + Momentum",
    color: "#ff5f9e",
    desc: "The classic: one shared learning rate for every parameter, smoothed by momentum.",
  },
  {
    name: "AdaGrad",
    color: "#22e5c9",
    desc: "Gives each parameter its own learning rate, shrinking it for parameters that have moved a lot already.",
  },
  {
    name: "RMSProp",
    color: "#ffd166",
    desc: "Fixes AdaGrad's rates shrinking to zero by averaging recent squared gradients instead of all of history.",
  },
  {
    name: "Adam",
    color: "#a78bfa",
    desc: "Combines momentum with RMSProp's per-parameter rates — the default choice for most modern deep learning.",
  },
];

const TRAINING_LOOP = [
  "Data",
  "Forward pass",
  "Prediction",
  "Loss",
  "Backprop",
  "Gradients",
  "Optimizer",
  "Update params",
];

function DeepLearningAI() {
  const [optIdx, setOptIdx] = useState(3);
  const [loopIdx, setLoopIdx] = useState(0);
  const opt = OPTIMIZERS[optIdx];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="7"
        label="Modern Deep Learning"
        title="From gradient descent to Adam, at billion-parameter scale"
        desc={
          <>
            Modern training almost never uses plain gradient descent. It
            uses smarter optimizers that adapt per parameter, plus tricks
            like weight decay (a gentle pull toward smaller weights to fight
            overfitting) and gradient clipping (capping huge gradients so
            training doesn't blow up — a real risk called{" "}
            <strong className="text-foreground">
              exploding gradients
            </strong>
            , with the opposite failure, gradients shrinking to nearly zero
            in deep networks, called{" "}
            <strong className="text-foreground">
              vanishing gradients
            </strong>
            ).
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {OPTIMIZERS.map((o, idx) => (
              <button
                key={o.name}
                onClick={() => setOptIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${idx === optIdx
                    ? "text-background"
                    : "border-border text-foreground-muted hover:border-white/30"
                  }`}
                style={idx === optIdx ? { backgroundColor: o.color, borderColor: o.color } : {}}
              >
                {o.name}
              </button>
            ))}
          </div>

          <div
            className="rounded-xl border p-6 min-h-[120px] flex flex-col justify-center gap-2"
            style={{ borderColor: opt.color + "55", backgroundColor: opt.color + "11" }}
          >
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: opt.color }}>
              {opt.name}
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed">{opt.desc}</p>
          </div>

          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-2 font-mono">
              The training loop — click a stage
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAINING_LOOP.map((stage, idx) => (
                <button
                  key={stage}
                  onClick={() => setLoopIdx(idx)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${idx === loopIdx
                      ? "border-[#6366f1] text-[#6366f1] bg-[#6366f1]/15"
                      : "border-border text-foreground-muted"
                    }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
          <Hint>Click an optimizer or a loop stage</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Where this fits</h3>

          <StatChips
            items={[
              {
                label: "Stage",
                value: TRAINING_LOOP[loopIdx],
                color: "border-[#6366f1] text-[#6366f1]",
              },
              {
                label: "Optimizer",
                value: opt.name,
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            CNNs, Transformers, and today's large language models all sit
            inside this exact same loop — only the &quot;forward pass&quot;
            box changes shape. Training an LLM just runs this loop trillions
            of times, often across thousands of GPUs at once (
            <strong className="text-foreground">
              distributed optimization
            </strong>
            ), using lower-precision numbers to go faster (
            <strong className="text-foreground">mixed precision</strong>
            ) while carefully checking{" "}
            <strong className="text-foreground">
              validation loss
            </strong>{" "}
            doesn't rise even as training loss keeps falling — the warning
            sign of <strong className="text-foreground">overfitting</strong>{" "}
            hurting <strong className="text-foreground">generalization</strong>{" "}
            to new data.
          </p>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            <strong className="text-foreground">Good initialization</strong>{" "}
            (starting the knobs at sensible random values, not all zero)
            gives the optimizer a much better starting point on this whole
            journey.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 8 — CONCEPT MAP                                                   */
/* -------------------------------------------------------------------------- */

function ConceptMap() {
  const nodes = [
    {
      label: "Loss Landscape",
      desc: "A surface measuring how wrong the model is for every setting of its parameters.",
      color: "#a78bfa",
    },
    {
      label: "Gradient",
      desc: "The direction of steepest increase in loss — computed via backpropagation.",
      color: "#22e5c9",
    },
    {
      label: "Learning Rate",
      desc: "How big a step the optimizer takes downhill each update.",
      color: "#ffd166",
    },
    {
      label: "SGD & Mini-batches",
      desc: "Estimating the gradient from a small sample of data instead of the whole dataset.",
      color: "#ff5f9e",
    },
    {
      label: "Momentum",
      desc: "Carrying velocity from past steps to glide through small bumps in the landscape.",
      color: "#34d399",
    },
    {
      label: "Adaptive Optimizers",
      desc: "AdaGrad, RMSProp and Adam give every parameter its own effective learning rate.",
      color: "#6366f1",
    },
    {
      label: "Gradient Pitfalls",
      desc: "Vanishing and exploding gradients, tamed with clipping and careful initialization.",
      color: "#fb923c",
    },
    {
      label: "Training Loop",
      desc: "Data → forward pass → loss → backprop → gradients → optimizer → update, repeated at scale.",
      color: "#ffd166",
    },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="8"
        label="Concept Map"
        title="The whole journey in one picture"
        desc="Start with one knob on one hill. Add more knobs, more noise, more speed, and smarter step sizes — and you have the engine that trains every modern neural network."
      />

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default"
              style={{ borderColor: n.color + "55" }}
            >
              <div className="text-xs font-bold font-mono" style={{ color: n.color }}>
                {n.label}
              </div>
              <div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 9 — FOOTER                                                        */
/* -------------------------------------------------------------------------- */

function PageFooter() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically: training is rolling a ball downhill on a landscape you
        can't fully see, using noisy, per-parameter hints about which way is
        down — and every trick in this page exists to make that roll faster,
        steadier, and less likely to get stuck.
      </p>

      <Link
        href="/deep-learning"
        className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all"
      >
        ← Deep Learning
      </Link>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function OptimizationInDeepLearningPage() {
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