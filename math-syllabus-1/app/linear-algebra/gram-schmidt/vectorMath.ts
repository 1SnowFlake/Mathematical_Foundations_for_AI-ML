import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Shared 2D Vector Math Helpers                                      */
/* ------------------------------------------------------------------ */

export type Vec2 = { x: number; y: number };

export function mag(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dot(u: Vec2, v: Vec2): number {
  return u.x * v.x + u.y * v.y;
}

export function sub(u: Vec2, v: Vec2): Vec2 {
  return { x: u.x - v.x, y: u.y - v.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function proj(v: Vec2, u: Vec2): Vec2 {
  const uMagSq = dot(u, u);
  if (uMagSq < 1e-9) return { x: 0, y: 0 };
  const factor = dot(v, u) / uMagSq;
  return scale(u, factor);
}

export function normalize(v: Vec2): Vec2 {
  const m = mag(v);
  if (m < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / m, y: v.y / m };
}

export function angleBetween(u: Vec2, v: Vec2): number {
  const mU = mag(u);
  const mV = mag(v);
  if (mU < 1e-9 || mV < 1e-9) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot(u, v) / (mU * mV)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

// 2x2 Matrix Condition Number approximation (ratio of max to min singular value)
export function computeConditionNumber(v1: Vec2, v2: Vec2): number {
  const a = v1.x, b = v2.x, c = v1.y, d = v2.y;
  const ata11 = a * a + c * c;
  const ata12 = a * b + c * d;
  const ata22 = b * b + d * d;

  const trace = ata11 + ata22;
  const det = ata11 * ata22 - ata12 * ata12;

  const diff = Math.sqrt(Math.max(0, trace * trace - 4 * det));
  const lambda1 = (trace + diff) / 2;
  const lambda2 = (trace - diff) / 2;

  if (lambda2 < 1e-6) return 999.9;
  return Math.sqrt(lambda1 / lambda2);
}

export function useGramSchmidt(v1: Vec2, v2: Vec2) {
  return useMemo(() => {
    const u1 = v1;
    const projection = proj(v2, u1);
    const u2 = sub(v2, projection);
    const e1 = normalize(u1);
    const e2 = normalize(u2);
    return { u1, projection, u2, e1, e2, angle: angleBetween(e1, e2) };
  }, [v1, v2]);
}
