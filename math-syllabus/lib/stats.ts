/**
 * Statistical distribution functions for probability visualizations.
 * Pure TypeScript implementations — no external stats library needed
 * for the handful of distributions we visualize.
 */

/** Normal (Gaussian) probability density function */
export function normalPDF(x: number, mean: number = 0, stddev: number = 1): number {
  const variance = stddev * stddev;
  const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
  const exponent = -((x - mean) ** 2) / (2 * variance);
  return coefficient * Math.exp(exponent);
}

/**
 * Normal CDF via the error function approximation.
 * Uses Abramowitz & Stegun approximation (max error ~1.5×10⁻⁷).
 */
export function normalCDF(x: number, mean: number = 0, stddev: number = 1): number {
  const z = (x - mean) / stddev;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Error function approximation (Abramowitz & Stegun formula 7.1.26) */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-(x * x)));
}

/** Binomial probability mass function: P(X = k) */
export function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/** Binomial coefficient C(n, k) — iterative to avoid overflow for reasonable n */
function binomialCoeff(n: number, k: number): number {
  if (k > n - k) k = n - k; // Symmetry optimization
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/** Poisson probability mass function: P(X = k) */
export function poissonPMF(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/** Factorial with memoization — safe for k ≤ 170 (beyond that JS loses precision) */
const factorialCache: number[] = [1, 1];
function factorial(n: number): number {
  if (factorialCache[n] !== undefined) return factorialCache[n];
  let result = factorialCache[factorialCache.length - 1];
  for (let i = factorialCache.length; i <= n; i++) {
    result *= i;
    factorialCache[i] = result;
  }
  return result;
}

/** Exponential PDF: f(x) = λ * e^(-λx) for x ≥ 0 */
export function exponentialPDF(x: number, lambda: number): number {
  if (x < 0) return 0;
  return lambda * Math.exp(-lambda * x);
}

/** Uniform PDF on [a, b] */
export function uniformPDF(x: number, a: number, b: number): number {
  if (x < a || x > b) return 0;
  return 1 / (b - a);
}

/**
 * Generate an array of {x, y} points for plotting a continuous distribution.
 * @param pdf - The PDF function taking a single x value
 * @param xMin - Start of range
 * @param xMax - End of range
 * @param numPoints - Number of sample points
 */
export function samplePDF(
  pdf: (x: number) => number,
  xMin: number,
  xMax: number,
  numPoints: number = 200
): Array<{ x: number; y: number }> {
  const step = (xMax - xMin) / (numPoints - 1);
  return Array.from({ length: numPoints }, (_, i) => {
    const x = xMin + i * step;
    return { x, y: pdf(x) };
  });
}

/**
 * Generate PMF bar data for discrete distributions.
 * @param pmf - The PMF function taking an integer k
 * @param kMin - Minimum k value
 * @param kMax - Maximum k value
 */
export function samplePMF(
  pmf: (k: number) => number,
  kMin: number,
  kMax: number
): Array<{ k: number; p: number }> {
  return Array.from({ length: kMax - kMin + 1 }, (_, i) => {
    const k = kMin + i;
    return { k, p: pmf(k) };
  });
}
