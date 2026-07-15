"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import GraphEditor, { type GENode, type GEEdge } from "@/components/primitives/GraphEditor";
import { useProgress } from "@/components/layout/ProgressProvider";
import { dfs, type AlgorithmStep } from "@/lib/graphAlgorithms";

// Default graph for DFS (same as BFS to easily see the difference)
const initialNodes: GENode[] = [
  { id: "A", label: "A (Start)", x: 250, y: 50 },
  { id: "B", label: "B", x: 150, y: 150 },
  { id: "C", label: "C", x: 350, y: 150 },
  { id: "D", label: "D", x: 100, y: 250 },
  { id: "E", label: "E", x: 200, y: 250 },
  { id: "F", label: "F", x: 400, y: 250 },
];

const initialEdges: GEEdge[] = [
  { id: "e1", source: "A", target: "B" },
  { id: "e2", source: "A", target: "C" },
  { id: "e3", source: "B", target: "D" },
  { id: "e4", source: "B", target: "E" },
  { id: "e5", source: "C", target: "F" },
  { id: "e6", source: "E", target: "F" },
];

export default function DFSPage() {
  const { markCompleted } = useProgress();
  
  const [nodes, setNodes] = useState<GENode[]>(initialNodes);
  const [edges, setEdges] = useState<GEEdge[]>(initialEdges);
  
  // Algorithm execution state
  const steps = useMemo(() => dfs(nodes, edges, "A"), [nodes, edges]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Playback control
  useEffect(() => {
    if (!isPlaying) return;
    
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 800); // 800ms per step
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const currentStep = steps[currentStepIndex] || null;

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleGraphChange = useCallback((newNodes: GENode[], newEdges: GEEdge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    handleReset();
  }, []);

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <h1>Depth-First Search (DFS)</h1>
      <p>
        Depth-First Search is an algorithm that goes as deep as possible into a graph before backtracking. 
        It explores a branch of a tree or graph down to the leaves before looking at other branches.
      </p>

      {/* Widget */}
      <div className="widget-card">
        <div className="flex items-center justify-between mb-4">
          <div className="widget-card__title" style={{ margin: 0 }}>Interactive DFS</div>
          
          {/* Controls */}
          <div className="flex gap-2 not-prose">
            <button 
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0 || isPlaying}
              className="px-3 py-1 text-sm rounded bg-surface border border-border disabled:opacity-50"
            >
              ⏮ Step Back
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-4 py-1 text-sm font-semibold rounded text-white disabled:opacity-50"
              style={{ background: isPlaying ? "var(--warning)" : "var(--accent)" }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <button 
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex >= steps.length - 1 || isPlaying}
              className="px-3 py-1 text-sm rounded bg-surface border border-border disabled:opacity-50"
            >
              Step Forward ⏭
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-1 text-sm rounded bg-surface-hover border border-border"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Step description */}
        <div className="mb-4 p-3 rounded-lg bg-surface-hover border border-border text-sm font-medium">
          <span className="text-accent mr-2">Step {currentStepIndex + 1}/{steps.length}:</span>
          {currentStep?.description || "Algorithm finished."}
        </div>

        <GraphEditor 
          initialNodes={nodes}
          initialEdges={edges}
          algorithmStep={currentStep}
          onGraphChange={handleGraphChange}
          height={400}
          editable={true}
        />
        
        <div className="mt-4 flex gap-4 text-xs text-foreground-muted justify-center not-prose">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--foreground-subtle)]"></span> Unvisited</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }}></span> Stack (Frontier)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#6366f1" }}></span> Current</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#10b981" }}></span> Visited</div>
        </div>
      </div>

      <h2>How it Works</h2>
      <p>
        DFS uses a <strong>Stack</strong> (Last-In-First-Out). Because the most recently discovered node is explored next, 
        DFS dives down a single path until it hits a dead end, then <em>backtracks</em> to the last node that had unexplored edges. 
        It's often implemented recursively.
      </p>

      <h2>Time Complexity</h2>
      <p>
        Just like BFS, the time complexity is <MathBlock tex="\mathcal{O}(V + E)" inline />, as it also must explore every vertex and edge.
      </p>

      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Compare this visualization with the BFS one. Notice how DFS shoots down the left side of the tree first (A &rarr; B &rarr; D), 
          whereas BFS explores A, then B and C before moving to D.
        </p>
      </div>

      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/graph-theory/dfs")}
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
