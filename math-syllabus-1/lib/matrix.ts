/**
 * Matrix and vector math utilities.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Matrix2x2 {
  a: number; // [0, 0]
  b: number; // [0, 1]
  c: number; // [1, 0]
  d: number; // [1, 1]
}

export function transform2D(m: Matrix2x2, v: Vector2D): Vector2D {
  return {
    x: m.a * v.x + m.b * v.y,
    y: m.c * v.x + m.d * v.y,
  };
}

export function dot2D(u: Vector2D, v: Vector2D): number {
  return u.x * v.x + u.y * v.y;
}

export function norm2D(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
