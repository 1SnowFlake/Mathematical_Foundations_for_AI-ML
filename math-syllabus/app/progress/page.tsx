"use client";

import Link from "next/link";
import { SECTIONS } from "@/lib/courseStructure";
import { useProgress } from "@/components/layout/ProgressProvider";

/* ------------------------------------------------------------------ */
/*  Progress Ring SVG                                                  */
/* ------------------------------------------------------------------ */

function ProgressRing({
  percentage,
  size = 120,
  stroke = 8,
}: {
  percentage: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="progress-ring">
        <circle
          className="progress-ring__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold hero-gradient">{percentage}%</span>
        <span className="text-[10px] text-foreground-subtle uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProgressPage() {
  const { data, overall, sectionProgress, toggleCompleted, resetProgress } = useProgress();

  return (
    <div className="prose" style={{ maxWidth: "100%" }}>
      {/* Header */}
      <section className="hero-bg-gradient rounded-2xl px-8 py-10 text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="hero-gradient">Progress Dashboard</span>
        </h1>
        <p className="text-foreground-muted text-base max-w-xl mx-auto m-0">
          Track your learning journey across all topics
        </p>
      </section>

      {/* Overview stats */}
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 not-prose">
        <ProgressRing percentage={overall.percentage} />
        <div className="grid grid-cols-3 gap-4 flex-1 w-full">
          {[
            { n: overall.total, label: "Total Topics", color: "var(--foreground)" },
            { n: overall.visited, label: "Visited", color: "var(--accent)" },
            { n: overall.completed, label: "Completed", color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__number" style={{ color: s.color, fontSize: "2rem" }}>
                {s.n}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-section breakdown */}
      <h2>Section Breakdown</h2>
      <div className="space-y-6 not-prose">
        {SECTIONS.map((section) => {
          const sp = sectionProgress(section.basePath);
          const pct = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;

          return (
            <div key={section.basePath} className="section-card">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className="text-sm font-semibold text-foreground flex-1" style={{ margin: 0 }}>
                  {section.title}
                </h3>
                <span className="text-xs font-medium text-foreground-muted">
                  {sp.completed}/{sp.total} completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="progress-bar mb-3">
                <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
              </div>

              {/* Topic checklist */}
              <div className="grid gap-1.5 sm:grid-cols-2">
                {section.topics.map((topic) => {
                  const path = `${section.basePath}/${topic.slug}`;
                  const entry = data[path];
                  const isCompleted = entry?.completed ?? false;
                  const isVisited = entry?.visited ?? false;

                  return (
                    <div
                      key={topic.slug}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                      style={{
                        background: isCompleted
                          ? "var(--accent-subtle)"
                          : isVisited
                          ? "var(--surface-hover)"
                          : "transparent",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleCompleted(path)}
                        className="flex items-center justify-center w-5 h-5 rounded border transition-all"
                        style={{
                          background: isCompleted ? "var(--success)" : "transparent",
                          borderColor: isCompleted ? "var(--success)" : "var(--border-strong)",
                          color: isCompleted ? "white" : "transparent",
                          cursor: "pointer",
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                        aria-label={`Mark ${topic.title} as ${isCompleted ? "incomplete" : "complete"}`}
                      >
                        {isCompleted ? "✓" : ""}
                      </button>

                      {/* Topic link */}
                      <Link
                        href={path}
                        className="flex-1 text-sm no-underline transition-colors"
                        style={{
                          color: isCompleted
                            ? "var(--foreground)"
                            : isVisited
                            ? "var(--foreground-muted)"
                            : "var(--foreground-subtle)",
                          textDecorationLine: isCompleted ? "line-through" : "none",
                          textDecorationColor: "var(--foreground-subtle)",
                        }}
                      >
                        {topic.title}
                      </Link>

                      {/* Status label */}
                      {isVisited && !isCompleted && (
                        <span className="text-[10px] text-accent font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "var(--accent-muted)" }}>
                          visited
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            if (confirm("Reset all progress? This cannot be undone.")) {
              resetProgress();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
                     border transition-all cursor-pointer"
          style={{
            borderColor: "var(--error)",
            color: "var(--error)",
            background: "transparent",
          }}
        >
          🔄 Reset All Progress
        </button>
      </div>
    </div>
  );
}
