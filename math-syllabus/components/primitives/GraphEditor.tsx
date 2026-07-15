"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import type { AlgorithmStep, NodeState, EdgeState } from "@/lib/graphAlgorithms";

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface GENode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GEEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

interface GraphEditorProps {
  /** Initial nodes */
  initialNodes?: GENode[];
  /** Initial edges */
  initialEdges?: GEEdge[];
  /** Current algorithm step (for visualization playback) */
  algorithmStep?: AlgorithmStep | null;
  /** Called whenever the graph structure changes */
  onGraphChange?: (nodes: GENode[], edges: GEEdge[]) => void;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** If true, allows adding/removing nodes and edges */
  editable?: boolean;
}

// ──────────────────────────────────────────────────
// Color map for algorithm states
// ──────────────────────────────────────────────────

const NODE_COLORS: Record<NodeState, string> = {
  unvisited: "var(--foreground-subtle)",
  frontier: "#f59e0b",   // amber
  visiting: "#6366f1",    // indigo (accent)
  visited: "#10b981",     // emerald
};

const EDGE_COLORS: Record<EdgeState, string> = {
  default: "var(--foreground-subtle)",
  exploring: "#f59e0b",
  tree: "#10b981",
  back: "#ef4444",
  path: "#6366f1",
};

// ──────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────

/**
 * SVG-based graph editor for algorithm visualization.
 * Supports adding/removing nodes (click canvas / right-click node),
 * creating edges (drag between nodes), and algorithm step replay
 * with color-coded node/edge states.
 *
 * Uses pointer events for touch+mouse compatibility.
 */
export default function GraphEditor({
  initialNodes = [],
  initialEdges = [],
  algorithmStep = null,
  onGraphChange,
  width = 600,
  height = 400,
  editable = true,
}: GraphEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GENode[]>(initialNodes);
  const [edges, setEdges] = useState<GEEdge[]>(initialEdges);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const nextIdRef = useRef(initialNodes.length + 1);

  // Sync with parent when graph changes
  useEffect(() => {
    onGraphChange?.(nodes, edges);
  }, [nodes, edges, onGraphChange]);

  // Reset nodes/edges when initialNodes/initialEdges change (for resetting the graph)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    nextIdRef.current = initialNodes.length + 1;
  }, [initialNodes, initialEdges]);

  // ── Helpers ──

  const getSvgPoint = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  const nodeRadius = 22;

  // ── Node dragging ──

  const handleNodePointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      setDragNodeId(id);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pt = getSvgPoint(e);
      setMousePos(pt);

      if (dragNodeId) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragNodeId
              ? { ...n, x: Math.max(nodeRadius, Math.min(width - nodeRadius, pt.x)), y: Math.max(nodeRadius, Math.min(height - nodeRadius, pt.y)) }
              : n
          )
        );
      }
    },
    [dragNodeId, getSvgPoint, width, height]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // If we were creating an edge, check if we released over a node
      if (edgeSource) {
        const pt = getSvgPoint(e);
        const targetNode = nodes.find(
          (n) => Math.hypot(n.x - pt.x, n.y - pt.y) < nodeRadius
        );
        if (targetNode && targetNode.id !== edgeSource) {
          // Check for duplicate edge
          const exists = edges.some(
            (edge) =>
              (edge.source === edgeSource && edge.target === targetNode.id) ||
              (edge.source === targetNode.id && edge.target === edgeSource)
          );
          if (!exists) {
            setEdges((prev) => [
              ...prev,
              { id: `e${edgeSource}-${targetNode.id}`, source: edgeSource, target: targetNode.id, weight: 1 },
            ]);
          }
        }
        setEdgeSource(null);
        setMousePos(null);
      }
      setDragNodeId(null);
    },
    [edgeSource, getSvgPoint, nodes, edges]
  );

  // ── Adding nodes (double-click on canvas) ──

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editable) return;
      const pt = getSvgPoint(e);
      // Don't add if too close to existing node
      const tooClose = nodes.some((n) => Math.hypot(n.x - pt.x, n.y - pt.y) < nodeRadius * 2.5);
      if (tooClose) return;

      const id = `n${nextIdRef.current++}`;
      setNodes((prev) => [...prev, { id, label: id, x: pt.x, y: pt.y }]);
    },
    [editable, getSvgPoint, nodes]
  );

  // ── Edge creation (right-click + drag from node) ──

  const handleNodeContextMenu = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (!editable) return;

      if (edgeSource === null) {
        setEdgeSource(id);
      }
    },
    [editable, edgeSource]
  );

  // ── Removing nodes (double right-click) ──

  const handleNodeDoubleClick = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!editable) return;
      // Remove node and all connected edges
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
    },
    [editable]
  );

  // ── Rendering helpers ──

  function getNodeColor(id: string): string {
    if (algorithmStep?.nodeStates[id]) {
      return NODE_COLORS[algorithmStep.nodeStates[id]];
    }
    return "var(--foreground-muted)";
  }

  function getNodeStroke(id: string): string {
    if (algorithmStep?.currentNode === id) return "var(--accent)";
    return getNodeColor(id);
  }

  function getEdgeColor(id: string): string {
    if (algorithmStep?.edgeStates[id]) {
      return EDGE_COLORS[algorithmStep.edgeStates[id]];
    }
    return "var(--border-strong)";
  }

  function getEdgeWidth(id: string): number {
    if (algorithmStep?.edgeStates[id] === "path") return 4;
    if (algorithmStep?.edgeStates[id] === "tree") return 3;
    return 2;
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none rounded-lg border border-border bg-surface"
        style={{ touchAction: "none", maxWidth: "100%" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleCanvasDoubleClick}
        role="application"
        aria-label="Graph editor canvas"
      >
        {/* Edges */}
        {edges.map((edge) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;

          return (
            <g key={edge.id}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={getEdgeColor(edge.id)}
                strokeWidth={getEdgeWidth(edge.id)}
                strokeLinecap="round"
              />
              {/* Edge weight label */}
              {edge.weight !== undefined && edge.weight !== 1 && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 8}
                  textAnchor="middle"
                  fill="var(--foreground-muted)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Edge creation preview line */}
        {edgeSource && mousePos && (() => {
          const sourceNode = nodes.find((n) => n.id === edgeSource);
          if (!sourceNode) return null;
          return (
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="6 3"
              opacity={0.6}
            />
          );
        })()}

        {/* Nodes */}
        {nodes.map((node) => (
          <g
            key={node.id}
            onPointerDown={handleNodePointerDown(node.id)}
            onContextMenu={handleNodeContextMenu(node.id)}
            onDoubleClick={handleNodeDoubleClick(node.id)}
            style={{ cursor: "grab" }}
          >
            {/* Pulse ring for current node */}
            {algorithmStep?.currentNode === node.id && (
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 6}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                opacity={0.4}
              >
                <animate
                  attributeName="r"
                  from={String(nodeRadius + 4)}
                  to={String(nodeRadius + 14)}
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={getNodeColor(node.id)}
              fillOpacity={0.15}
              stroke={getNodeStroke(node.id)}
              strokeWidth={algorithmStep?.currentNode === node.id ? 3 : 2}
            />

            {/* Node label */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={getNodeColor(node.id)}
              fontSize={12}
              fontWeight={600}
              fontFamily="var(--font-mono)"
              pointerEvents="none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Algorithm step description */}
      {algorithmStep && (
        <div className="mt-2 rounded-md bg-background-secondary px-3 py-2 text-sm text-foreground-muted font-mono">
          {algorithmStep.description}
        </div>
      )}

      {/* Instructions */}
      {editable && (
        <div className="mt-2 text-xs text-foreground-subtle">
          Double-click canvas to add node • Right-click node then release on another to create edge • Double-click node to delete
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Algorithm playback hook
// ──────────────────────────────────────────────────

/**
 * Hook for stepping through algorithm visualization.
 * Returns controls for play/pause/step/reset.
 */
export function useAlgorithmPlayback(steps: AlgorithmStep[], speed: number = 500) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null;

  const play = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, steps.length]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const stepForward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const stepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  return {
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
  };
}
