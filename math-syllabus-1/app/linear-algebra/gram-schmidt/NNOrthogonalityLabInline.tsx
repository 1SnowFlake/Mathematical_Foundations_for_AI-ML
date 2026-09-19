"use client";

import { useState, useMemo } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import { Vec2, dot, normalize, angleBetween } from "./vectorMath";

/* ------------------------------------------------------------------ */
/*  Inline Neural Network Orthogonality Laboratory Component          */
/* ------------------------------------------------------------------ */

export default function NNOrthogonalityLabInline() {
  const [activeScene, setActiveScene] = useState<number>(1);
  const [w1, setW1] = useState<Vec2>({ x: 3.2, y: 3.6 });
  const [w2, setW2] = useState<Vec2>({ x: 2.9, y: 3.2 });
  const [numLayers, setNumLayers] = useState<number>(10);
  const [initType, setInitType] = useState<"random" | "orthogonal">("random");

  const q1 = useMemo(() => normalize(w1), [w1]);
  const projW2_Q1 = useMemo(() => {
    const d = dot(w2, q1);
    return { x: q1.x * d, y: q1.y * d };
  }, [w2, q1]);
  const u2 = useMemo(() => ({ x: w2.x - projW2_Q1.x, y: w2.y - projW2_Q1.y }), [w2, projW2_Q1]);
  const q2 = useMemo(() => normalize(u2), [u2]);

  const activeW1 = activeScene >= 5 ? q1 : w1;
  const activeW2 = activeScene >= 5 ? q2 : w2;

  const currentAngle = useMemo(() => angleBetween(w1, w2), [w1, w2]);
  const orthogonalityScore = useMemo(() => {
    const cosVal = Math.abs(dot(normalize(activeW1), normalize(activeW2)));
    return Math.max(0, Math.round((1 - cosVal) * 100));
  }, [activeW1, activeW2]);

  const featureRedundancy = useMemo(() => 100 - orthogonalityScore, [orthogonalityScore]);
  const featureDiversity = useMemo(() => orthogonalityScore, [orthogonalityScore]);
  const infoPreservation = useMemo(() => Math.round(70 + (orthogonalityScore / 100) * 28), [orthogonalityScore]);

  const sampleInputs: Vec2[] = [
    { x: 1, y: 0.5 },
    { x: -0.8, y: 1 },
    { x: 0.5, y: -1 },
    { x: 1.2, y: 1.2 },
    { x: -1, y: -0.5 },
  ];

  const gradientMagnitudes = useMemo(() => {
    const layers: number[] = [];
    let currentGrad = 1.0;
    const decayFactor = initType === "random" ? 0.62 : 0.95;

    for (let i = 0; i < numLayers; i++) {
      layers.push(currentGrad);
      currentGrad *= decayFactor;
    }
    return layers;
  }, [numLayers, initType]);

  const handleApplyQR = () => {
    setW1({ x: Math.round(q1.x * 3.5 * 10) / 10, y: Math.round(q1.y * 3.5 * 10) / 10 });
    setW2({ x: Math.round(q2.x * 3.5 * 10) / 10, y: Math.round(q2.y * 3.5 * 10) / 10 });
  };

  const handleGenerateRandomMatrix = () => {
    const rX1 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 2.5;
    const rY1 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 1.8;
    const offset = Math.random() * 0.6 - 0.3;
    const rX2 = Math.round((rX1 + offset) * 10) / 10;
    const rY2 = Math.round((rY1 + offset) * 10) / 10;
    setW1({ x: rX1, y: rY1 });
    setW2({ x: rX2, y: rY2 });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 md:p-6 my-8 not-prose shadow-xl">
      {/* Title & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6">
        <div>
          <span className="px-2.5 py-1 bg-accent/10 text-accent font-bold rounded text-xs uppercase tracking-wider">
            Interactive Laboratory
          </span>
          <h3 className="text-2xl font-bold text-foreground mt-1 m-0">
            Gram–Schmidt & QR in Deep Neural Networks
          </h3>
        </div>

        {/* Live Metrics Bar Header */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <div className="bg-background border border-border px-3 py-1.5 rounded-lg">
            <span className="text-foreground-subtle">Diversity: </span>
            <span className="font-bold text-emerald-400">{featureDiversity}%</span>
          </div>
          <div className="bg-background border border-border px-3 py-1.5 rounded-lg">
            <span className="text-foreground-subtle">Redundancy: </span>
            <span className={`font-bold ${featureRedundancy > 50 ? "text-rose-400" : "text-emerald-400"}`}>
              {featureRedundancy}%
            </span>
          </div>
          <div className="bg-background border border-border px-3 py-1.5 rounded-lg">
            <span className="text-foreground-subtle">Orthogonality: </span>
            <span className="font-bold text-accent">{orthogonalityScore}%</span>
          </div>
        </div>
      </div>

      {/* Scene Selector Tabs (Scenes 1 - 9) */}
      <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto pb-2 border-b border-border/50">
        {[
          { num: 1, label: "1. Network Intro" },
          { num: 2, label: "2. The Problem" },
          { num: 3, label: "3. Vector Drag" },
          { num: 4, label: "4. Info Flow" },
          { num: 5, label: "5. QR Factorization" },
          { num: 6, label: "6. Flow Comparison" },
          { num: 7, label: "7. Preserving Length" },
          { num: 8, label: "8. Gradient Stability" },
          { num: 9, label: "9. Real AI Map" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setActiveScene(s.num)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeScene === s.num
                ? "bg-accent text-white shadow"
                : "bg-surface-hover text-foreground-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SCENE 1 */}
      {activeScene === 1 && (
        <div className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-accent mb-1">Scene 1 — A Simple Neural Network Layer</h4>
            <p className="text-xs text-foreground-muted m-0">
              Every hidden neuron in a neural network computes a weighted combination of the input vector:{" "}
              <MathBlock tex="y = Wx + b" inline />. The rows of weight matrix <MathBlock tex="W" inline /> determine how information is extracted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 bg-background border border-border rounded-xl p-6 flex items-center justify-around">
              <div className="flex flex-col gap-4 items-center">
                <div className="text-xs uppercase tracking-wider font-bold text-foreground-subtle">Inputs (x)</div>
                {["x₁", "x₂", "x₃"].map((node) => (
                  <div key={node} className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 font-bold flex items-center justify-center text-xs">
                    {node}
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-xs font-mono font-bold text-accent mb-1">Weight Matrix W</div>
                <div className="w-24 h-0.5 bg-gradient-to-r from-blue-500 via-accent to-emerald-500 my-2"></div>
                <div className="text-[10px] text-foreground-subtle font-mono">y = Wx + b</div>
              </div>

              <div className="flex flex-col gap-4 items-center">
                <div className="text-xs uppercase tracking-wider font-bold text-foreground-subtle">Hidden (h)</div>
                {["h₁", "h₂", "h₃"].map((node) => (
                  <div key={node} className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {node}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 space-y-3">
              <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="text-xs font-bold text-foreground mb-1">What does W do?</div>
                <p className="text-xs text-foreground-muted m-0">
                  Each row of matrix <MathBlock tex="W" inline /> acts as a <strong>direction filter</strong> in feature space. If two rows point in the exact same direction, both neurons measure the exact same pattern!
                </p>
              </div>
              <button
                onClick={() => setActiveScene(2)}
                className="w-full py-2.5 bg-accent text-white font-semibold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 transition-all"
              >
                Continue to Scene 2: The Redundancy Problem →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 2 & 3 */}
      {(activeScene === 2 || activeScene === 3) && (
        <div className="space-y-6">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-rose-400 mb-1">
              {activeScene === 2 ? "Scene 2 — The Feature Redundancy Problem" : "Scene 3 — Interactive Vector Manipulation"}
            </h4>
            <p className="text-xs text-foreground-muted m-0">
              When random initial weights happen to point in nearly identical directions, neurons extract duplicate information, leaving the network under-utilized.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 widget-card p-4 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-semibold text-foreground-muted">
                  Drag weight vectors <span className="text-blue-400 font-bold">w₁ (Neuron 1)</span> & <span className="text-pink-400 font-bold">w₂ (Neuron 2)</span>
                </span>
                <button
                  onClick={handleGenerateRandomMatrix}
                  className="px-2.5 py-1 bg-surface-hover border border-border text-[11px] font-semibold rounded text-foreground cursor-pointer"
                >
                  🎲 Randomize Weights
                </button>
              </div>

              <VectorCanvas
                width={480}
                height={320}
                gridRange={5}
                vectors={[
                  { id: "w1", point: w1, color: "#3b82f6", draggable: true, label: "w₁ (Neuron 1)" },
                  { id: "w2", point: w2, color: "#ec4899", draggable: true, label: "w₂ (Neuron 2)" },
                ]}
                onVectorChange={(id, pt) => {
                  if (id === "w1") setW1(pt);
                  if (id === "w2") setW2(pt);
                }}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="bg-background border border-border rounded-xl p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                  Neuron Feature Analysis
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Feature Redundancy:</span>
                      <span className="font-bold font-mono text-rose-400">{featureRedundancy}%</span>
                    </div>
                    <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full transition-all" style={{ width: `${featureRedundancy}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Information Diversity:</span>
                      <span className="font-bold font-mono text-emerald-400">{featureDiversity}%</span>
                    </div>
                    <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${featureDiversity}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-border space-y-1 text-xs">
                  <div><strong>Neuron 1:</strong> Detects horizontal edge patterns</div>
                  <div>
                    <strong>Neuron 2:</strong>{" "}
                    {currentAngle < 20 ? (
                      <span className="text-rose-400 font-bold">Also detects horizontal edge patterns! (Redundant)</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Detects complementary vertical features (Diverse)</span>
                    )}
                  </div>
                  <div className="text-[11px] text-foreground-subtle pt-1">
                    Separation Angle: <span className="font-mono font-bold text-foreground">{currentAngle.toFixed(1)}°</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveScene(4)}
                className="w-full py-2.5 bg-accent text-white font-semibold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 transition-all"
              >
                Continue to Scene 4: Information Flow Animation →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 4 & 6 */}
      {(activeScene === 4 || activeScene === 6) && (
        <div className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-accent mb-1">
              {activeScene === 4 ? "Scene 4 — Information Loss in Activation Space" : "Scene 6 — Comparing Random vs Orthogonal Flow"}
            </h4>
            <p className="text-xs text-foreground-muted m-0">
              Observe how a batch of distinct input vectors mapped through <MathBlock tex="W" inline /> collapse onto a single line when weights are redundant, but spread out nicely when weights are orthogonal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                <span>Outputs under Raw Weights (Angle: {angleBetween(w1, w2).toFixed(1)}°)</span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                  High Collapse
                </span>
              </div>
              <div className="h-48 bg-surface rounded-lg border border-border relative flex items-center justify-center p-4">
                <svg width="100%" height="100%" viewBox="-5 -5 10 10">
                  <line x1="-5" y1="0" x2="5" y2="0" stroke="var(--border)" strokeWidth="0.1" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--border)" strokeWidth="0.1" />
                  {sampleInputs.map((inp, idx) => {
                    const h1 = dot(w1, inp);
                    const h2 = dot(w2, inp);
                    return (
                      <circle
                        key={idx}
                        cx={h1 * 0.6}
                        cy={-h2 * 0.6}
                        r="0.4"
                        fill="#ef4444"
                        opacity="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2 m-0">
                Activations cling tightly to a 1D diagonal line. The second dimension of network capacity is effectively lost!
              </p>
            </div>

            <div className="bg-background border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                <span>Outputs under QR Orthogonal Weights (Angle: 90.0°)</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  Full Coverage
                </span>
              </div>
              <div className="h-48 bg-surface rounded-lg border border-border relative flex items-center justify-center p-4">
                <svg width="100%" height="100%" viewBox="-5 -5 10 10">
                  <line x1="-5" y1="0" x2="5" y2="0" stroke="var(--border)" strokeWidth="0.1" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--border)" strokeWidth="0.1" />
                  {sampleInputs.map((inp, idx) => {
                    const h1 = dot(q1, inp) * 3;
                    const h2 = dot(q2, inp) * 3;
                    return (
                      <circle
                        key={idx}
                        cx={h1 * 0.6}
                        cy={-h2 * 0.6}
                        r="0.4"
                        fill="#10b981"
                        opacity="0.85"
                      />
                    );
                  })}
                </svg>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2 m-0">
                Activations spread evenly across 2D feature space, preserving input information diversity!
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setActiveScene(activeScene === 6 ? 7 : 5)}
              className="py-2.5 px-6 bg-accent text-white font-semibold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 transition-all"
            >
              {activeScene === 6 ? "Continue to Scene 7: Vector Length Preservation →" : "Continue to Scene 5: Apply QR Factorization →"}
            </button>
          </div>
        </div>
      )}

      {/* SCENE 5 */}
      {activeScene === 5 && (
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-emerald-400 mb-1">Scene 5 — Apply QR Factorization</h4>
            <p className="text-xs text-foreground-muted m-0">
              Click below to apply Gram–Schmidt / QR decomposition to matrix <MathBlock tex="W" inline />. Watch the redundant weight vectors transform into perpendicular basis vectors <MathBlock tex="Q" inline />!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="widget-card p-4 flex flex-col items-center">
              <div className="text-xs font-bold text-foreground mb-2">Orthonormal Weight Basis (Q Matrix)</div>
              <VectorCanvas
                width={400}
                height={280}
                gridRange={5}
                vectors={[
                  { id: "q1", point: { x: q1.x * 3.5, y: q1.y * 3.5 }, color: "#3b82f6", draggable: false, label: "q₁" },
                  { id: "q2", point: { x: q2.x * 3.5, y: q2.y * 3.5 }, color: "#10b981", draggable: false, label: "q₂" },
                ]}
              />
            </div>

            <div className="bg-background border border-border p-6 rounded-xl space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                Gram–Schmidt Transformation
              </div>
              <MathBlock tex="W \xrightarrow{\text{Gram–Schmidt / QR}} Q \cdot R" />
              <p className="text-xs text-foreground-muted">
                Matrix <MathBlock tex="Q" inline /> forms a perfectly orthogonal weight matrix where <MathBlock tex="Q^TQ = I" inline />, guaranteeing 90° feature separation.
              </p>

              <button
                onClick={handleApplyQR}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
              >
                ✨ Apply QR Factorization to Weights
              </button>

              <button
                onClick={() => setActiveScene(7)}
                className="w-full py-2.5 bg-surface-hover border border-border text-foreground font-semibold text-xs rounded-xl cursor-pointer hover:bg-surface transition-all"
              >
                Continue to Scene 7: Vector Length Preservation →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 7 */}
      {activeScene === 7 && (
        <div className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-accent mb-1">Scene 7 — Vector Length Preservation</h4>
            <p className="text-xs text-foreground-muted m-0">
              When multiplying input vectors through layers, random matrices cause vector lengths to explode or shrink to zero. Orthogonal weight matrices (<MathBlock tex="Q^TQ = I" inline />) preserve exact vector norms!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background border border-border p-4 rounded-xl text-center">
              <div className="text-xs font-bold text-foreground-subtle mb-1">Original Input Norm</div>
              <div className="text-2xl font-bold font-mono text-blue-400">1.00</div>
              <div className="text-[11px] text-foreground-muted mt-2">Starting vector magnitude</div>
            </div>

            <div className="bg-background border border-border p-4 rounded-xl text-center">
              <div className="text-xs font-bold text-rose-400 mb-1">After Random Matrix</div>
              <div className="text-2xl font-bold font-mono text-rose-400">0.12</div>
              <div className="text-[11px] text-rose-400/80 mt-2">Severe shrinkage / information loss</div>
            </div>

            <div className="bg-background border border-border p-4 rounded-xl text-center">
              <div className="text-xs font-bold text-emerald-400 mb-1">After Orthogonal Q Matrix</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">0.99</div>
              <div className="text-[11px] text-emerald-400/80 mt-2">Exact length preserved!</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setActiveScene(8)}
              className="py-2.5 px-6 bg-accent text-white font-semibold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 transition-all"
            >
              Continue to Scene 8: Deep Network Gradient Stability →
            </button>
          </div>
        </div>
      )}

      {/* SCENE 8 */}
      {activeScene === 8 && (
        <div className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-accent mb-1">Scene 8 — Deep Network Gradient Stability</h4>
            <p className="text-xs text-foreground-muted m-0">
              Compare gradient propagation across a {numLayers}-layer deep network under standard random initialization versus orthogonal initialization.
            </p>
          </div>

          <div className="bg-background border border-border p-6 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground-subtle">Initialization:</span>
                <button
                  onClick={() => setInitType("random")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    initType === "random" ? "bg-rose-500 text-white" : "bg-surface-hover text-foreground-muted"
                  }`}
                >
                  Random Initialisation
                </button>
                <button
                  onClick={() => setInitType("orthogonal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    initType === "orthogonal" ? "bg-emerald-500 text-white" : "bg-surface-hover text-foreground-muted"
                  }`}
                >
                  Orthogonal Initialisation (QR)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground-subtle">Network Depth:</span>
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={numLayers}
                  onChange={(e) => setNumLayers(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="font-mono font-bold text-foreground">{numLayers} Layers</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="text-xs font-bold text-foreground mb-2">Gradient Magnitude Backpropagating Across Layers</div>
              {gradientMagnitudes.map((magVal, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-16 text-foreground-subtle">Layer {numLayers - idx}:</span>
                  <div className="flex-1 bg-surface-hover h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        initType === "random" ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, magVal * 100)}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-right text-foreground-muted">{(magVal * 100).toFixed(0)}%</span>
                </div>
              ))}
              <p className="text-[10px] text-foreground-subtle italic mt-1 m-0">
                Illustrative model of gradient decay, not a live backprop simulation.
              </p>
            </div>

            <div className="p-3 bg-surface rounded-lg border border-border text-xs">
              {initType === "random" ? (
                <span className="text-rose-400 font-bold">
                  ⚠️ Vanishing Gradient Alert: Gradient decays exponentially to zero by earlier layers. Deep network cannot train!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  ✅ Stable Gradient Flow: Orthogonal weights maintain consistent gradient signal back to Layer 1!
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setActiveScene(9)}
              className="py-2.5 px-6 bg-accent text-white font-semibold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 transition-all"
            >
              Continue to Scene 9: Real AI Connection & Map →
            </button>
          </div>
        </div>
      )}

      {/* SCENE 9 */}
      {activeScene === 9 && (
        <div className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-base font-bold text-accent mb-1">Scene 9 — Real AI Connection & Concept Map</h4>
            <p className="text-xs text-foreground-muted m-0">
              Modern deep learning libraries (PyTorch <code className="text-accent">torch.nn.init.orthogonal_</code>, TensorFlow) use QR decomposition or Householder reflections to initialize weight matrices orthogonally for stable training.
            </p>
          </div>

          <div className="bg-background border border-border p-6 rounded-xl overflow-x-auto not-prose">
            <div className="flex flex-col items-center text-xs font-mono gap-2 text-foreground-muted">
              <div className="bg-rose-500/20 text-rose-300 px-4 py-2 rounded border border-rose-500/30">
                Random Weight Matrix Initialisation
              </div>
              <div>↓</div>
              <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Similar Weight Vector Directions</div>
              <div>↓</div>
              <div className="bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded border border-amber-500/30">Feature Redundancy & Information Loss</div>
              <div>↓</div>
              <div className="bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded border border-rose-500/30">Vanishing / Exploding Gradients in Deep Layers</div>
              <div>↓</div>
              <div className="bg-accent text-white font-bold px-5 py-2.5 rounded-lg shadow-lg">
                Apply QR Factorization (Gram–Schmidt Process)
              </div>
              <div>↓</div>
              <div className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded border border-emerald-500/30 font-bold">
                Orthogonal Weight Matrix (Q)
              </div>
              <div>↓</div>
              <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Independent Feature Extraction Directions</div>
              <div>↓</div>
              <div className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded border border-emerald-500/30 font-bold">
                Stable Gradient Flow & Faster Deep Network Convergence
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

