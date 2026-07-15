"use client";

import { useState, useEffect, useCallback } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import { useProgress } from "@/components/layout/ProgressProvider";
import dynamic from "next/dynamic";

// Surface3D uses plotly which requires client-side rendering
const Surface3D = dynamic(() => import("@/components/primitives/Surface3D"), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] flex items-center justify-center bg-surface-hover border border-border rounded-lg">Loading 3D Engine...</div>
});

export default function GradientDescentPage() {
  const { markCompleted } = useProgress();
  
  const [lr, setLr] = useState(0.05);
  const [isPlaying, setIsPlaying] = useState(false);
  const [path, setPath] = useState<{x: number, y: number, z: number}[]>([{x: -2, y: 2, z: 8}]);
  
  // The cost function: f(x,y) = x^2 + y^2
  const fn = (x: number, y: number) => x*x + y*y;
  const calculateZ = fn;
  
  // The gradients: df/dx = 2x, df/dy = 2y
  const getGradients = (x: number, y: number) => {
    return { dx: 2*x, dy: 2*y };
  };

  const step = useCallback(() => {
    setPath((prev) => {
      const current = prev[prev.length - 1];
      const grads = getGradients(current.x, current.y);
      
      const nextX = current.x - lr * grads.dx;
      const nextY = current.y - lr * grads.dy;
      const nextZ = calculateZ(nextX, nextY);
      
      return [...prev, { x: nextX, y: nextY, z: nextZ }];
    });
  }, [lr]);

  useEffect(() => {
    if (!isPlaying) return;
    
    // Stop if we're very close to the minimum (0,0)
    const current = path[path.length - 1];
    if (current.z < 0.01) {
      setIsPlaying(false);
      return;
    }
    
    const timer = setTimeout(step, 100);
    return () => clearTimeout(timer);
  }, [isPlaying, path, step]);

  const reset = () => {
    setIsPlaying(false);
    setPath([{x: -2, y: 2, z: 8}]);
  };

  const current = path[path.length - 1];

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <h1>Gradient Descent</h1>
      <p>
        Gradient descent is a first-order iterative optimization algorithm for finding a local minimum of a differentiable function. 
        The idea is to take repeated steps in the opposite direction of the gradient (or approximate gradient) of the function at the current point, because this is the direction of steepest descent.
      </p>

      {/* Widget */}
      <div className="widget-card">
        <div className="flex items-center justify-between mb-4">
          <div className="widget-card__title" style={{ margin: 0 }}>Optimization Landscape</div>
          <div className="text-sm font-medium text-foreground-muted">Iteration: {path.length - 1}</div>
        </div>

        <Surface3D 
          fn={fn}
          xRange={[-2.5, 2.5]}
          yRange={[-2.5, 2.5]}
          resolution={30}
          paths={path}
          showContour={true}
        />

        {/* Controls */}
        <div className="mt-6 grid sm:grid-cols-2 gap-6 not-prose">
          <div className="p-4 rounded-lg bg-surface-hover border border-border">
            <div className="text-xs text-foreground-subtle uppercase tracking-wider mb-2 font-semibold">Current State</div>
            <div className="space-y-1 text-sm font-mono">
              <div>x = {current.x.toFixed(3)}</div>
              <div>y = {current.y.toFixed(3)}</div>
              <div className="text-accent font-bold mt-2 pt-2 border-t border-border">Cost (z) = {current.z.toFixed(4)}</div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold">Learning Rate (α)</span>
                <span className="font-mono">{lr.toFixed(3)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" max="0.2" step="0.01" 
                value={lr} 
                onChange={(e) => setLr(parseFloat(e.target.value))} 
                className="w-full"
                disabled={isPlaying}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={step}
                disabled={isPlaying || current.z < 0.01}
                className="flex-1 py-2 text-sm font-semibold rounded bg-surface border border-border disabled:opacity-50 transition-colors"
              >
                1 Step
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={current.z < 0.01}
                className="flex-[2] py-2 text-sm font-semibold rounded text-white transition-colors disabled:opacity-50"
                style={{ background: isPlaying ? "var(--warning)" : "var(--accent)" }}
              >
                {isPlaying ? "Pause" : "Descend"}
              </button>
              <button 
                onClick={reset}
                className="flex-1 py-2 text-sm rounded bg-surface-hover border border-border transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <h2>The Math</h2>
      <p>
        For our cost function <MathBlock tex="f(x, y) = x^2 + y^2" inline />, the gradients are:
      </p>
      <MathBlock tex="\frac{\partial f}{\partial x} = 2x \quad \text{and} \quad \frac{\partial f}{\partial y} = 2y" />
      <p>
        The parameter update rule at each step is:
      </p>
      <MathBlock tex="\theta_{n+1} = \theta_n - \alpha \nabla f(\theta_n)" />
      <p>
        Where <MathBlock tex="\alpha" inline /> is the learning rate. A larger learning rate takes bigger steps, but risks overshooting the minimum.
      </p>

      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Try setting the Learning Rate to its maximum value (0.2) and watch what happens. Then try setting it to a very small value (0.01). 
          How does the path of the gradient descent change? You can drag the 3D plot to rotate it!
        </p>
      </div>

      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/calculus/gradient")}
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
