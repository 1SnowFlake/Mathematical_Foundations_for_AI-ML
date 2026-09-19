"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import MathBlock from "@/components/primitives/MathBlock";

interface WordEmbedding {
  word: string;
  cluster: "tech" | "science" | "royalty" | "nature" | "space" | "sports";
  highDim: number[]; // 50-D sample slice
  pos2d: [number, number]; // 2D t-SNE coordinate
  pos3d: [number, number, number]; // 3D t-SNE coordinate
}

// Curated 42-word semantic dataset mimicking GloVe 50D + t-SNE projections
const EMBEDDING_DATASET: WordEmbedding[] = [
  // Tech / Software / Computing
  { word: "interface", cluster: "tech", highDim: [0.70, -0.09, -0.42, 0.48, 1.59, -1.72, 0.38, -1.94], pos2d: [-3.2, 2.4], pos3d: [-3.0, 2.2, 1.1] },
  { word: "user", cluster: "tech", highDim: [0.65, -0.12, -0.38, 0.52, 1.45, -1.60, 0.41, -1.82], pos2d: [-3.0, 2.6], pos3d: [-2.8, 2.5, 0.9] },
  { word: "application", cluster: "tech", highDim: [0.72, -0.05, -0.40, 0.44, 1.62, -1.78, 0.35, -1.90], pos2d: [-3.4, 2.1], pos3d: [-3.2, 2.0, 1.4] },
  { word: "hardware", cluster: "tech", highDim: [0.58, -0.18, -0.45, 0.39, 1.50, -1.65, 0.29, -1.75], pos2d: [-2.7, 2.0], pos3d: [-2.5, 1.8, 1.5] },
  { word: "device", cluster: "tech", highDim: [0.61, -0.15, -0.43, 0.42, 1.54, -1.70, 0.32, -1.80], pos2d: [-2.9, 2.2], pos3d: [-2.7, 2.1, 1.3] },
  { word: "platform", cluster: "tech", highDim: [0.68, -0.08, -0.39, 0.46, 1.58, -1.74, 0.36, -1.88], pos2d: [-3.3, 2.7], pos3d: [-3.1, 2.6, 0.8] },
  { word: "software", cluster: "tech", highDim: [0.75, -0.02, -0.35, 0.50, 1.68, -1.82, 0.40, -1.98], pos2d: [-3.5, 2.5], pos3d: [-3.3, 2.4, 1.0] },
  { word: "algorithm", cluster: "tech", highDim: [0.82, 0.10, -0.28, 0.55, 1.72, -1.89, 0.45, -2.05], pos2d: [-3.7, 1.8], pos3d: [-3.5, 1.6, 1.7] },

  // Science / Physics / Math
  { word: "quantum", cluster: "science", highDim: [1.20, 0.45, -0.10, 0.80, 0.20, -0.90, 0.70, -0.50], pos2d: [2.8, 3.2], pos3d: [2.6, 3.0, -1.2] },
  { word: "physics", cluster: "science", highDim: [1.15, 0.40, -0.12, 0.75, 0.25, -0.85, 0.65, -0.55], pos2d: [2.5, 3.4], pos3d: [2.3, 3.2, -1.0] },
  { word: "particle", cluster: "science", highDim: [1.18, 0.42, -0.08, 0.78, 0.18, -0.88, 0.68, -0.48], pos2d: [2.9, 3.5], pos3d: [2.7, 3.3, -1.4] },
  { word: "energy", cluster: "science", highDim: [1.05, 0.35, -0.15, 0.70, 0.30, -0.80, 0.60, -0.60], pos2d: [2.2, 2.9], pos3d: [2.0, 2.7, -0.8] },
  { word: "matrix", cluster: "science", highDim: [1.10, 0.50, -0.05, 0.85, 0.40, -0.70, 0.75, -0.40], pos2d: [2.6, 2.5], pos3d: [2.4, 2.3, -0.5] },
  { word: "vector", cluster: "science", highDim: [1.12, 0.52, -0.03, 0.88, 0.42, -0.68, 0.78, -0.38], pos2d: [2.7, 2.3], pos3d: [2.5, 2.1, -0.4] },
  { word: "dimension", cluster: "science", highDim: [1.08, 0.48, -0.07, 0.82, 0.38, -0.72, 0.72, -0.42], pos2d: [2.4, 2.2], pos3d: [2.2, 2.0, -0.6] },

  // Royalty / Politics / History
  { word: "king", cluster: "royalty", highDim: [-0.85, 1.40, 0.90, -0.30, -0.50, 0.80, -1.10, 0.95], pos2d: [3.5, -2.2], pos3d: [3.3, -2.0, 2.0] },
  { word: "queen", cluster: "royalty", highDim: [-0.82, 1.38, 0.88, -0.28, -0.48, 0.78, -1.08, 0.92], pos2d: [3.7, -2.0], pos3d: [3.5, -1.8, 2.2] },
  { word: "monarch", cluster: "royalty", highDim: [-0.88, 1.42, 0.92, -0.32, -0.52, 0.82, -1.12, 0.98], pos2d: [3.4, -2.5], pos3d: [3.2, -2.3, 1.9] },
  { word: "palace", cluster: "royalty", highDim: [-0.78, 1.30, 0.82, -0.25, -0.42, 0.72, -1.02, 0.85], pos2d: [3.9, -2.4], pos3d: [3.7, -2.2, 2.4] },
  { word: "throne", cluster: "royalty", highDim: [-0.80, 1.35, 0.85, -0.27, -0.45, 0.75, -1.05, 0.88], pos2d: [3.6, -1.8], pos3d: [3.4, -1.6, 2.1] },
  { word: "emperor", cluster: "royalty", highDim: [-0.90, 1.45, 0.95, -0.35, -0.55, 0.85, -1.15, 1.02], pos2d: [3.2, -2.3], pos3d: [3.0, -2.1, 1.8] },
  { word: "crown", cluster: "royalty", highDim: [-0.75, 1.28, 0.80, -0.22, -0.40, 0.70, -1.00, 0.82], pos2d: [3.8, -1.7], pos3d: [3.6, -1.5, 2.3] },

  // Nature / Animals / Biology
  { word: "wolf", cluster: "nature", highDim: [-1.50, -0.80, 1.10, -0.90, 0.40, 0.60, -0.20, 0.30], pos2d: [-2.2, -2.8], pos3d: [-2.0, -2.6, -1.8] },
  { word: "lion", cluster: "nature", highDim: [-1.45, -0.75, 1.15, -0.85, 0.45, 0.65, -0.15, 0.35], pos2d: [-2.0, -3.0], pos3d: [-1.8, -2.8, -1.6] },
  { word: "tiger", cluster: "nature", highDim: [-1.48, -0.78, 1.12, -0.88, 0.42, 0.62, -0.18, 0.32], pos2d: [-2.4, -3.1], pos3d: [-2.2, -2.9, -1.9] },
  { word: "bear", cluster: "nature", highDim: [-1.40, -0.70, 1.05, -0.80, 0.38, 0.58, -0.22, 0.28], pos2d: [-1.8, -2.7], pos3d: [-1.6, -2.5, -1.5] },
  { word: "forest", cluster: "nature", highDim: [-1.30, -0.60, 0.95, -0.70, 0.30, 0.50, -0.30, 0.20], pos2d: [-2.5, -2.4], pos3d: [-2.3, -2.2, -2.1] },
  { word: "wildlife", cluster: "nature", highDim: [-1.35, -0.65, 1.00, -0.75, 0.35, 0.55, -0.25, 0.25], pos2d: [-2.1, -2.5], pos3d: [-1.9, -2.3, -1.7] },
  { word: "predator", cluster: "nature", highDim: [-1.42, -0.72, 1.08, -0.82, 0.40, 0.60, -0.20, 0.30], pos2d: [-2.3, -2.9], pos3d: [-2.1, -2.7, -1.8] },

  // Space / Astronomy / Cosmos
  { word: "galaxy", cluster: "space", highDim: [0.10, -1.60, -0.90, 1.20, -0.80, 0.30, 1.10, -0.90], pos2d: [0.5, -3.5], pos3d: [0.4, -3.3, 0.5] },
  { word: "planet", cluster: "space", highDim: [0.15, -1.55, -0.85, 1.15, -0.75, 0.35, 1.05, -0.85], pos2d: [0.8, -3.3], pos3d: [0.7, -3.1, 0.7] },
  { word: "star", cluster: "space", highDim: [0.12, -1.58, -0.88, 1.18, -0.78, 0.32, 1.08, -0.88], pos2d: [0.3, -3.7], pos3d: [0.2, -3.5, 0.3] },
  { word: "orbit", cluster: "space", highDim: [0.20, -1.50, -0.80, 1.10, -0.70, 0.40, 1.00, -0.80], pos2d: [1.0, -3.1], pos3d: [0.9, -2.9, 0.9] },
  { word: "cosmos", cluster: "space", highDim: [0.08, -1.62, -0.92, 1.22, -0.82, 0.28, 1.12, -0.92], pos2d: [0.2, -3.4], pos3d: [0.1, -3.2, 0.4] },
  { word: "telescope", cluster: "space", highDim: [0.25, -1.45, -0.75, 1.05, -0.65, 0.45, 0.95, -0.75], pos2d: [1.2, -3.5], pos3d: [1.1, -3.3, 0.8] },
  { word: "satellite", cluster: "space", highDim: [0.30, -1.40, -0.70, 1.00, -0.60, 0.50, 0.90, -0.70], pos2d: [1.4, -3.2], pos3d: [1.3, -3.0, 1.0] },

  // Sports / Athletics
  { word: "football", cluster: "sports", highDim: [-0.50, -0.20, -1.40, -0.60, -1.20, -0.40, -0.80, 0.40], pos2d: [-0.5, 3.2], pos3d: [-0.4, 3.0, -2.2] },
  { word: "soccer", cluster: "sports", highDim: [-0.48, -0.18, -1.38, -0.58, -1.18, -0.38, -0.78, 0.42], pos2d: [-0.3, 3.4], pos3d: [-0.2, 3.2, -2.0] },
  { word: "tennis", cluster: "sports", highDim: [-0.52, -0.22, -1.42, -0.62, -1.22, -0.42, -0.82, 0.38], pos2d: [-0.7, 3.5], pos3d: [-0.6, 3.3, -2.4] },
  { word: "stadium", cluster: "sports", highDim: [-0.45, -0.15, -1.35, -0.55, -1.15, -0.35, -0.75, 0.45], pos2d: [-0.2, 3.1], pos3d: [-0.1, 2.9, -1.9] },
  { word: "championship", cluster: "sports", highDim: [-0.55, -0.25, -1.45, -0.65, -1.25, -0.45, -0.85, 0.35], pos2d: [-0.8, 3.1], pos3d: [-0.7, 2.9, -2.3] },
  { word: "athlete", cluster: "sports", highDim: [-0.50, -0.20, -1.40, -0.60, -1.20, -0.40, -0.80, 0.40], pos2d: [-0.6, 3.7], pos3d: [-0.5, 3.5, -2.1] },
];

const CLUSTER_COLORS: Record<string, { bg: string; border: string; name: string }> = {
  tech: { bg: "#3b82f6", border: "#60a5fa", name: "Technology & Software" },
  science: { bg: "#8b5cf6", border: "#a78bfa", name: "Physics & Mathematics" },
  royalty: { bg: "#f59e0b", border: "#fbbf24", name: "Royalty & History" },
  nature: { bg: "#10b981", border: "#34d399", name: "Nature & Animals" },
  space: { bg: "#ec4899", border: "#f472b6", name: "Astronomy & Cosmos" },
  sports: { bg: "#06b6d4", border: "#22d3ee", name: "Athletics & Sports" },
};

// Euclidean distance
function euclideanDist(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Cosine distance (1 - cosine similarity)
function cosineDist(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 1;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - sim;
}

// Converts a raw distance into an intuitive 0-100% "closeness" score.
// This is purely presentational (it does not change the underlying math or
// ranking) — it exists so a newcomer can read "88% similar" instead of
// puzzling over what "d = 1.42" means.
function toSimilarityPct(distance: number, metric: "euclidean" | "cosine"): number {
  const scale = metric === "cosine" ? 1 : 2.2;
  const pct = Math.exp(-distance / scale) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// Small hover-triggered glossary bubble for jargon terms.
function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group align-middle ml-1 not-prose">
      <span className="w-[15px] h-[15px] rounded-full border border-border text-[9px] leading-[13px] text-center text-foreground-muted cursor-help select-none hover:border-blue-400 hover:text-blue-400 transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-background border border-border px-3 py-2 text-[11px] leading-snug text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-xl normal-case font-normal">
        {text}
      </span>
    </span>
  );
}

export default function EmbeddingsVisualizerSection() {
  const [selectedWord, setSelectedWord] = useState<string>("interface");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [kNeighbors, setKNeighbors] = useState<number>(6);
  const [metric, setMetric] = useState<"euclidean" | "cosine">("euclidean");
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  // Which semantic domains are currently hidden from the 2D map
  const [hiddenClusters, setHiddenClusters] = useState<Set<string>>(new Set());

  // Hover state (2D map)
  const [hoveredWord2d, setHoveredWord2d] = useState<string | null>(null);
  const [tooltipPos2d, setTooltipPos2d] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover state (3D neighborhood)
  const [hoveredWord3d, setHoveredWord3d] = useState<string | null>(null);
  const [tooltipPos3d, setTooltipPos3d] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Word Analogy Playground: A - B + C ≈ ?
  const [analogyA, setAnalogyA] = useState<string>("king");
  const [analogyB, setAnalogyB] = useState<string>("queen");
  const [analogyC, setAnalogyC] = useState<string>("wolf");

  // 3D Canvas camera angles
  const [yaw3d, setYaw3d] = useState(0.8);
  const [pitch3d, setPitch3d] = useState(-0.4);
  const dragging3d = useRef(false);
  const didDrag3d = useRef(false);
  const lastPos3d = useRef({ x: 0, y: 0 });
  const DEFAULT_YAW = 0.8;
  const DEFAULT_PITCH = -0.4;

  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const canvas3dRef = useRef<HTMLCanvasElement>(null);

  // Current query embedding
  const currentEmbedding = useMemo(
    () => EMBEDDING_DATASET.find((item) => item.word === selectedWord) || EMBEDDING_DATASET[0],
    [selectedWord]
  );

  const distFn = useMemo(
    () => (metric === "euclidean" ? euclideanDist : cosineDist),
    [metric]
  );

  // Computed k-nearest neighbors in high-dimensional space
  const neighbors = useMemo(() => {
    const scored = EMBEDDING_DATASET.map((item) => ({
      ...item,
      distance: distFn(currentEmbedding.highDim, item.highDim),
    }));

    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, kNeighbors + 1); // query word + k neighbors
  }, [currentEmbedding, kNeighbors, distFn]);

  // The single closest other word — used for the plain-English summary line
  const closestNeighbor = neighbors.find((n) => n.word !== currentEmbedding.word) ?? null;

  const toggleCluster = (cluster: string) => {
    setHiddenClusters((prev) => {
      const next = new Set(prev);
      if (next.has(cluster)) next.delete(cluster);
      else next.add(cluster);
      return next;
    });
  };

  // Analogy result: take vector(A) - vector(B) + vector(C), then find the
  // words whose vectors land closest to that point (excluding A, B, C).
  const analogyResults = useMemo(() => {
    const a = EMBEDDING_DATASET.find((w) => w.word === analogyA);
    const b = EMBEDDING_DATASET.find((w) => w.word === analogyB);
    const c = EMBEDDING_DATASET.find((w) => w.word === analogyC);
    if (!a || !b || !c) return [];

    const targetVec = a.highDim.map((v, i) => v - b.highDim[i] + c.highDim[i]);
    return EMBEDDING_DATASET
      .filter((w) => ![a.word, b.word, c.word].includes(w.word))
      .map((w) => ({ ...w, distance: distFn(targetVec, w.highDim) }))
      .sort((x, y) => x.distance - y.distance)
      .slice(0, 3);
  }, [analogyA, analogyB, analogyC, distFn]);

  // Reusable 3D projection: takes a 3D point (already relative to the whole
  // dataset) and returns its 2D screen position given the current camera
  // rotation. Shared by the draw routine and the hover hit-test so the two
  // never drift out of sync.
  const project3d = useCallback(
    (v: [number, number, number], width: number, height: number) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = 55;
      const centroid = currentEmbedding.pos3d;

      const relX = v[0] - centroid[0];
      const relY = v[1] - centroid[1];
      const relZ = v[2] - centroid[2];

      const cosY = Math.cos(yaw3d), sinY = Math.sin(yaw3d);
      const x1 = relX * cosY - relZ * sinY;
      const z1 = relX * sinY + relZ * cosY;

      const cosX = Math.cos(pitch3d), sinX = Math.sin(pitch3d);
      const y2 = relY * cosX - z1 * sinX;
      const z2 = relY * sinX + z1 * cosX;

      const persp = 450 / (450 + z2 * scale);
      return {
        x: cx + x1 * scale * persp,
        y: cy - y2 * scale * persp,
        depth: z2,
      };
    },
    [currentEmbedding, yaw3d, pitch3d]
  );

  // Draw 2D Overview Canvas
  const draw2d = useCallback(() => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = 38;

    // Draw subtle coordinate grid
    ctx.strokeStyle = "rgba(156, 163, 175, 0.15)";
    ctx.lineWidth = 1;
    for (let x = -5; x <= 5; x += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + x * scale, 0);
      ctx.lineTo(cx + x * scale, height);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, cy + y * scale);
      ctx.lineTo(width, cy + y * scale);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "rgba(156, 163, 175, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Draw connection lines to nearest neighbors
    const currentPx = cx + currentEmbedding.pos2d[0] * scale;
    const currentPy = cy - currentEmbedding.pos2d[1] * scale;

    neighbors.forEach((nbr) => {
      if (nbr.word === currentEmbedding.word) return;
      const nbrPx = cx + nbr.pos2d[0] * scale;
      const nbrPy = cy - nbr.pos2d[1] * scale;

      ctx.strokeStyle = nbr.word === hoveredWord2d ? "rgba(239, 68, 68, 0.7)" : "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = nbr.word === hoveredWord2d ? 2 : 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(currentPx, currentPy);
      ctx.lineTo(nbrPx, nbrPy);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw neighbor radius hull
    if (neighbors.length > 1) {
      const maxDist2d = Math.max(
        ...neighbors.map((n) => {
          const dx = n.pos2d[0] - currentEmbedding.pos2d[0];
          const dy = n.pos2d[1] - currentEmbedding.pos2d[1];
          return Math.sqrt(dx * dx + dy * dy);
        })
      );
      ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(currentPx, currentPy, maxDist2d * scale + 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Draw all points (points from hidden domains are skipped unless they're
    // the active word or one of its neighbors, so exploration never breaks)
    EMBEDDING_DATASET.forEach((item) => {
      const isSelected = item.word === currentEmbedding.word;
      const isNeighbor = neighbors.some((n) => n.word === item.word);
      const isHoverTarget = item.word === hoveredWord2d;
      const isHiddenDomain = hiddenClusters.has(item.cluster);
      if (isHiddenDomain && !isSelected && !isNeighbor) return;

      const px = cx + item.pos2d[0] * scale;
      const py = cy - item.pos2d[1] * scale;
      const color = CLUSTER_COLORS[item.cluster]?.bg || "#94a3b8";

      ctx.beginPath();
      if (isSelected) {
        ctx.arc(px, py, isHoverTarget ? 10.5 : 9, 0, 2 * Math.PI);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      } else if (isNeighbor) {
        ctx.arc(px, py, isHoverTarget ? 8 : 6.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isHoverTarget ? "#ef4444" : "#ffffff";
        ctx.stroke();
      } else {
        ctx.arc(px, py, isHoverTarget ? 5.5 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Render word labels
      if (isSelected || isNeighbor || isHoverTarget) {
        ctx.font = isSelected ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.fillStyle = isSelected ? "#ef4444" : "#e2e8f0";
        ctx.fillText(item.word, px + 8, py - 6);
      }
    });
  }, [currentEmbedding, neighbors, hiddenClusters, hoveredWord2d]);

  // Draw 3D Zoomed Neighborhood Canvas
  const draw3d = useCallback(() => {
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const originP = project3d(currentEmbedding.pos3d, width, height);
    const axisLen = 1.8;
    const [cx0, cy0, cz0] = currentEmbedding.pos3d;
    const axisX = project3d([cx0 + axisLen, cy0, cz0], width, height);
    const axisY = project3d([cx0, cy0 + axisLen, cz0], width, height);
    const axisZ = project3d([cx0, cy0, cz0 + axisLen], width, height);

    const drawAxis = (pTo: { x: number; y: number }, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(originP.x, originP.y);
      ctx.lineTo(pTo.x, pTo.y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "10px sans-serif";
      ctx.fillText(label, pTo.x + 4, pTo.y - 4);
    };

    drawAxis(axisX, "rgba(239, 68, 68, 0.7)", "+X");
    drawAxis(axisY, "rgba(34, 197, 94, 0.7)", "+Y");
    drawAxis(axisZ, "rgba(59, 130, 246, 0.7)", "+Z");

    // Project and sort neighbors by depth
    const projectedNeighbors = neighbors.map((item) => ({
      item,
      p: project3d(item.pos3d, width, height),
      isSelected: item.word === currentEmbedding.word,
    }));

    projectedNeighbors.sort((a, b) => b.p.depth - a.p.depth);

    // Draw connection lines to central query word
    projectedNeighbors.forEach(({ item, p, isSelected }) => {
      if (isSelected) return;
      const isHoverTarget = item.word === hoveredWord3d;
      ctx.strokeStyle = isHoverTarget ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.6)";
      ctx.lineWidth = isHoverTarget ? 2.2 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(originP.x, originP.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw distance badge along midpoint
      const midX = (originP.x + p.x) / 2;
      const midY = (originP.y + p.y) / 2;
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(midX - 18, midY - 9, 36, 16);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.strokeRect(midX - 18, midY - 9, 36, 16);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px monospace";
      ctx.fillText(item.distance.toFixed(2), midX - 12, midY + 3);
    });

    // Draw nodes
    projectedNeighbors.forEach(({ item, p, isSelected }) => {
      const isHoverTarget = item.word === hoveredWord3d;
      const color = CLUSTER_COLORS[item.cluster]?.bg || "#94a3b8";
      const radius = isSelected ? 10 : isHoverTarget ? 8.5 : 7;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#ef4444" : color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isHoverTarget && !isSelected ? "#ef4444" : "#ffffff";
      ctx.stroke();

      // Word Label banner
      ctx.font = isSelected ? "bold 13px sans-serif" : "12px sans-serif";
      const textWidth = ctx.measureText(item.word).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(p.x + 10, p.y - 12, textWidth + 12, 20);
      ctx.strokeStyle = isSelected ? "#ef4444" : isHoverTarget ? "#ef4444" : "rgba(148, 163, 184, 0.4)";
      ctx.strokeRect(p.x + 10, p.y - 12, textWidth + 12, 20);

      ctx.fillStyle = isSelected ? "#fca5a5" : "#f1f5f9";
      ctx.fillText(item.word, p.x + 16, p.y + 2);
    });
  }, [currentEmbedding, neighbors, project3d, hoveredWord3d]);

  useEffect(() => {
    draw2d();
  }, [draw2d]);

  useEffect(() => {
    draw3d();
  }, [draw3d]);

  // Click on 2D Canvas to pick nearest word
  const handleCanvas2dClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 38;

    let closestWord = selectedWord;
    let minDist = Infinity;

    EMBEDDING_DATASET.forEach((item) => {
      const px = cx + item.pos2d[0] * scale;
      const py = cy - item.pos2d[1] * scale;
      const d = Math.hypot(clickX - px, clickY - py);
      if (d < minDist && d < 40) {
        minDist = d;
        closestWord = item.word;
      }
    });

    if (closestWord !== selectedWord) {
      setSelectedWord(closestWord);
    }
  };

  // Hover on 2D canvas: find nearest point under the cursor for a tooltip
  const handleCanvas2dMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 38;

    let found: string | null = null;
    let minDist = Infinity;
    EMBEDDING_DATASET.forEach((item) => {
      if (hiddenClusters.has(item.cluster) && item.word !== currentEmbedding.word && !neighbors.some((n) => n.word === item.word)) return;
      const px = cx + item.pos2d[0] * scale;
      const py = cy - item.pos2d[1] * scale;
      const d = Math.hypot(mx - px, my - py);
      if (d < minDist && d < 18) {
        minDist = d;
        found = item.word;
      }
    });

    setHoveredWord2d(found);
    setTooltipPos2d({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCanvas2dLeave = () => setHoveredWord2d(null);

  // 3D Canvas mouse dragging + hover
  const onPointerDown3d = (e: React.PointerEvent) => {
    dragging3d.current = true;
    didDrag3d.current = false;
    lastPos3d.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvas3dMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging3d.current) {
      const dx = e.clientX - lastPos3d.current.x;
      const dy = e.clientY - lastPos3d.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) didDrag3d.current = true;
      lastPos3d.current = { x: e.clientX, y: e.clientY };
      setYaw3d((y) => y + dx * 0.012);
      setPitch3d((p) => Math.min(1.4, Math.max(-1.4, p - dy * 0.012)));
      setHoveredWord3d(null);
      return;
    }

    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let found: string | null = null;
    let minDist = Infinity;
    neighbors.forEach((item) => {
      const p = project3d(item.pos3d, canvas.width, canvas.height);
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d < minDist && d < 22) {
        minDist = d;
        found = item.word;
      }
    });
    setHoveredWord3d(found);
    setTooltipPos3d({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const stopDrag3d = () => {
    dragging3d.current = false;
  };

  const handleCanvas3dLeave = () => {
    dragging3d.current = false;
    setHoveredWord3d(null);
  };

  const resetCamera3d = () => {
    setYaw3d(DEFAULT_YAW);
    setPitch3d(DEFAULT_PITCH);
  };

  // Filtered search list
  const filteredWords = EMBEDDING_DATASET.filter((item) =>
    item.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hovered2dInfo = hoveredWord2d
    ? EMBEDDING_DATASET.find((w) => w.word === hoveredWord2d)
    : null;
  const hovered3dInfo = hoveredWord3d
    ? neighbors.find((w) => w.word === hoveredWord3d)
    : null;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-2">
            <span>Open Source Project Deep Dive</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight m-0 text-foreground">
            Word Embeddings Visualizer (contains in primitives file under components)
          </h2>
        </div>
        <a
          href="https://github.com/rohitrawat/embeddings_visualizer.git"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border hover:border-blue-500/50 hover:bg-surface-elevated transition-colors text-foreground not-prose shadow-sm"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>rohitrawat/embeddings_visualizer</span>
        </a>
      </div>

      <p className="text-foreground-muted text-base leading-relaxed mb-8">
        This section provides an interactive, full-stack architectural breakdown of Rohit Rawat&apos;s{" "}
        <a
          href="https://github.com/rohitrawat/embeddings_visualizer.git"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline underline-offset-4"
        >
          embeddings_visualizer
        </a>{" "}
        library. It explores how 50-dimensional word representations (from GloVe) are transformed,
        indexed via metric trees, and projected from high-dimensional spaces to linked 2D and 3D
        interactive exploratory canvases.
      </p>

      {/* Step Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 not-prose border-b border-border pb-3">
        {[
          { id: 1, title: "1. Vector Ingestion (GloVe)", subtitle: "50-D Space" },
          { id: 2, title: "2. t-SNE Reduction", subtitle: "50D → 2D/3D" },
          { id: 3, title: "3. Metric Indexing", subtitle: "k-NN Ball Tree" },
          { id: 4, title: "4. Dual Drilldown", subtitle: "2D ↔ 3D Link" },
          { id: 5, title: "5. Code Pipeline", subtitle: "Jupyter & ipympl" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStepTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-left border transition-all cursor-pointer ${activeStepTab === tab.id
              ? "bg-blue-600/15 border-blue-500 text-blue-400 font-semibold shadow-sm"
              : "bg-surface border-border text-foreground-muted hover:border-border-hover hover:text-foreground"
              }`}
          >
            <div className="text-xs font-semibold">{tab.title}</div>
            <div className="text-[11px] opacity-70">{tab.subtitle}</div>
          </button>
        ))}
      </div>

      {/* Step-by-Step Educational Cards */}
      <div className="mb-8 p-6 rounded-2xl border border-border bg-surface not-prose shadow-sm">
        {activeStepTab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h3 className="text-xl font-bold text-foreground m-0">
                High-Dimensional Vector Ingestion &amp; Representation (GloVe)
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              The visualizer loads pre-trained word embeddings from Stanford&apos;s GloVe (Global Vectors for
              Word Representation). Words are encoded as continuous vector embeddings in{" "}
              <MathBlock tex={String.raw`\mathbb{R}^{50}`} inline /> capturing semantic, syntactic, and analogical
              relationships:
            </p>
            <div className="p-4 rounded-xl bg-surface-elevated border border-border font-mono text-xs overflow-x-auto">
              <span className="text-blue-400"># Input Data Format: space-delimited text file (data/vectors_5000.txt)</span>
              <br />
              the 0.702965 -0.093212 -0.421502 -0.430059 -0.464135 ... (50 dimensions)
              <br />
              of 0.884634 0.203253 0.157106 -0.956004 -0.728619 ... (50 dimensions)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Mathematical Formulation</h4>
                <p className="text-xs text-foreground-muted mb-2">
                  The embedding matrix <MathBlock tex={String.raw`\mathbf{X} \in \mathbb{R}^{N \times D}`} inline /> stores{" "}
                  <MathBlock tex={String.raw`N = 5000`} inline /> vocabulary words across{" "}
                  <MathBlock tex={String.raw`D = 50`} inline /> orthogonal semantic axes:
                </p>
                <MathBlock tex={String.raw`\mathbf{X} = \begin{bmatrix} \mathbf{v}_1^\top \\ \mathbf{v}_2^\top \\ \vdots \\ \mathbf{v}_N^\top \end{bmatrix} \in \mathbb{R}^{5000 \times 50}, \quad \mathbf{v}_i = [v_{i,1}, v_{i,2}, \dots, v_{i,50}]^\top`} />
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">How it is handled in the repo</h4>
                <p className="text-xs text-foreground-muted mb-2">
                  Parsed directly with Pandas into a string vocabulary array and a NumPy float matrix:
                </p>
                <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-emerald-400">
                  {`import pandas as pd
vectors = pd.read_csv('data/vectors_5000.txt',
                      delimiter=' ',
                      header=None).as_matrix()
words = vectors[:, 0]     # Shape: (5000,)
vectors = vectors[:, 1:]   # Shape: (5000, 50)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h3 className="text-xl font-bold text-foreground m-0 flex items-center">
                Non-Linear Dimensionality Reduction via t-SNE (50D → 2D &amp; 3D)
                <InfoTip text="t-SNE turns each 50-number vector into a 2D or 3D point, trying to keep words that were close in the original space close on screen — so you can actually look at it." />
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              Because 50-dimensional spaces cannot be rendered directly onto human displays, Rohit Rawat&apos;s project
              applies <strong>t-Distributed Stochastic Neighbor Embedding (t-SNE)</strong>. Unlike linear PCA,
              t-SNE preserves local manifold structures, keeping semantically similar words tightly grouped.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">High-D to Low-D Probabilities</h4>
                <p className="text-xs text-foreground-muted mb-1">
                  High-D joint probability <MathBlock tex={String.raw`p_{j|i}`} inline /> (Gaussian distribution):
                </p>
                <MathBlock tex={String.raw`p_{j|i} = \frac{\exp(-\|\mathbf{x}_i - \mathbf{x}_j\|^2 / 2\sigma_i^2)}{\sum_{k \neq i}\exp(-\|\mathbf{x}_i - \mathbf{x}_k\|^2 / 2\sigma_i^2)}`} />
                <p className="text-xs text-foreground-muted mb-1 mt-2">
                  Low-D map <MathBlock tex={String.raw`q_{ij}`} inline /> (Student-t distribution, heavy tails):
                </p>
                <MathBlock tex={String.raw`q_{ij} = \frac{(1 + \|\mathbf{y}_i - \mathbf{y}_j\|^2)^{-1}}{\sum_{k}\sum_{l \neq k}(1 + \|\mathbf{y}_k - \mathbf{y}_l\|^2)^{-1}}`} />
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Repo Implementation &amp; Caching</h4>
                <p className="text-xs text-foreground-muted mb-2">
                  Computes both 2D and 3D embeddings with perplexity 15, then serializes them to text files to avoid
                  expensive re-computation:
                </p>
                <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-purple-400">
                  {`from sklearn.manifold import TSNE

# 2D projection
m2d = TSNE(n_components=2, random_state=0, perplexity=15)
X_tsne_2d = m2d.fit_transform(vectors)
np.savetxt('tsne_2d.txt', X_tsne_2d)

# 3D projection
m3d = TSNE(n_components=3, random_state=0, perplexity=15)
X_tsne_3d = m3d.fit_transform(vectors)
np.savetxt('tsne_3d.txt', X_tsne_3d)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h3 className="text-xl font-bold text-foreground m-0 flex items-center">
                Spatial Indexing &amp; Fast k-Nearest Neighbors (Ball Tree)
                <InfoTip text="k-NN means 'k nearest neighbors' — the k closest words to whatever you selected. A Ball Tree is just a way of organizing the vectors ahead of time so finding those k neighbors is fast, even with thousands of words." />
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              To achieve real-time response when clicking in a dense cloud of 5,000 words, the library indexes
              the vectors into a <strong>BallTree metric spatial data structure</strong>, reducing query time from
              exhaustive <MathBlock tex={String.raw`O(N)`} inline /> to <MathBlock tex={String.raw`O(\log N)`} inline />.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Metric Space Equations</h4>
                <p className="text-xs text-foreground-muted mb-1">
                  Euclidean distance in <MathBlock tex={String.raw`\mathbb{R}^D`} inline />:
                </p>
                <MathBlock tex={String.raw`d(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2 = \sqrt{\sum_{k=1}^D (u_k - v_k)^2}`} />
                <p className="text-xs text-foreground-muted mb-1 mt-2">
                  Cosine distance for directional alignment:
                </p>
                <MathBlock tex={String.raw`d_{\cos}(\mathbf{u}, \mathbf{v}) = 1 - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}`} />
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Nearest Neighbors Search in Repo</h4>
                <p className="text-xs text-foreground-muted mb-2">
                  Queries the index with a word vector or clicked coordinate:
                </p>
                <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-amber-400">
                  {`from sklearn.neighbors import NearestNeighbors

NN_model = NearestNeighbors(n_neighbors=15,
                            algorithm='ball_tree').fit(vectors)

# Querying word index (e.g. 'interface')
idx = words.index('interface')
distances, indices = NN_model.kneighbors(
    [vectors[idx, :]], n_neighbors=10
)
# Returns: ['user', 'application', 'hardware',
#           'capabilities', 'device', 'platform']`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h3 className="text-xl font-bold text-foreground m-0">
                Interactive Dual Drill-Down &amp; Cross-Dimensional Projection
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              The signature feature of Rohit Rawat&apos;s tool is its <strong>dual-subplot synchronized event architecture</strong>:
              clicking any point on the global 2D scatter plot triggers an event listener that isolates the
              local neighborhood and re-renders it in a dedicated 2D or 3D sub-view with labeled text tags and outlier filtering.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Adaptive Outlier Rejection</h4>
                <p className="text-xs text-foreground-muted mb-1">
                  To prevent cluttering the zoomed view with distant words, the repository applies dynamic distance thresholding:
                </p>
                <MathBlock tex={String.raw`\bar{d}_{\text{local}} = \frac{1}{5} \sum_{i=2}^6 d_i, \quad \text{Keep words where: } d_i \le 2 \cdot \bar{d}_{\text{local}}`} />
                <p className="text-xs text-foreground-muted mt-2">
                  Additionally, a slight random spatial jitter <MathBlock tex={String.raw`\delta \sim \mathcal{U}(0, 0.5)`} inline /> is applied to text labels to prevent visual occlusion.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Event Listener Implementation</h4>
                <p className="text-xs text-foreground-muted mb-2">
                  Using Matplotlib canvas event connections (`mpl_connect`):
                </p>
                <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-pink-400">
                  {`def onclick_2d_interactive(event):
    if event.inaxes == ax_zoom: return
    # Find neighbors of clicked point
    distances, indices = NN_model.kneighbors(
        [[event.xdata, event.ydata]], n_neighbors=15
    )
    # Clear & re-plot neighborhood in 3D sub-axis
    ax_zoom.clear()
    ax_zoom.scatter(vectors_3d[indices,0],
                    vectors_3d[indices,1],
                    vectors_3d[indices,2])
    for i in indices[0]:
        ax_zoom.text(x=vectors_3d[i,0],
                     y=vectors_3d[i,1],
                     z=vectors_3d[i,2], s=words[i])
    # Highlight selection on main overview
    ax.scatter(vectors[indices,0], vectors[indices,1], c='g')

fig.canvas.mpl_connect('button_press_event', onclick_2d_interactive)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                5
              </span>
              <h3 className="text-xl font-bold text-foreground m-0">
                Complete Code Structure &amp; Library Architecture
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              The entire project is structured inside a clean, reproducible Jupyter Notebook workflow utilizing{" "}
              <code className="text-blue-400">ipympl</code> for interactive WebGL/Canvas rendering directly in browser environments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
                <div className="font-semibold text-xs text-blue-400 mb-1">`plot_words_2d`</div>
                <p className="text-xs text-foreground-muted">
                  Static 2D visualization of points and text labels for inspecting raw 2D projections.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
                <div className="font-semibold text-xs text-purple-400 mb-1">`plot_words_3d`</div>
                <p className="text-xs text-foreground-muted">
                  Static 3D projection using Matplotlib <code className="text-xs">Axes3D</code> with free rotation.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
                <div className="font-semibold text-xs text-pink-400 mb-1">`plot_words_2d_interactive`</div>
                <p className="text-xs text-foreground-muted">
                  Dual-panel interactive projector linking 2D overview to zoomed 2D/3D neighborhood subplots.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Interactive Visualization Panel */}
      <div className="rounded-2xl border border-border bg-surface p-5 not-prose shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground m-0 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Interactive Embeddings Projector Simulation
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Click any point on the 2D global map or search for a word below to trigger real-time{" "}
              <MathBlock tex={String.raw`k`} inline />-NN extraction and 3D neighborhood inspection. Hover any dot for a quick readout.
            </p>
          </div>

          {/* Preset Word Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-foreground-muted mr-1">Presets:</span>
            {["interface", "quantum", "king", "galaxy", "football", "wolf"].map((preset) => (
              <button
                key={preset}
                onClick={() => setSelectedWord(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors cursor-pointer ${selectedWord === preset
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-surface-elevated text-foreground border-border hover:border-blue-400"
                  }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Plain-English summary of the current selection */}
        <div className="mb-4 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-foreground flex flex-wrap items-center gap-1.5">
          <span>
            You&apos;re looking at <span className="font-mono font-bold text-blue-400">{currentEmbedding.word}</span>
            {" "}— part of the <strong>{CLUSTER_COLORS[currentEmbedding.cluster]?.name}</strong> domain.
          </span>
          {closestNeighbor && (
            <span>
              Its closest neighbor is <span className="font-mono font-bold text-blue-400">{closestNeighbor.word}</span>, about{" "}
              <span className="font-semibold">{toSimilarityPct(closestNeighbor.distance, metric)}% similar</span> under the {metric} metric.
            </span>
          )}
        </div>

        {/* Interactive Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3.5 rounded-xl bg-surface-elevated border border-border">
          {/* Word Search / Autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-foreground-muted mb-1">
              Search Embedding Word:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedWord}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:border-blue-500 outline-none text-foreground"
              />
              {searchQuery && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-36 overflow-y-auto bg-surface-elevated border border-border rounded-lg shadow-xl z-20">
                  {filteredWords.map((item) => (
                    <button
                      key={item.word}
                      onClick={() => {
                        setSelectedWord(item.word);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-500/20 text-foreground flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-mono">{item.word}</span>
                      <span className="text-[10px] text-foreground-muted">{item.cluster}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* k-Neighbors Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-foreground-muted mb-1">
              <span className="flex items-center">
                Neighbors (<MathBlock tex={String.raw`k`} inline />):
                <InfoTip text="How many of the closest words to show. A higher k casts a wider net but can pull in less-related words." />
              </span>
              <span className="font-mono text-foreground font-bold">{kNeighbors}</span>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              step={1}
              value={kNeighbors}
              onChange={(e) => setKNeighbors(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-blue-500"
            />
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground-muted mb-1 flex items-center">
              Distance Metric:
              <InfoTip text="Euclidean measures straight-line distance between vectors. Cosine measures the angle between them, ignoring magnitude — often better for comparing meaning." />
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setMetric("euclidean")}
                className={`py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${metric === "euclidean"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-surface text-foreground-muted border-border hover:text-foreground"
                  }`}
              >
                Euclidean (<MathBlock tex={String.raw`L_2`} inline />)
              </button>
              <button
                onClick={() => setMetric("cosine")}
                className={`py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${metric === "cosine"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-surface text-foreground-muted border-border hover:text-foreground"
                  }`}
              >
                Cosine (<MathBlock tex={String.raw`\cos \theta`} inline />)
              </button>
            </div>
          </div>

          {/* Active Word Stats */}
          <div className="flex flex-col justify-center">
            <div className="text-xs font-semibold text-foreground-muted mb-0.5">Active Target:</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-blue-400">{currentEmbedding.word}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {currentEmbedding.cluster}
              </span>
            </div>
          </div>
        </div>

        {/* Word Analogy Playground */}
        <div className="mb-5 p-4 rounded-xl border border-border bg-surface-elevated">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h4 className="text-sm font-bold text-foreground m-0 flex items-center">
              Word Analogy Playground
              <InfoTip text="Embeddings support arithmetic: subtracting one word's vector and adding another's shifts meaning. Classic example: king − man + woman ≈ queen. Pick three words and see what lands closest to the result." />
            </h4>
            <span className="text-[11px] text-foreground-muted">Vector math: A − B + C ≈ ?</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={analogyA}
              onChange={(e) => setAnalogyA(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-background border border-border text-foreground focus:border-blue-500 outline-none"
            >
              {EMBEDDING_DATASET.map((w) => (
                <option key={w.word} value={w.word}>{w.word}</option>
              ))}
            </select>
            <span className="text-foreground-muted text-sm font-bold">−</span>
            <select
              value={analogyB}
              onChange={(e) => setAnalogyB(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-background border border-border text-foreground focus:border-blue-500 outline-none"
            >
              {EMBEDDING_DATASET.map((w) => (
                <option key={w.word} value={w.word}>{w.word}</option>
              ))}
            </select>
            <span className="text-foreground-muted text-sm font-bold">+</span>
            <select
              value={analogyC}
              onChange={(e) => setAnalogyC(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-background border border-border text-foreground focus:border-blue-500 outline-none"
            >
              {EMBEDDING_DATASET.map((w) => (
                <option key={w.word} value={w.word}>{w.word}</option>
              ))}
            </select>
            <span className="text-foreground-muted text-sm font-bold">≈</span>
            <span className="text-xs text-foreground-muted italic">closest matches below</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {analogyResults.map((res, idx) => (
              <button
                key={res.word}
                onClick={() => setSelectedWord(res.word)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${idx === 0
                  ? "bg-blue-600/15 border-blue-500"
                  : "bg-background border-border hover:border-blue-400"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-foreground">{res.word}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CLUSTER_COLORS[res.cluster]?.bg }}
                  />
                </div>
                <div className="text-[11px] text-foreground-muted mt-0.5">
                  {idx === 0 ? "Best match" : `#${idx + 1} match`} · {toSimilarityPct(res.distance, metric)}% similar
                </div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-foreground-muted mt-2.5">
            Click a result to jump the map below to that word. Try{" "}
            <button className="underline underline-offset-2 hover:text-blue-400" onClick={() => { setAnalogyA("king"); setAnalogyB("queen"); setAnalogyC("wolf"); }}>king − queen + wolf</button>
            {" "}or{" "}
            <button className="underline underline-offset-2 hover:text-blue-400" onClick={() => { setAnalogyA("galaxy"); setAnalogyB("star"); setAnalogyC("lion"); }}>galaxy − star + lion</button>.
          </p>
        </div>

        {/* Dual Canvas Layout: 2D Overview ↔ 3D Zoomed Neighborhood */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Left Canvas: 2D Global t-SNE Scatter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Global 2D Projection (<MathBlock tex={String.raw`\mathbf{X}_{\text{tsne\_2d}}`} inline />)
              </span>
              <span className="text-[11px] text-foreground-muted/70">Click to select · hover for details</span>
            </div>
            <div className="relative rounded-xl border border-border bg-background/60 overflow-hidden">
              <canvas
                ref={canvas2dRef}
                width={500}
                height={360}
                onClick={handleCanvas2dClick}
                onMouseMove={handleCanvas2dMove}
                onMouseLeave={handleCanvas2dLeave}
                className="w-full h-[320px] sm:h-[360px] cursor-crosshair block"
              />
              {hovered2dInfo && (
                <div
                  className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-lg bg-background border border-border shadow-xl text-[11px] leading-snug"
                  style={{ left: Math.min(tooltipPos2d.x + 12, 340), top: Math.max(tooltipPos2d.y - 44, 4) }}
                >
                  <div className="font-mono font-semibold text-foreground">{hovered2dInfo.word}</div>
                  <div className="text-foreground-muted">
                    {CLUSTER_COLORS[hovered2dInfo.cluster]?.name}
                    {hovered2dInfo.word !== currentEmbedding.word && (
                      <> · {toSimilarityPct(distFn(currentEmbedding.highDim, hovered2dInfo.highDim), metric)}% similar</>
                    )}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] text-foreground-muted border border-border">
                Showing {EMBEDDING_DATASET.filter((w) => !hiddenClusters.has(w.cluster)).length} of 42 semantic word vectors
              </div>
            </div>
          </div>

          {/* Right Canvas: 3D Neighborhood Subplot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Zoomed 3D Neighborhood (<MathBlock tex={String.raw`\mathbf{X}_{\text{tsne\_3d}}`} inline />)
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-foreground-muted/70">Drag to rotate · hover for details</span>
                <button
                  onClick={resetCamera3d}
                  className="text-[10px] px-2 py-0.5 rounded-md border border-border text-foreground-muted hover:text-foreground hover:border-blue-400 transition-colors cursor-pointer"
                >
                  Reset view
                </button>
              </span>
            </div>
            <div className="relative rounded-xl border border-border bg-background/60 overflow-hidden">
              <canvas
                ref={canvas3dRef}
                width={500}
                height={360}
                onPointerDown={onPointerDown3d}
                onPointerMove={handleCanvas3dMove}
                onPointerUp={stopDrag3d}
                onPointerLeave={handleCanvas3dLeave}
                className="w-full h-[320px] sm:h-[360px] cursor-grab active:cursor-grabbing touch-none block"
              />
              {hovered3dInfo && (
                <div
                  className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-lg bg-background border border-border shadow-xl text-[11px] leading-snug"
                  style={{ left: Math.min(tooltipPos3d.x + 12, 340), top: Math.max(tooltipPos3d.y - 44, 4) }}
                >
                  <div className="font-mono font-semibold text-foreground">{hovered3dInfo.word}</div>
                  <div className="text-foreground-muted">
                    {CLUSTER_COLORS[hovered3dInfo.cluster]?.name}
                    {hovered3dInfo.word !== currentEmbedding.word && (
                      <> · {toSimilarityPct(hovered3dInfo.distance, metric)}% similar</>
                    )}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] text-foreground-muted border border-border">
                Rotatable 3D Subspace • Central Query: <strong className="text-red-400 font-mono">{currentEmbedding.word}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Cluster Legend & Nearest Neighbor Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Cluster Legend (interactive filter) */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-1">
              Semantic Domains &amp; Clusters
            </h4>
            <p className="text-[11px] text-foreground-muted/80 mb-2.5">Click a domain to hide or show it on the 2D map.</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {Object.entries(CLUSTER_COLORS).map(([key, info]) => {
                const count = EMBEDDING_DATASET.filter((w) => w.cluster === key).length;
                const isHidden = hiddenClusters.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCluster(key)}
                    className={`flex items-center gap-2 px-1.5 py-1 rounded-md text-left cursor-pointer transition-opacity hover:opacity-100 ${isHidden ? "opacity-40" : "opacity-100"
                      }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: info.bg }} />
                    <span className="text-foreground-muted truncate">{info.name}</span>
                    <span className="text-[10px] text-foreground-muted/60 ml-auto font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nearest Neighbors Ranked Table */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2.5 flex items-center justify-between">
              <span>Extracted <MathBlock tex={String.raw`k`} inline />-Nearest Neighbors</span>
              <span className="text-[11px] font-mono text-blue-400">Metric: {metric}</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {neighbors.map((nbr, idx) => (
                <div
                  key={nbr.word}
                  onClick={() => setSelectedWord(nbr.word)}
                  className={`flex items-center justify-between px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${nbr.word === currentEmbedding.word
                    ? "bg-red-500/15 text-red-300 font-semibold border border-red-500/30"
                    : "hover:bg-surface text-foreground border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-foreground-muted w-4">
                      #{idx}
                    </span>
                    <span className="font-mono">{nbr.word}</span>
                    <span className="text-[10px] text-foreground-muted/70">({nbr.cluster})</span>
                  </div>
                  <div className="font-mono text-[11px] text-foreground-muted">
                    {idx === 0 ? "Target (100%)" : `${toSimilarityPct(nbr.distance, metric)}% · d=${nbr.distance.toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}