"use client";

import { useProgress } from "@/components/layout/ProgressProvider";

export default function FinalLearningMap() {
  const { markCompleted } = useProgress();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">🏁 Final Learning Map</h2>

      <div className="bg-surface border border-border p-6 rounded-xl overflow-x-auto">
        <div className="flex flex-col items-center text-xs font-mono gap-2 text-foreground-muted">
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Need to describe motion</div>
          <div>↓</div>
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Vectors</div>
          <div>↓</div>
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Linear Independence</div>
          <div>↓</div>
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Span &amp; Subspaces</div>
          <div>↓</div>
          <div className="bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded border border-amber-500/30">Problems with Nearly Parallel Independent Vectors</div>
          <div>↓</div>
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Orthogonality &amp; Projection</div>
          <div>↓</div>
          <div className="bg-accent text-white font-bold px-4 py-2 rounded-lg shadow-lg">Gram–Schmidt Process</div>
          <div>↓</div>
          <div className="bg-surface-hover px-3 py-1.5 rounded border border-border">Orthonormal Basis &amp; QR Factorization</div>
          <div>↓</div>
          <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded border border-emerald-500/30">AI &amp; Deep Learning Foundations</div>
        </div>
      </div>

      {/* Completion button */}
      <div className="text-center mt-8">
        <button
          onClick={() => markCompleted("/linear-algebra/gram-schmidt")}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold
                     text-white cursor-pointer transition-all hover:opacity-90 shadow-md"
          style={{ background: "var(--success)" }}
        >
          ✓ Mark Chapter as Complete
        </button>
      </div>
    </section>
  );
}
