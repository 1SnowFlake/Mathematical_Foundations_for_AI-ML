"use client";

import Chapter1 from "./Chapter1";
import Chapter2 from "./Chapter2";
import Chapter3 from "./Chapter3";
import Chapter4 from "./Chapter4";
import Chapter5 from "./Chapter5";
import Chapter6 from "./Chapter6";
import Chapter7 from "./Chapter7";
import FinalLearningMap from "./FinalLearningMap";

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function GramSchmidtPage() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
      </div>

      {/* Hero Header */}
      <header className="space-y-4">
        <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
          Linear Algebra · Topic 7
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          The{" "}
          <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
            Gram–Schmidt
          </span>{" "}
          Process
        </h1>
        <p className="max-w-2xl text-lg text-foreground-muted leading-relaxed">
          From basic direction vectors to stable, orthonormal representations for modern AI &amp; Machine Learning.
        </p>
      </header>

      <Chapter1 />
      <Chapter2 />
      <Chapter3 />
      <Chapter4 />
      <Chapter5 />
      <Chapter6 />
      <Chapter7 />
      <FinalLearningMap />
    </div>
  );
}
