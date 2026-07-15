/**
 * Graph algorithm implementations that return step-by-step state
 * for animated visualization in the GraphEditor primitive.
 *
 * Each algorithm takes a graph representation and produces an array
 * of AlgorithmStep objects — the GraphEditor replays these to
 * animate node/edge highlighting.
 */

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

export type NodeState = "unvisited" | "frontier" | "visiting" | "visited";
export type EdgeState = "default" | "exploring" | "tree" | "back" | "path";

export interface AlgorithmStep {
  /** Which nodes have which state at this step */
  nodeStates: Record<string, NodeState>;
  /** Which edges have which state at this step */
  edgeStates: Record<string, EdgeState>;
  /** The node currently being processed */
  currentNode: string | null;
  /** Human-readable explanation of what happened in this step */
  description: string;
}

interface AdjEntry {
  neighbor: string;
  edgeId: string;
  weight: number;
}

/** Build an adjacency list from edges. Treats edges as undirected. */
function buildAdjList(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Record<string, AdjEntry[]> {
  const adj: Record<string, AdjEntry[]> = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) {
    adj[e.source]?.push({ neighbor: e.target, edgeId: e.id, weight: e.weight ?? 1 });
    adj[e.target]?.push({ neighbor: e.source, edgeId: e.id, weight: e.weight ?? 1 });
  }
  return adj;
}

/** Initialize all node/edge states to their defaults */
function initStates(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodeStates: Record<string, NodeState>; edgeStates: Record<string, EdgeState> } {
  const nodeStates: Record<string, NodeState> = {};
  const edgeStates: Record<string, EdgeState> = {};
  for (const n of nodes) nodeStates[n.id] = "unvisited";
  for (const e of edges) edgeStates[e.id] = "default";
  return { nodeStates, edgeStates };
}

/** Deep-clone state objects for each step so mutations don't leak */
function snapshot(
  nodeStates: Record<string, NodeState>,
  edgeStates: Record<string, EdgeState>,
  currentNode: string | null,
  description: string
): AlgorithmStep {
  return {
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    currentNode,
    description,
  };
}

// ──────────────────────────────────────────────────
// BFS
// ──────────────────────────────────────────────────

export function bfs(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string
): AlgorithmStep[] {
  const adj = buildAdjList(nodes, edges);
  const { nodeStates, edgeStates } = initStates(nodes, edges);
  const steps: AlgorithmStep[] = [];

  const queue: string[] = [startId];
  nodeStates[startId] = "frontier";
  steps.push(snapshot(nodeStates, edgeStates, null, `Add ${startId} to the queue`));

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodeStates[current] = "visiting";
    steps.push(snapshot(nodeStates, edgeStates, current, `Dequeue and visit ${current}`));

    for (const { neighbor, edgeId } of adj[current] ?? []) {
      if (nodeStates[neighbor] === "unvisited") {
        nodeStates[neighbor] = "frontier";
        edgeStates[edgeId] = "tree";
        queue.push(neighbor);
        steps.push(
          snapshot(nodeStates, edgeStates, current, `Discover ${neighbor} via edge to ${current}`)
        );
      }
    }

    nodeStates[current] = "visited";
    steps.push(snapshot(nodeStates, edgeStates, current, `Finished processing ${current}`));
  }

  return steps;
}

// ──────────────────────────────────────────────────
// DFS
// ──────────────────────────────────────────────────

export function dfs(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string
): AlgorithmStep[] {
  const adj = buildAdjList(nodes, edges);
  const { nodeStates, edgeStates } = initStates(nodes, edges);
  const steps: AlgorithmStep[] = [];

  const stack: string[] = [startId];
  nodeStates[startId] = "frontier";
  steps.push(snapshot(nodeStates, edgeStates, null, `Push ${startId} onto the stack`));

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (nodeStates[current] === "visited") continue;

    nodeStates[current] = "visiting";
    steps.push(snapshot(nodeStates, edgeStates, current, `Pop and visit ${current}`));

    for (const { neighbor, edgeId } of adj[current] ?? []) {
      if (nodeStates[neighbor] === "unvisited") {
        nodeStates[neighbor] = "frontier";
        edgeStates[edgeId] = "tree";
        stack.push(neighbor);
        steps.push(
          snapshot(nodeStates, edgeStates, current, `Discover ${neighbor} via edge from ${current}`)
        );
      }
    }

    nodeStates[current] = "visited";
    steps.push(snapshot(nodeStates, edgeStates, current, `Finished processing ${current}`));
  }

  return steps;
}

// ──────────────────────────────────────────────────
// Dijkstra's Shortest Path
// ──────────────────────────────────────────────────

export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId?: string
): AlgorithmStep[] {
  const adj = buildAdjList(nodes, edges);
  const { nodeStates, edgeStates } = initStates(nodes, edges);
  const steps: AlgorithmStep[] = [];

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const prevEdge: Record<string, string | null> = {};

  for (const n of nodes) {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    prevEdge[n.id] = null;
  }
  dist[startId] = 0;

  // Simple priority queue via sorted array — fine for visualization sizes
  const pq: Array<{ id: string; dist: number }> = [{ id: startId, dist: 0 }];
  nodeStates[startId] = "frontier";
  steps.push(snapshot(nodeStates, edgeStates, null, `Initialize: dist(${startId}) = 0`));

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: current } = pq.shift()!;

    if (nodeStates[current] === "visited") continue;

    nodeStates[current] = "visiting";
    steps.push(
      snapshot(nodeStates, edgeStates, current, `Visit ${current} (dist = ${dist[current]})`)
    );

    if (endId && current === endId) {
      // Reconstruct path
      let pathNode: string | null = endId;
      while (pathNode) {
        nodeStates[pathNode] = "visited";
        const pe = prevEdge[pathNode];
        if (pe) edgeStates[pe] = "path";
        pathNode = prev[pathNode];
      }
      steps.push(
        snapshot(nodeStates, edgeStates, current, `Found shortest path to ${endId}!`)
      );
      break;
    }

    for (const { neighbor, edgeId, weight } of adj[current] ?? []) {
      const newDist = dist[current] + weight;
      if (newDist < dist[neighbor]) {
        dist[neighbor] = newDist;
        prev[neighbor] = current;
        prevEdge[neighbor] = edgeId;
        nodeStates[neighbor] = "frontier";
        edgeStates[edgeId] = "exploring";
        pq.push({ id: neighbor, dist: newDist });
        steps.push(
          snapshot(
            nodeStates,
            edgeStates,
            current,
            `Relax ${neighbor}: dist = ${newDist.toFixed(1)}`
          )
        );
      }
    }

    nodeStates[current] = "visited";
    steps.push(snapshot(nodeStates, edgeStates, current, `Done with ${current}`));
  }

  return steps;
}

// ──────────────────────────────────────────────────
// A* Search
// ──────────────────────────────────────────────────

export function aStar(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): AlgorithmStep[] {
  const adj = buildAdjList(nodes, edges);
  const { nodeStates, edgeStates } = initStates(nodes, edges);
  const steps: AlgorithmStep[] = [];

  // Euclidean heuristic using node positions
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  function h(id: string): number {
    const a = nodeMap.get(id);
    const b = nodeMap.get(endId);
    if (!a || !b) return 0;
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const prevEdge: Record<string, string | null> = {};

  for (const n of nodes) {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
    prev[n.id] = null;
    prevEdge[n.id] = null;
  }
  gScore[startId] = 0;
  fScore[startId] = h(startId);

  const openSet: Array<{ id: string; f: number }> = [{ id: startId, f: fScore[startId] }];
  nodeStates[startId] = "frontier";
  steps.push(snapshot(nodeStates, edgeStates, null, `Initialize A*: start = ${startId}, goal = ${endId}`));

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const { id: current } = openSet.shift()!;

    if (nodeStates[current] === "visited") continue;

    nodeStates[current] = "visiting";
    steps.push(
      snapshot(
        nodeStates,
        edgeStates,
        current,
        `Expand ${current} (g=${gScore[current].toFixed(1)}, f=${fScore[current].toFixed(1)})`
      )
    );

    if (current === endId) {
      let pathNode: string | null = endId;
      while (pathNode) {
        nodeStates[pathNode] = "visited";
        const pe = prevEdge[pathNode];
        if (pe) edgeStates[pe] = "path";
        pathNode = prev[pathNode];
      }
      steps.push(snapshot(nodeStates, edgeStates, current, `A* found path to ${endId}!`));
      break;
    }

    for (const { neighbor, edgeId, weight } of adj[current] ?? []) {
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[neighbor]) {
        prev[neighbor] = current;
        prevEdge[neighbor] = edgeId;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + h(neighbor);
        nodeStates[neighbor] = "frontier";
        edgeStates[edgeId] = "exploring";
        openSet.push({ id: neighbor, f: fScore[neighbor] });
        steps.push(
          snapshot(
            nodeStates,
            edgeStates,
            current,
            `Update ${neighbor}: g=${tentativeG.toFixed(1)}, h=${h(neighbor).toFixed(1)}`
          )
        );
      }
    }

    nodeStates[current] = "visited";
    steps.push(snapshot(nodeStates, edgeStates, current, `Closed ${current}`));
  }

  return steps;
}
