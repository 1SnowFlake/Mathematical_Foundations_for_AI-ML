"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import VectorCanvas from "@/components/primitives/VectorCanvas";
import {
  Vec2,
  mag,
  dot,
  sub,
  scale,
  normalize,
  angleBetween,
  computeConditionNumber,
} from "./vectorMath";

/* ------------------------------------------------------------------ */
/*  Inline QR Factorization Explorer Component                        */
/* ------------------------------------------------------------------ */

export default function QRExplorerInline() {
  const [a1, setA1] = useState<Vec2>({ x: 2, y: 1 });
  const [a2, setA2] = useState<Vec2>({ x: 1, y: 3 });

  const [step, setStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1500);
  const [method, setMethod] = useState<"normal" | "qr">("qr");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const r11 = mag(a1);
  const q1 = normalize(a1);
  const r12 = dot(q1, a2);
  const projVec = scale(q1, r12);
  const u2 = sub(a2, projVec);
  const r22 = mag(u2);
  const q2 = normalize(u2);

  const Q = [
    [q1.x, q2.x],
    [q1.y, q2.y],
  ];

  const R = [
    [r11, r12],
    [0, r22],
  ];

  const QR = [
    [Q[0][0] * R[0][0] + Q[0][1] * R[1][0], Q[0][0] * R[0][1] + Q[0][1] * R[1][1]],
    [Q[1][0] * R[0][0] + Q[1][1] * R[1][0], Q[1][0] * R[0][1] + Q[1][1] * R[1][1]],
  ];

  const recErr = Math.sqrt(
    (a1.x - QR[0][0]) ** 2 +
    (a2.x - QR[0][1]) ** 2 +
    (a1.y - QR[1][0]) ** 2 +
    (a2.y - QR[1][1]) ** 2
  );

  const condNumber = useMemo(() => computeConditionNumber(a1, a2), [a1, a2]);
  const currentAngle = angleBetween(a1, a2);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStep((prev) => (prev >= 6 ? 1 : prev + 1));
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handleRandomMatrix = () => {
    const rX1 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 2;
    const rY1 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 1;
    const rX2 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 1;
    const rY2 = Math.round((Math.random() * 6 - 3) * 10) / 10 || 3;
    setA1({ x: rX1, y: rY1 });
    setA2({ x: rX2, y: rY2 });
  };

  const handleNearlyParallel = () => {
    setA1({ x: 3.5, y: 1.0 });
    setA2({ x: 3.6, y: 1.03 });
  };

  const canvasVectors = useMemo(() => {
    const vecs = [
      { id: "a1", point: a1, color: "#3b82f6", draggable: true, label: "a₁" },
      { id: "a2", point: a2, color: "#60a5fa", draggable: true, label: "a₂" },
    ];

    if (step >= 2) {
      vecs.push({ id: "q1", point: q1, color: "#10b981", draggable: false, label: "q₁" });
    }
    if (step === 3) {
      vecs.push({ id: "proj", point: projVec, color: "#f59e0b", draggable: false, label: "proj" });
    }
    if (step >= 4) {
      vecs.push({ id: "u2", point: u2, color: "#ef4444", draggable: false, label: "u₂" });
    }
    if (step >= 5) {
      vecs.push({ id: "q2", point: q2, color: "#059669", draggable: false, label: "q₂" });
    }

    return vecs;
  }, [a1, a2, q1, q2, projVec, u2, step]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6 my-6 not-prose">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground m-0">Interactive QR Factorization Explorer</h3>
          <p className="text-xs text-foreground-muted mt-1 m-0">
            Visual transformation of matrix columns into orthonormal basis <MathBlock tex="Q" inline /> and upper triangular <MathBlock tex="R" inline />
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNearlyParallel}
            className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold rounded-lg border border-amber-500/30 transition-all cursor-pointer"
          >
            ⚠️ Make Nearly Parallel
          </button>
          <button
            onClick={handleRandomMatrix}
            className="px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 text-xs font-semibold rounded-lg border border-accent/30 transition-all cursor-pointer"
          >
            🎲 Random Matrix
          </button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Matrix Editing & Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle mb-2">
              Original Matrix A = [a₁ | a₂]
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-blue-400 font-bold block">Column a₁</label>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-foreground-muted">x:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={a1.x}
                    onChange={(e) => setA1({ ...a1, x: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono"
                  />
                  <span className="text-xs text-foreground-muted">y:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={a1.y}
                    onChange={(e) => setA1({ ...a1, y: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-blue-300 font-bold block">Column a₂</label>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-foreground-muted">x:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={a2.x}
                    onChange={(e) => setA2({ ...a2, x: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono"
                  />
                  <span className="text-xs text-foreground-muted">y:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={a2.y}
                    onChange={(e) => setA2({ ...a2, y: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="widget-card p-2 flex flex-col items-center">
            <div className="text-xs font-medium text-foreground-muted mb-1 self-start">
              Legend: <span className="text-blue-500 font-bold">● a₁, a₂</span> |{" "}
              <span className="text-emerald-500 font-bold">● q₁, q₂</span> |{" "}
              <span className="text-amber-500 font-bold">● proj</span> |{" "}
              <span className="text-red-500 font-bold">● u₂</span>
            </div>
            <VectorCanvas
              width={420}
              height={300}
              gridRange={5}
              vectors={canvasVectors}
              onVectorChange={(id, pt) => {
                if (id === "a1") setA1(pt);
                if (id === "a2") setA2(pt);
              }}
            />
          </div>
        </div>

        {/* Right Panel: Live Matrices Q & R */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          <div className="bg-background border border-border rounded-lg p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Live Matrix Decomposition
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-3">
                <div className="text-xs font-bold text-emerald-400 mb-1">Matrix Q (Orthonormal)</div>
                <div className="font-mono text-xs space-y-1">
                  <div>[{Q[0][0].toFixed(2)}, {Q[0][1].toFixed(2)}]</div>
                  <div>[{Q[1][0].toFixed(2)}, {Q[1][1].toFixed(2)}]</div>
                </div>
                <div className="text-[10px] text-foreground-subtle mt-2">
                  Q stores Gram–Schmidt orthonormal basis vectors
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg p-3">
                <div className="text-xs font-bold text-accent mb-1">Matrix R (Upper Triangular)</div>
                <div className="font-mono text-xs space-y-1">
                  <div>[{R[0][0].toFixed(2)}, {R[0][1].toFixed(2)}]</div>
                  <div className="text-foreground-subtle">[0.00, {R[1][1].toFixed(2)}]</div>
                </div>
                <div className="text-[10px] text-foreground-subtle mt-2">
                  R stores lengths & projection shadow coefficients
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface rounded-lg border border-border flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-foreground-muted">Reconstruction Error: </span>
                <span className="font-bold text-emerald-400">||A − QR|| = {recErr.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-foreground-muted">κ(A): </span>
                <span className={`font-bold ${condNumber > 20 ? "text-red-400" : "text-emerald-400"}`}>
                  {condNumber > 900 ? "∞" : condNumber.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <div className="text-xs uppercase font-bold text-accent mb-1">
              Step {step} of 6 Explanation
            </div>
            {step === 1 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 1: Original Vectors.</strong> Start with matrix columns <MathBlock tex="a_1, a_2" inline />. They are independent but not orthogonal.
              </p>
            )}
            {step === 2 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 2: Normalization.</strong> Normalize <MathBlock tex="a_1" inline /> to unit vector <MathBlock tex="q_1 = a_1 / \|a_1\|" inline />. Length <MathBlock tex="r_{11} = \|a_1\|" inline /> is written into Matrix R.
              </p>
            )}
            {step === 3 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 3: Projection.</strong> Calculate shadow projection <MathBlock tex="\text{proj}_{q_1}(a_2) = (q_1 \cdot a_2)q_1" inline />. Coefficient <MathBlock tex="r_{12} = q_1 \cdot a_2" inline /> goes into Matrix R.
              </p>
            )}
            {step === 4 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 4: Subtraction.</strong> Remove overlap shadow from <MathBlock tex="a_2" inline /> to isolate orthogonal component <MathBlock tex="u_2 = a_2 - r_{12}q_1" inline />.
              </p>
            )}
            {step === 5 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 5: Normalize Basis 2.</strong> Normalize <MathBlock tex="u_2" inline /> to unit vector <MathBlock tex="q_2 = u_2 / \|u_2\|" inline />. Length <MathBlock tex="r_{22} = \|u_2\|" inline /> completes Matrix R.
              </p>
            )}
            {step === 6 && (
              <p className="text-xs text-foreground-muted m-0">
                <strong>Step 6: Matrix Reconstruction.</strong> <MathBlock tex="Q \cdot R = A" inline /> multiplication complete! Orthonormal matrix Q paired with triangular coordinate matrix R reconstructs A.
              </p>
            )}
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="px-2.5 py-1 bg-surface-hover border border-border rounded text-xs cursor-pointer font-bold"
                >
                  Prev
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 rounded text-xs cursor-pointer font-bold text-white ${isPlaying ? "bg-red-500" : "bg-accent"
                    }`}
                >
                  {isPlaying ? "Pause ⏸" : "Play ▶"}
                </button>
                <button
                  onClick={() => setStep((s) => Math.min(6, s + 1))}
                  className="px-2.5 py-1 bg-surface-hover border border-border rounded text-xs cursor-pointer font-bold"
                >
                  Next
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setIsPlaying(false);
                  }}
                  className="px-2.5 py-1 bg-surface-hover border border-border rounded text-xs cursor-pointer"
                >
                  Reset ↺
                </button>
              </div>

              <div className="text-xs font-mono text-foreground-muted">
                Step <span className="font-bold text-foreground">{step}</span> / 6
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-foreground-subtle">Speed:</span>
              <input
                type="range"
                min={500}
                max={3000}
                step={250}
                value={3500 - speed}
                onChange={(e) => setSpeed(3500 - parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-foreground-muted">{(speed / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Learning / Least Squares Method Toggle */}
      <div className="mt-6 border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-accent m-0">
            🤖 AI & Machine Learning Connection: Solving Least Squares
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("normal")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold cursor-pointer border ${method === "normal"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-surface text-foreground-muted border-border"
                }`}
            >
              Normal Equations (AᵀA x = Aᵀb)
            </button>
            <button
              onClick={() => setMethod("qr")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold cursor-pointer border ${method === "qr"
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-foreground-muted border-border"
                }`}
            >
              QR Factorization (R x = Qᵀb)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background border border-border p-4 rounded-xl">
          <div>
            <div className="text-xs font-bold text-foreground mb-1">
              Method: {method === "normal" ? "Normal Equations" : "QR Factorization"}
            </div>
            <p className="text-xs text-foreground-muted">
              {method === "normal" ? (
                <>
                  Inverting <MathBlock tex="A^TA" inline /> squares condition number <MathBlock tex="\kappa(A^TA) = \kappa(A)^2" inline />.
                  When feature columns are correlated (angle = {currentAngle.toFixed(1)}°), matrix inversion suffers catastrophic precision loss.
                </>
              ) : (
                <>
                  QR substitutes <MathBlock tex="A = QR" inline /> into least squares, simplifying to <MathBlock tex="R x = Q^T b" inline />. Because <MathBlock tex="Q" inline /> is orthogonal (<MathBlock tex="\kappa(Q)=1" inline />), condition number stays low (<MathBlock tex="\kappa(R) = \kappa(A)" inline />).
                </>
              )}
            </p>
          </div>

          <div className="p-3 bg-surface rounded-lg border border-border flex flex-col justify-between font-mono text-xs">
            <div>
              <span className="text-foreground-subtle">Effective Condition Number: </span>
              <span className={`font-bold ${method === "normal" && condNumber > 10 ? "text-red-400" : "text-emerald-400"}`}>
                {method === "normal"
                  ? (condNumber * condNumber > 900 ? "∞ (Unstable)" : (condNumber * condNumber).toFixed(2))
                  : condNumber.toFixed(2)}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-foreground-subtle">Numerical Stability: </span>
              {method === "normal" && condNumber > 10 ? (
                <span className="text-red-400 font-bold">⚠️ High Risk of Rounding Error</span>
              ) : (
                <span className="text-emerald-400 font-bold">✅ Highly Stable & Precise</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
