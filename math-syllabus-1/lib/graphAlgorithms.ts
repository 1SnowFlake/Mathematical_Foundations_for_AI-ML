/**
 * Types and helper algorithms for Graph visualization.
 */

export type NodeState = "unvisited" | "frontier" | "visiting" | "visited";
export type EdgeState = "default" | "exploring" | "tree" | "back" | "path";

export interface AlgorithmStep {
  description: string;
  currentNode?: string | null;
  nodeStates: Record<string, NodeState>;
  edgeStates: Record<string, EdgeState>;
  customData?: Record<string, unknown>;
}
