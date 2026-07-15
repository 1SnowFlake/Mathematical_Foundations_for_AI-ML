"use client";

import Link from "next/link";
import { SECTIONS } from "@/lib/courseStructure";
import { useProgress } from "@/components/layout/ProgressProvider";

export default function HomePage() {
  const { overall, sectionProgress } = useProgress();

  const totalTopics = SECTIONS.reduce((n, s) => n + s.topics.length, 0);

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-bg-gradient rounded-2xl px-8 py-14 text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          <span className="hero-gradient">Interactive AI / Math / ML</span>
          <br />
          <span className="text-foreground">Syllabus</span>
        </h1>
        <p className="text-foreground-muted text-lg max-w-2xl mx-auto mb-8" style={{ lineHeight: 1.7 }}>
          Learn the mathematical foundations of artificial intelligence through
          <strong className="text-foreground"> interactive visualizations</strong>.
          Every concept — from vectors to transformers — is something you can
          <em> drag, adjust, and step through</em>.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`${SECTIONS[0].basePath}/${SECTIONS[0].topics[0].slug}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                       no-underline transition-all"
            style={{ background: "var(--accent)", color: "#ffffff", textDecoration: "none" }}
          >
            🚀 Start Learning
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                       border no-underline transition-all"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", textDecoration: "none" }}
          >
            ℹ️ How It Works
          </Link>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { n: SECTIONS.length, label: "Sections", delay: "animate-delay-1" },
          { n: totalTopics, label: "Topics", delay: "animate-delay-2" },
          { n: 6, label: "Primitives", delay: "animate-delay-3" },
          { n: overall.percentage, label: "% Complete", delay: "animate-delay-4" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.delay}`}>
            <div className="stat-card__number hero-gradient">{s.n}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Section Cards ────────────────────────────────────── */}
      <h2 className="text-xl font-semibold mb-4" style={{ borderBottom: "none", paddingBottom: 0 }}>
        Explore Topics
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, i) => {
          const sp = sectionProgress(section.basePath);
          const pct = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;

          return (
            <Link
              key={section.basePath}
              href={`${section.basePath}/${section.topics[0].slug}`}
              className={`section-card no-underline group animate-fade-in-up animate-delay-${Math.min(i + 1, 5)}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="text-base font-semibold text-foreground m-0 group-hover:text-accent transition-colors">
                  {section.title}
                </h3>
                {sp.completed > 0 && (
                  <span
                    className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                  >
                    {sp.completed}/{sp.total}
                  </span>
                )}
              </div>

              <p className="text-sm text-foreground-muted m-0 mb-3">
                {section.topics.map((t) => t.title).join(" · ")}
              </p>

              {/* Progress bar */}
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Footer tagline ───────────────────────────────────── */}
      <div className="mt-12 text-center animate-fade-in animate-delay-5">
        <p className="text-sm text-foreground-subtle">
          Built with <strong>Next.js 16</strong>, <strong>TypeScript</strong>,{" "}
          <strong>Tailwind v4</strong>, and interactive components.
          <br />
          Every widget works on both mouse and touch devices.
        </p>
      </div>
    </div>
  );
}
