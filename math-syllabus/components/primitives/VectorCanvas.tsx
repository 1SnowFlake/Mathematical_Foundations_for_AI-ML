"use client";

import { useCallback, useRef, useState } from "react";
import type { Vector2D } from "@/lib/matrix";

export interface VectorDef {
  id: string;
  /** Endpoint of the vector (from origin) */
  point: Vector2D;
  /** Display color */
  color: string;
  /** Whether this vector can be dragged */
  draggable?: boolean;
  /** Optional label displayed near the point */
  label?: string;
}

interface VectorCanvasProps {
  /** Width of the SVG canvas in pixels */
  width?: number;
  /** Height of the SVG canvas in pixels */
  height?: number;
  /** Vectors to display */
  vectors: VectorDef[];
  /** Called when a draggable vector's endpoint changes */
  onVectorChange?: (id: string, point: Vector2D) => void;
  /** Coordinate range: how many units from center to edge */
  gridRange?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show axis labels */
  showLabels?: boolean;
  /** Additional SVG children (for overlays like transformed shapes) */
  children?: React.ReactNode;
}

/**
 * SVG-based 2D coordinate canvas for vector visualization.
 * Supports draggable points via pointer events (works on touch and mouse).
 * Base primitive for nearly all Linear Algebra widgets.
 *
 * Coordinate system: math-standard (y points up, origin at center).
 */
export default function VectorCanvas({
  width = 400,
  height = 400,
  vectors,
  onVectorChange,
  gridRange = 5,
  showGrid = true,
  showLabels = true,
  children,
}: VectorCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Convert math coords to SVG pixel coords
  const scale = Math.min(width, height) / (2 * gridRange);
  const cx = width / 2;
  const cy = height / 2;

  const toSvg = useCallback(
    (p: Vector2D) => ({ x: cx + p.x * scale, y: cy - p.y * scale }),
    [cx, cy, scale]
  );

  const toMath = useCallback(
    (svgX: number, svgY: number): Vector2D => ({
      x: Math.round(((svgX - cx) / scale) * 10) / 10,
      y: Math.round(((cy - svgY) / scale) * 10) / 10,
    }),
    [cx, cy, scale]
  );

  // Pointer event handlers for dragging
  const handlePointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      setDragId(id);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragId || !svgRef.current || !onVectorChange) return;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const mathPt = toMath(svgPt.x, svgPt.y);

      // Clamp to grid range
      mathPt.x = Math.max(-gridRange, Math.min(gridRange, mathPt.x));
      mathPt.y = Math.max(-gridRange, Math.min(gridRange, mathPt.y));

      onVectorChange(dragId, mathPt);
    },
    [dragId, onVectorChange, toMath, gridRange]
  );

  const handlePointerUp = useCallback(() => setDragId(null), []);

  // Generate grid lines
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let i = -gridRange; i <= gridRange; i++) {
      const isAxis = i === 0;
      const stroke = isAxis ? "var(--foreground-muted)" : "var(--border)";
      const strokeWidth = isAxis ? 1.5 : 0.5;

      // Vertical line
      const vx = cx + i * scale;
      gridLines.push(
        <line
          key={`v${i}`}
          x1={vx}
          y1={0}
          x2={vx}
          y2={height}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

      // Horizontal line
      const hy = cy - i * scale;
      gridLines.push(
        <line
          key={`h${i}`}
          x1={0}
          y1={hy}
          x2={width}
          y2={hy}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );

      // Axis labels
      if (showLabels && i !== 0) {
        gridLines.push(
          <text
            key={`lx${i}`}
            x={vx}
            y={cy + 16}
            textAnchor="middle"
            fill="var(--foreground-subtle)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {i}
          </text>
        );
        gridLines.push(
          <text
            key={`ly${i}`}
            x={cx - 12}
            y={hy + 4}
            textAnchor="end"
            fill="var(--foreground-subtle)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {i}
          </text>
        );
      }
    }
  }

  // Arrow marker definition
  const arrowMarkerId = "vector-arrow";

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="select-none rounded-lg border border-border bg-surface"
      style={{ touchAction: "none", maxWidth: "100%" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="img"
      aria-label="2D vector canvas"
    >
      <defs>
        <marker
          id={arrowMarkerId}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Grid */}
      {gridLines}

      {/* Additional overlays (transformed shapes, etc.) */}
      {children}

      {/* Vectors */}
      {vectors.map((v) => {
        const origin = toSvg({ x: 0, y: 0 });
        const end = toSvg(v.point);

        return (
          <g key={v.id} style={{ color: v.color }}>
            {/* Vector line */}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              strokeWidth={2.5}
              markerEnd={`url(#${arrowMarkerId})`}
            />

            {/* Draggable endpoint */}
            <circle
              cx={end.x}
              cy={end.y}
              r={v.draggable ? 8 : 4}
              fill="currentColor"
              fillOpacity={v.draggable ? 0.2 : 1}
              stroke="currentColor"
              strokeWidth={2}
              style={{ cursor: v.draggable ? "grab" : "default" }}
              onPointerDown={v.draggable ? handlePointerDown(v.id) : undefined}
              role={v.draggable ? "slider" : undefined}
              aria-label={v.draggable ? `Drag vector ${v.label ?? v.id}` : undefined}
              tabIndex={v.draggable ? 0 : undefined}
            />

            {/* Label */}
            {(v.label || v.draggable) && (
              <text
                x={end.x + 12}
                y={end.y - 8}
                fill="currentColor"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fontWeight={600}
              >
                {v.label ?? v.id} ({v.point.x}, {v.point.y})
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
