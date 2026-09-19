import { Vec3, iso } from "./vectorMath3d";

export default function IsoVector({
  v,
  color,
  label,
  opacity = 1,
  dashed = false,
  delay = 0,
  width = 3,
}: {
  v: Vec3;
  color: string;
  label?: string;
  opacity?: number;
  dashed?: boolean;
  delay?: number;
  width?: number;
}) {
  const end = iso(v.x, v.y, v.z);
  const start = iso(0, 0, 0);
  const angleDeg = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
  return (
    <g style={{ opacity, transition: `opacity 0.5s ease-in-out ${delay}s, transform 0.5s ease` }}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "5,5" : "none"}
        className="transition-all duration-700"
      />
      <polygon
        points="0,-4 8,0 0,4"
        fill={color}
        transform={`translate(${end.x}, ${end.y}) rotate(${angleDeg})`}
      />
      {label && (
        <text x={end.x + 10} y={end.y - 10} fill={color} fontSize="14" fontWeight="bold">
          {label}
        </text>
      )}
    </g>
  );
}
