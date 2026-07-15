"use client";

import { useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import { useProgress } from "@/components/layout/ProgressProvider";
import { normalPDF, normalCDF, binomialPMF as binomial, poissonPMF as poisson } from "@/lib/stats";

export default function DistributionsPage() {
  const { markCompleted } = useProgress();
  
  const [dist, setDist] = useState<"normal" | "binomial" | "poisson">("normal");
  
  // Normal params
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  
  // Binomial params
  const [n, setN] = useState(10);
  const [p, setP] = useState(0.5);
  
  // Poisson params
  const [lam, setLam] = useState(5);

  // Generate data points for SVG
  const generateData = () => {
    const points: {x: number, y: number}[] = [];
    if (dist === "normal") {
      for (let x = -5; x <= 5; x += 0.1) {
        points.push({ x, y: normalPDF(x, mu, sigma) });
      }
    } else if (dist === "binomial") {
      for (let x = 0; x <= n; x++) {
        points.push({ x, y: binomial(n, p, x) });
      }
    } else if (dist === "poisson") {
      for (let x = 0; x <= 20; x++) {
        points.push({ x, y: poisson(lam, x) });
      }
    }
    return points;
  };

  const data = generateData();
  
  // SVG drawing logic
  const width = 600;
  const height = 300;
  const padding = 40;
  
  const xMin = dist === "normal" ? -5 : 0;
  const xMax = dist === "normal" ? 5 : (dist === "poisson" ? 20 : n);
  const yMax = Math.max(...data.map(d => d.y), 0.1); // Avoid div by zero

  const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - (y / yMax) * (height - 2 * padding);

  // Generate SVG path for continuous (normal)
  const pathD = dist === "normal" ? 
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.x)} ${scaleY(d.y)}`).join(" ")
    : "";
    
  const fillPathD = dist === "normal" ? 
    `${pathD} L ${scaleX(5)} ${scaleY(0)} L ${scaleX(-5)} ${scaleY(0)} Z`
    : "";

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <h1>Probability Distributions</h1>
      <p>
        Probability distributions describe the likelihood of observing different outcomes in an experiment. 
        They are the backbone of statistical inference and generative machine learning models.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 not-prose">
        {[
          { id: "normal", label: "Normal (Continuous)", icon: "📈" },
          { id: "binomial", label: "Binomial (Discrete)", icon: "🪙" },
          { id: "poisson", label: "Poisson (Discrete)", icon: "⏱️" },
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setDist(d.id as any)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: dist === d.id ? "var(--accent)" : "var(--surface)",
              color: dist === d.id ? "white" : "var(--foreground-muted)",
              border: `1px solid ${dist === d.id ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      <div className="widget-card">
        <div className="widget-card__title">Distribution Explorer</div>
        
        {/* SVG Chart */}
        <div className="w-full bg-surface-hover border border-border rounded-lg overflow-hidden mb-6">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Grid/Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-strong)" strokeWidth="1" />
            <line x1={dist === "normal" ? scaleX(0) : padding} y1={padding} x2={dist === "normal" ? scaleX(0) : padding} y2={height - padding} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Plot */}
            {dist === "normal" && (
              <>
                <path d={fillPathD} fill="rgba(99, 102, 241, 0.1)" />
                <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3" />
              </>
            )}
            
            {dist !== "normal" && (
              <g>
                {data.map((d, i) => (
                  <g key={i}>
                    {/* Bar */}
                    <rect 
                      x={scaleX(d.x) - 4} 
                      y={scaleY(d.y)} 
                      width="8" 
                      height={height - padding - scaleY(d.y)} 
                      fill="rgba(99, 102, 241, 0.2)" 
                    />
                    {/* Point */}
                    <circle 
                      cx={scaleX(d.x)} 
                      cy={scaleY(d.y)} 
                      r="4" 
                      fill="var(--accent)" 
                    />
                  </g>
                ))}
              </g>
            )}
            
            {/* Basic labels */}
            <text x={width - padding + 5} y={height - padding + 4} fontSize="10" fill="var(--foreground-muted)">x</text>
            <text x={padding - 5} y={padding - 5} fontSize="10" textAnchor="end" fill="var(--foreground-muted)">P(x)</text>
          </svg>
        </div>

        {/* Controls */}
        <div className="p-4 rounded-lg bg-surface border border-border not-prose">
          {dist === "normal" && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Mean (μ) - Center</span>
                  <span className="font-mono">{mu.toFixed(1)}</span>
                </div>
                <input type="range" min="-3" max="3" step="0.1" value={mu} onChange={(e) => setMu(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Standard Deviation (σ) - Spread</span>
                  <span className="font-mono">{sigma.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="3" step="0.1" value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          {dist === "binomial" && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Number of Trials (n)</span>
                  <span className="font-mono">{n}</span>
                </div>
                <input type="range" min="5" max="20" step="1" value={n} onChange={(e) => setN(parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Probability of Success (p)</span>
                  <span className="font-mono">{p.toFixed(2)}</span>
                </div>
                <input type="range" min="0.05" max="0.95" step="0.05" value={p} onChange={(e) => setP(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          {dist === "poisson" && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">Rate Parameter (λ)</span>
                  <span className="font-mono">{lam.toFixed(1)}</span>
                </div>
                <input type="range" min="1" max="15" step="0.5" value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      <h2>The Math</h2>
      {dist === "normal" && (
        <>
          <p>The Normal (Gaussian) distribution is continuous. Its Probability Density Function (PDF) is:</p>
          <MathBlock tex="f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}" />
        </>
      )}
      {dist === "binomial" && (
        <>
          <p>The Binomial distribution models the number of successes in <MathBlock tex="n" inline/> independent yes/no trials. Its Probability Mass Function (PMF) is:</p>
          <MathBlock tex="P(X=k) = \binom{n}{k} p^k (1-p)^{n-k}" />
        </>
      )}
      {dist === "poisson" && (
        <>
          <p>The Poisson distribution expresses the probability of a given number of events occurring in a fixed interval of time or space. Its PMF is:</p>
          <MathBlock tex="P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}" />
        </>
      )}

      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Switch to the <strong>Binomial</strong> distribution and set <MathBlock tex="n = 20" inline/> and <MathBlock tex="p = 0.5" inline/>. Notice how it looks almost identical to a bell curve? 
          This is the <em>Central Limit Theorem</em> in action!
        </p>
      </div>

      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/probability/distributions")}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                     text-white cursor-pointer transition-all"
          style={{ background: "var(--success)" }}
        >
          ✓ Mark as Complete
        </button>
      </div>
    </div>
  );
}
