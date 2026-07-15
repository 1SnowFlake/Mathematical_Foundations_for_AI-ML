"use client";

import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Architecture Diagram (inline SVG)                                  */
/* ------------------------------------------------------------------ */

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 780 420" className="w-full" style={{ maxWidth: 780 }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--foreground-subtle)" />
        </marker>
      </defs>

      {/* Layer labels */}
      <text x="60" y="20" className="arch-label" style={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground-muted)" }}>
        ROUTING
      </text>
      <text x="60" y="160" className="arch-label" style={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground-muted)" }}>
        PRIMITIVES
      </text>
      <text x="60" y="310" className="arch-label" style={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground-muted)" }}>
        LIBRARIES
      </text>

      {/* Top layer — App Router */}
      <rect className="arch-node" x="160" y="30" width="200" height="50" />
      <text className="arch-label" x="260" y="55">Next.js App Router</text>

      <rect className="arch-node" x="420" y="30" width="160" height="50" />
      <text className="arch-label" x="500" y="55">Sidebar + Theme</text>

      <rect className="arch-node" x="630" y="30" width="120" height="50" />
      <text className="arch-label" x="690" y="55">Progress</text>

      {/* Connectors top → mid */}
      <line className="arch-connector" x1="260" y1="80" x2="180" y2="130" />
      <line className="arch-connector" x1="260" y1="80" x2="330" y2="130" />
      <line className="arch-connector" x1="260" y1="80" x2="480" y2="130" />
      <line className="arch-connector" x1="260" y1="80" x2="630" y2="130" />
      <line className="arch-connector" x1="260" y1="80" x2="180" y2="130" />

      {/* Mid layer — Primitives */}
      {[
        { x: 120, label: "VectorCanvas" },
        { x: 270, label: "GraphEditor" },
        { x: 420, label: "Surface3D" },
        { x: 560, label: "MathBlock" },
      ].map((p) => (
        <g key={p.label}>
          <rect className="arch-node" x={p.x} y="130" width="130" height="50" />
          <text className="arch-label" x={p.x + 65} y="155">{p.label}</text>
        </g>
      ))}

      {/* Row 2 of primitives */}
      {[
        { x: 200, label: "ParamPanel" },
        { x: 430, label: "EmbedFrame" },
      ].map((p) => (
        <g key={p.label}>
          <rect className="arch-node" x={p.x} y="200" width="130" height="50" />
          <text className="arch-label" x={p.x + 65} y="225">{p.label}</text>
        </g>
      ))}

      {/* Connectors mid → bottom */}
      <line className="arch-connector" x1="185" y1="180" x2="200" y2="280" />
      <line className="arch-connector" x1="335" y1="180" x2="370" y2="280" />
      <line className="arch-connector" x1="485" y1="180" x2="540" y2="280" />

      {/* Bottom layer — Libraries */}
      {[
        { x: 140, label: "matrix.ts" },
        { x: 310, label: "graphAlgorithms.ts" },
        { x: 480, label: "stats.ts" },
        { x: 630, label: "progressStore.ts" },
      ].map((p) => (
        <g key={p.label}>
          <rect className="arch-node" x={p.x} y="280" width="140" height="45" />
          <text className="arch-label" x={p.x + 70} y="302" style={{ fontSize: 11 }}>{p.label}</text>
        </g>
      ))}

      {/* External deps */}
      <text x="390" y="365" className="arch-label" style={{ fontSize: 10, fill: "var(--foreground-subtle)" }}>
        React Flow · Plotly.js · KaTeX · Leva · mathjs · next-themes
      </text>
      <rect x="140" y="350" width="500" height="30" rx="6" ry="6"
            fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tech Stack Card                                                    */
/* ------------------------------------------------------------------ */

const TECH_STACK = [
  { name: "Next.js 16", desc: "App Router, SSR, file-based routing", icon: "⚡" },
  { name: "TypeScript", desc: "Strict mode, full type safety", icon: "🔷" },
  { name: "Tailwind CSS v4", desc: "Design tokens, dark mode, responsive", icon: "🎨" },
  { name: "React Flow", desc: "Graph visualization & interaction", icon: "🔗" },
  { name: "Plotly.js", desc: "3D surface plots, contour maps", icon: "📊" },
  { name: "KaTeX", desc: "LaTeX math rendering (inline + block)", icon: "📐" },
  { name: "Leva", desc: "Runtime parameter controls & sliders", icon: "🎛️" },
  { name: "mathjs", desc: "Matrix operations, linear algebra", icon: "🧮" },
];

const DESIGN_PRINCIPLES = [
  {
    title: "Textbook Meets Playground",
    desc: "Every concept has prose explanation alongside an interactive widget. Theory and practice live on the same page.",
    icon: "📖",
  },
  {
    title: "Step-Through Algorithms",
    desc: "Graph and search algorithms produce AlgorithmStep[] arrays — a VCR-like play/pause/step interface unique to this platform.",
    icon: "⏯️",
  },
  {
    title: "Componentized Primitives",
    desc: "6 reusable primitives (VectorCanvas, GraphEditor, Surface3D, MathBlock, ParamPanel, EmbedFrame) — any new topic can be built in hours.",
    icon: "🧩",
  },
  {
    title: "Dark Mode & Responsive",
    desc: "Full dark/light theming via CSS variables. Every widget works on desktop and mobile with touch support.",
    icon: "🌗",
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      {/* Hero */}
      <section className="hero-bg-gradient rounded-2xl px-8 py-12 text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          <span className="hero-gradient">About This Project</span>
        </h1>
        <p className="text-foreground-muted text-base max-w-2xl mx-auto m-0">
          A unified, interactive platform for learning the mathematical foundations of
          AI &amp; Machine Learning — from linear algebra to transformers.
        </p>
      </section>

      {/* Architecture */}
      <h2>Architecture</h2>
      <p>
        The application follows a <strong>layered component architecture</strong>. The App Router handles
        page routing, each topic page composes reusable primitives, and those primitives rely on shared
        utility libraries for math, graph algorithms, and statistics.
      </p>
      <div className="widget-card" style={{ padding: "2rem" }}>
        <ArchitectureDiagram />
      </div>

      {/* Tech Stack */}
      <h2>Tech Stack</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 not-prose">
        {TECH_STACK.map((t, i) => (
          <div key={t.name} className={`stat-card animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`} style={{ textAlign: "left" }}>
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-foreground mb-1">{t.name}</div>
            <div className="text-xs text-foreground-muted">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Design Principles */}
      <h2>Design Principles</h2>
      <div className="grid gap-4 sm:grid-cols-2 not-prose">
        {DESIGN_PRINCIPLES.map((p) => (
          <div key={p.title} className="section-card">
            <div className="text-2xl mb-2">{p.icon}</div>
            <h3 className="text-sm font-semibold text-foreground mb-1" style={{ margin: 0 }}>{p.title}</h3>
            <p className="text-xs text-foreground-muted" style={{ margin: 0 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <h2>How It Works</h2>
      <ol>
        <li>
          <strong>Pick a topic</strong> from the sidebar — topics span 10 sections from Linear Algebra
          to Advanced Topics (GNNs, GANs).
        </li>
        <li>
          <strong>Read the theory</strong> — each page includes prose explanation with LaTeX-rendered
          math formulas (via KaTeX).
        </li>
        <li>
          <strong>Interact with the widget</strong> — drag vectors, build graphs, tune parameters
          with sliders, and watch algorithms step through execution.
        </li>
        <li>
          <strong>Try the challenge</strong> — each page ends with a &quot;Try It Yourself&quot; block
          with a hands-on exercise.
        </li>
        <li>
          <strong>Track your progress</strong> — the sidebar and progress dashboard show which topics
          you&apos;ve visited and completed.
        </li>
      </ol>

      {/* Links */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Link
          href="/about/comparison"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                     text-white no-underline"
          style={{ background: "var(--accent)" }}
        >
          📋 See Competitive Analysis →
        </Link>
        <Link
          href="/progress"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                     border no-underline"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          📊 Progress Dashboard
        </Link>
      </div>
    </div>
  );
}
