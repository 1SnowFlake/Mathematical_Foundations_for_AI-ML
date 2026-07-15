/**
 * Matrix and vector utilities for 2D linear algebra visualizations.
 * Thin typed wrappers — keeps the visualization code clean and avoids
 * spreading raw mathjs calls throughout components.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Matrix2x2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface TransformResult {
  original: Vector2D;
  transformed: Vector2D;
}

/** Multiply a 2×2 matrix by a 2D vector: M · v */
export function transformVector(m: Matrix2x2, v: Vector2D): Vector2D {
  return {
    x: m.a * v.x + m.b * v.y,
    y: m.c * v.x + m.d * v.y,
  };
}

/** 2×2 determinant */
export function determinant(m: Matrix2x2): number {
  return m.a * m.d - m.b * m.c;
}

/** Eigenvalues of a 2×2 matrix via the quadratic formula on the characteristic polynomial. */
export function eigenvalues(m: Matrix2x2): { lambda1: number; lambda2: number } | null {
  const trace = m.a + m.d;
  const det = determinant(m);
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) return null; // Complex eigenvalues — not handled in 2D real viz

  const sqrtDisc = Math.sqrt(discriminant);
  return {
    lambda1: (trace + sqrtDisc) / 2,
    lambda2: (trace - sqrtDisc) / 2,
  };
}

/** Rotation matrix for a given angle in radians */
export function rotationMatrix(theta: number): Matrix2x2 {
  return {
    a: Math.cos(theta),
    b: -Math.sin(theta),
    c: Math.sin(theta),
    d: Math.cos(theta),
  };
}

/** Uniform scaling matrix */
export function scaleMatrix(sx: number, sy: number): Matrix2x2 {
  return { a: sx, b: 0, c: 0, d: sy };
}

/** Reflection across the x-axis */
export function reflectX(): Matrix2x2 {
  return { a: 1, b: 0, c: 0, d: -1 };
}

/** Reflection across the y-axis */
export function reflectY(): Matrix2x2 {
  return { a: -1, b: 0, c: 0, d: 1 };
}

/** Reflection across the line y = x */
export function reflectYEqualsX(): Matrix2x2 {
  return { a: 0, b: 1, c: 1, d: 0 };
}

/** Dot product of two 2D vectors */
export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

/** Euclidean magnitude of a 2D vector */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** Angle between two 2D vectors in radians */
export function angleBetween(a: Vector2D, b: Vector2D): number {
  const cosTheta = dot(a, b) / (magnitude(a) * magnitude(b));
  // Clamp to [-1, 1] to avoid NaN from floating-point drift
  return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
}

/** Normalize a 2D vector to unit length */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/** Add two vectors */
export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Subtract: a - b */
export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** Scalar multiply */
export function scale(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

/** Project vector a onto vector b */
export function project(a: Vector2D, b: Vector2D): Vector2D {
  const scalar = dot(a, b) / dot(b, b);
  return scale(b, scalar);
}
