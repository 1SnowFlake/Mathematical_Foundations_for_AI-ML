"use client";

import { useState, useEffect, useRef } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import { useProgress } from "@/components/layout/ProgressProvider";
import ParamPanel from "@/components/primitives/ParamPanel";

export default function PerceptronPage() {
  const { markCompleted } = useProgress();
  
  // Model weights: w1*x + w2*y + b
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(-0.5);
  const [b, setB] = useState(0.2);
  const [lr, setLr] = useState(0.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [epoch, setEpoch] = useState(0);

  // Training data (linearly separable for simplicity)
  // Class 1 (blue) is top right, Class -1 (orange) is bottom left
  const initialData = [
    { x: 0.8, y: 0.7, label: 1 },
    { x: 0.6, y: 0.9, label: 1 },
    { x: 0.9, y: 0.4, label: 1 },
    { x: 0.4, y: 0.8, label: 1 },
    { x: -0.5, y: -0.6, label: -1 },
    { x: -0.8, y: -0.2, label: -1 },
    { x: -0.3, y: -0.8, label: -1 },
    { x: -0.7, y: -0.7, label: -1 },
  ];

  // Helper to predict class based on weights
  const predict = (x: number, y: number, w1: number, w2: number, b: number) => {
    return (w1 * x + w2 * y + b) >= 0 ? 1 : -1;
  };

  // Perform one training step
  const trainStep = () => {
    let currentW1 = w1;
    let currentW2 = w2;
    let currentB = b;
    
    // Pick a random data point
    const idx = Math.floor(Math.random() * initialData.length);
    const point = initialData[idx];
    
    const prediction = predict(point.x, point.y, currentW1, currentW2, currentB);
    const error = point.label - prediction;
    
    // If there's an error, update weights
    if (error !== 0) {
      currentW1 += lr * error * point.x;
      currentW2 += lr * error * point.y;
      currentB += lr * error;
      
      setW1(currentW1);
      setW2(currentW2);
      setB(currentB);
    }
    
    setEpoch(e => e + 1);
  };

  // Auto-train loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(trainStep, 200);
    return () => clearInterval(interval);
  }, [isPlaying, w1, w2, b, lr]); // Re-bind on state change

  // Calculate points for the decision boundary line
  // w1*x + w2*y + b = 0  =>  y = -(w1/w2)*x - (b/w2)
  const getLinePoints = () => {
    if (Math.abs(w2) < 0.001) return { x1: 0, y1: 0, x2: 0, y2: 0 }; // Avoid div by zero

    const x1 = -1.5;
    const y1 = -(w1 / w2) * x1 - (b / w2);
    
    const x2 = 1.5;
    const y2 = -(w1 / w2) * x2 - (b / w2);

    return { x1, y1, x2, y2 };
  };

  const linePoints = getLinePoints();

  // Convert logical coordinates (-1.5 to 1.5) to SVG pixel coordinates (0 to 400)
  const toPx = (logical: number, maxPx: number) => {
    return ((logical + 1.5) / 3.0) * maxPx;
  };

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <h1>The Perceptron</h1>
      <p>
        The perceptron is the fundamental building block of neural networks. It is a simple algorithm 
        for supervised learning of binary classifiers. It takes a vector of inputs, multiplies them by weights, 
        adds a bias, and passes the sum through an activation function (like a step function).
      </p>

      {/* Widget */}
      <div className="widget-card">
        <div className="flex items-center justify-between mb-4">
          <div className="widget-card__title" style={{ margin: 0 }}>Interactive Perceptron</div>
          <div className="text-sm font-medium text-foreground-muted">Epoch: {epoch}</div>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          {/* Canvas */}
          <div className="relative border border-border rounded-lg bg-surface-hover overflow-hidden" style={{ aspectRatio: '1/1', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {/* Axes */}
              <line x1="200" y1="0" x2="200" y2="400" stroke="var(--border-strong)" strokeWidth="1" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="var(--border-strong)" strokeWidth="1" />
              
              {/* Decision Boundary Fill */}
              <polygon 
                points={`
                  ${toPx(linePoints.x1, 400)},${400 - toPx(linePoints.y1, 400)} 
                  ${toPx(linePoints.x2, 400)},${400 - toPx(linePoints.y2, 400)}
                  ${toPx(linePoints.x2, 400)},${w2 > 0 ? 400 : 0}
                  ${toPx(linePoints.x1, 400)},${w2 > 0 ? 400 : 0}
                `}
                fill="rgba(245, 158, 11, 0.1)" // Orange tint for class -1
              />
              <polygon 
                points={`
                  ${toPx(linePoints.x1, 400)},${400 - toPx(linePoints.y1, 400)} 
                  ${toPx(linePoints.x2, 400)},${400 - toPx(linePoints.y2, 400)}
                  ${toPx(linePoints.x2, 400)},${w2 > 0 ? 0 : 400}
                  ${toPx(linePoints.x1, 400)},${w2 > 0 ? 0 : 400}
                `}
                fill="rgba(99, 102, 241, 0.1)" // Indigo tint for class 1
              />

              {/* Decision Boundary Line */}
              <line 
                x1={toPx(linePoints.x1, 400)} 
                y1={400 - toPx(linePoints.y1, 400)} 
                x2={toPx(linePoints.x2, 400)} 
                y2={400 - toPx(linePoints.y2, 400)} 
                stroke="var(--foreground)" 
                strokeWidth="2" 
              />
              
              {/* Weight vector (orthogonal to boundary) */}
              <g opacity="0.5">
                <line 
                  x1="200" 
                  y1="200" 
                  x2={200 + w1 * 100} 
                  y2={200 - w2 * 100} 
                  stroke="var(--accent)" 
                  strokeWidth="2" 
                  markerEnd="url(#arrow)" 
                />
              </g>

              {/* Data Points */}
              {initialData.map((d, i) => {
                const px = toPx(d.x, 400);
                const py = 400 - toPx(d.y, 400);
                const pred = predict(d.x, d.y, w1, w2, b);
                const isCorrect = pred === d.label;
                
                return (
                  <circle 
                    key={i} 
                    cx={px} 
                    cy={py} 
                    r="6" 
                    fill={d.label === 1 ? "#6366f1" : "#f59e0b"} 
                    stroke={isCorrect ? "transparent" : "var(--error)"}
                    strokeWidth={isCorrect ? "0" : "3"}
                  />
                );
              })}

              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 not-prose">
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-xs text-foreground-subtle uppercase tracking-wider mb-3 font-semibold">Parameters</div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Weight 1 (w₁)</span>
                    <span className="font-mono">{w1.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.05" value={w1} onChange={(e) => setW1(parseFloat(e.target.value))} className="w-full" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Weight 2 (w₂)</span>
                    <span className="font-mono">{w2.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.05" value={w2} onChange={(e) => setW2(parseFloat(e.target.value))} className="w-full" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Bias (b)</span>
                    <span className="font-mono">{b.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.05" value={b} onChange={(e) => setB(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Learning Rate</span>
                    <span className="font-mono">{lr.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.01" max="0.5" step="0.01" value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={trainStep}
                disabled={isPlaying}
                className="flex-1 py-2 text-sm font-semibold rounded bg-surface border border-border disabled:opacity-50"
              >
                1 Step
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-[2] py-2 text-sm font-semibold rounded text-white transition-colors"
                style={{ background: isPlaying ? "var(--warning)" : "var(--accent)" }}
              >
                {isPlaying ? "Pause Training" : "Auto Train"}
              </button>
            </div>
            
            <button 
              onClick={() => { setW1(0.5); setW2(-0.5); setB(0.2); setEpoch(0); setIsPlaying(false); }}
              className="w-full py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Reset Weights
            </button>
          </div>
        </div>
      </div>

      <h2>The Math</h2>
      <p>
        The decision boundary is defined by the equation where the weighted sum equals zero:
      </p>
      <MathBlock tex="w_1 x_1 + w_2 x_2 + b = 0" />
      
      <p>
        During training, if the perceptron makes a mistake, it updates its weights according to the learning rule:
      </p>
      <MathBlock tex="w_i \leftarrow w_i + \eta \cdot (y_{true} - y_{pred}) \cdot x_i" />
      <p>
        Where <MathBlock tex="\eta" inline /> is the learning rate. This pulls the decision boundary slightly towards the misclassified point.
      </p>

      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Notice how the points with red outlines are being misclassified. Click <strong>Auto Train</strong> and watch how the weights adjust until the boundary perfectly separates the blue dots from the orange dots. Then, try messing up the weights manually with the sliders to see what happens!
        </p>
      </div>

      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/neural-networks/perceptron")}
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
