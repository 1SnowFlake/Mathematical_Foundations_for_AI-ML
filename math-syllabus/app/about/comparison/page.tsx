"use client";

import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Comparison data                                                    */
/* ------------------------------------------------------------------ */

interface ComparisonRow {
  feature: string;
  ours: string;
  tfPlayground: string;
  seeingTheory: string;
  cnnExplainer: string;
  geogebra: string;
  brilliant: string;
}

const ROWS: ComparisonRow[] = [
  {
    feature: "Scope",
    ours: "Full AI/Math/ML syllabus (37 topics across 10 sections)",
    tfPlayground: "Neural nets only",
    seeingTheory: "Probability & statistics",
    cnnExplainer: "CNNs only",
    geogebra: "General mathematics",
    brilliant: "General STEM",
  },
  {
    feature: "Interactivity",
    ours: "Drag, step-through, parameter tuning, live computation",
    tfPlayground: "Drag + train model",
    seeingTheory: "Click-based animations",
    cnnExplainer: "Hover to inspect layers",
    geogebra: "Drag + construct geometry",
    brilliant: "Quiz-based learning",
  },
  {
    feature: "Algorithm Viz",
    ours: "BFS, DFS, Dijkstra, A*, Minimax, α-β, Gradient Descent, Backprop",
    tfPlayground: "1 neural net model",
    seeingTheory: "None",
    cnnExplainer: "1 CNN architecture",
    geogebra: "None",
    brilliant: "Conceptual only",
  },
  {
    feature: "Math Rendering",
    ours: "KaTeX (inline + block LaTeX)",
    tfPlayground: "None",
    seeingTheory: "Static text",
    cnnExplainer: "None",
    geogebra: "Built-in equation editor",
    brilliant: "Pre-rendered images",
  },
  {
    feature: "3D Visualizations",
    ours: "✅ Plotly.js surfaces, contour maps",
    tfPlayground: "❌",
    seeingTheory: "❌",
    cnnExplainer: "❌",
    geogebra: "✅ GeoGebra 3D",
    brilliant: "❌",
  },
  {
    feature: "Open Source",
    ours: "✅ Fully open source",
    tfPlayground: "✅ Open source",
    seeingTheory: "✅ (unmaintained since 2019)",
    cnnExplainer: "✅ Open source",
    geogebra: "Partially open",
    brilliant: "❌ Proprietary",
  },
  {
    feature: "Mobile-Friendly",
    ours: "✅ Responsive + touch support",
    tfPlayground: "⚠️ Desktop-first",
    seeingTheory: "❌ Not mobile-friendly",
    cnnExplainer: "⚠️ Limited",
    geogebra: "✅ Has mobile apps",
    brilliant: "✅ Native apps",
  },
  {
    feature: "Dark Mode",
    ours: "✅ Full dark/light theming",
    tfPlayground: "❌",
    seeingTheory: "❌",
    cnnExplainer: "❌",
    geogebra: "❌",
    brilliant: "✅",
  },
  {
    feature: "Progress Tracking",
    ours: "✅ Built-in (localStorage)",
    tfPlayground: "❌",
    seeingTheory: "❌",
    cnnExplainer: "❌",
    geogebra: "Via account login",
    brilliant: "✅ (paid subscription)",
  },
  {
    feature: "Cost",
    ours: "Free",
    tfPlayground: "Free",
    seeingTheory: "Free",
    cnnExplainer: "Free",
    geogebra: "Free / Paid premium",
    brilliant: "Paid subscription",
  },
  {
    feature: "Tech Stack",
    ours: "Next.js 16, TypeScript, Tailwind v4, React 19",
    tfPlayground: "TypeScript, D3.js (2016)",
    seeingTheory: "D3.js (2019, unmaintained)",
    cnnExplainer: "Svelte, D3.js",
    geogebra: "Java / GWT",
    brilliant: "React Native",
  },
];

const DIFFERENTIATORS = [
  {
    icon: "🎯",
    title: "Unified Syllabus",
    desc: "No other platform covers Linear Algebra → Calculus → Probability → Graph Theory → Neural Networks → Deep Learning → Transformers in a single interactive app. Competitors focus on one domain only.",
  },
  {
    icon: "⏯️",
    title: "Step-by-Step Algorithm Playback",
    desc: "The GraphEditor produces AlgorithmStep[] arrays enabling VCR-style play/pause/step controls with color-coded states. This level of algorithm inspection is unique among web-based educational tools.",
  },
  {
    icon: "🧩",
    title: "Componentized Architecture",
    desc: "6 reusable primitives (VectorCanvas, GraphEditor, Surface3D, MathBlock, ParamPanel, EmbedFrame) allow any new topic to be added in hours, not days. Most competitors are monolithic codebases.",
  },
  {
    icon: "⚡",
    title: "Modern Stack",
    desc: "Next.js 16 + React 19 + Tailwind v4 + TypeScript strict. TensorFlow Playground dates from 2016, Seeing Theory from 2019 (unmaintained). This project uses the latest frameworks and practices.",
  },
  {
    icon: "🌗",
    title: "Full Accessibility",
    desc: "Dark mode, responsive design, touch-friendly interactions, semantic HTML. Most competitor tools are desktop-only with no dark mode support.",
  },
  {
    icon: "📈",
    title: "Built-in Progress Tracking",
    desc: "Track visited and completed topics with a visual dashboard — no account required. No free competitor offers this. Brilliant charges a subscription.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const COLS = ["This Project", "TF Playground", "Seeing Theory", "CNN Explainer", "GeoGebra", "Brilliant"];

export default function ComparisonPage() {
  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      <section className="hero-bg-gradient rounded-2xl px-8 py-10 text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="hero-gradient">Competitive Analysis</span>
        </h1>
        <p className="text-foreground-muted text-base max-w-2xl mx-auto m-0">
          How this project compares to existing interactive math &amp; ML platforms
        </p>
      </section>

      {/* Feature Comparison Table */}
      <h2>Feature Comparison</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="comparison-table not-prose">
          <thead>
            <tr>
              <th>Feature</th>
              {COLS.map((col, i) => (
                <th key={col} className={i === 0 ? "highlight-col" : ""}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature}>
                <td style={{ fontWeight: 600, color: "var(--foreground)" }}>{row.feature}</td>
                <td className="highlight-col">{row.ours}</td>
                <td>{row.tfPlayground}</td>
                <td>{row.seeingTheory}</td>
                <td>{row.cnnExplainer}</td>
                <td>{row.geogebra}</td>
                <td>{row.brilliant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Differentiators */}
      <h2>Key Differentiators</h2>
      <div className="grid gap-4 sm:grid-cols-2 not-prose">
        {DIFFERENTIATORS.map((d, i) => (
          <div key={d.title} className={`section-card animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}>
            <div className="text-2xl mb-2">{d.icon}</div>
            <h3 className="text-sm font-semibold text-foreground mb-1" style={{ margin: 0 }}>{d.title}</h3>
            <p className="text-xs text-foreground-muted leading-relaxed" style={{ margin: 0 }}>{d.desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                     border no-underline"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          ← Back to About
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                     text-white no-underline"
          style={{ background: "var(--accent)" }}
        >
          🚀 Explore Topics
        </Link>
      </div>
    </div>
  );
}
