export type Vec3 = { x: number; y: number; z: number };

export function mag3(v: Vec3) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function dot3(u: Vec3, v: Vec3) {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

export function sub3(u: Vec3, v: Vec3) {
  return { x: u.x - v.x, y: u.y - v.y, z: u.z - v.z };
}

export function scale3(v: Vec3, s: number) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function proj3(v: Vec3, u: Vec3) {
  const uMagSq = dot3(u, u);
  if (uMagSq < 1e-9) return { x: 0, y: 0, z: 0 };
  return scale3(u, dot3(v, u) / uMagSq);
}

export function normalize3(v: Vec3) {
  const m = mag3(v);
  if (m < 1e-9) return { x: 0, y: 0, z: 0 };
  return scale3(v, 1 / m);
}

/** Projects a 3D point onto a 2D isometric-style SVG coordinate. */
export function iso(x: number, y: number, z: number) {
  const angle = Math.PI / 6;
  const cx = 300;
  const cy = 250;
  const scale = 50;
  return {
    x: cx + (x - z) * Math.cos(angle) * scale,
    y: cy + (x + z) * Math.sin(angle) * scale - y * scale,
  };
}
