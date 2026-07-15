"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import GraphEditor, { type GENode, type GEEdge } from "@/components/primitives/GraphEditor";
import { useProgress } from "@/components/layout/ProgressProvider";
import { bfs, type AlgorithmStep } from "@/lib/graphAlgorithms";

// Default graph for BFS
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

export default function BFSPage() {
  const { markCompleted } = useProgress();
  
  const [nodes, setNodes] = useState<GENode[]>(initialNodes);
  const [edges, setEdges] = useState<GEEdge[]>(initialEdges);
  
  // Algorithm execution state
  const steps = useMemo(() => bfs(nodes, edges, "A"), [nodes, edges]);
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
      <h1>Breadth-First Search (BFS)</h1>
      <p>
        Breadth-First Search is an algorithm for traversing or searching tree or graph data structures. 
        It starts at the tree root (or an arbitrary node) and explores all nodes at the present 
        depth prior to moving on to the nodes at the next depth level.
      </p>

      {/* Widget */}
      <div className="widget-card">
        <div className="flex items-center justify-between mb-4">
          <div className="widget-card__title" style={{ margin: 0 }}>Interactive BFS</div>
          
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
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }}></span> Queue (Frontier)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#6366f1" }}></span> Current</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#10b981" }}></span> Visited</div>
        </div>
      </div>

      <h2>How it Works</h2>
      <p>
        BFS uses a <strong>Queue</strong> (First-In-First-Out) to keep track of the nodes it needs to visit next. 
        This ensures that it explores the graph level-by-level, making it perfectly suited for finding the shortest path 
        in an unweighted graph.
      </p>

      <h2>Time Complexity</h2>
      <p>
        <MathBlock tex="\mathcal{O}(V + E)" inline /> where <MathBlock tex="V" inline /> is the number of vertices and <MathBlock tex="E" inline /> is the number of edges. 
        This is because every vertex and every edge will be explored in the worst case.
      </p>

      <div className="challenge-block">
        <div className="challenge-block__label">🎯 Try It Yourself</div>
        <p style={{ margin: 0 }}>
          Try adding a new node to the graph and connecting it to <strong>D</strong> and <strong>F</strong>. 
          Notice how it gets queued and visited during the traversal! (Click the canvas to add a node, drag between nodes to connect).
        </p>
      </div>

      <div className="text-center mt-6 not-prose">
        <button
          onClick={() => markCompleted("/graph-theory/bfs")}
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
