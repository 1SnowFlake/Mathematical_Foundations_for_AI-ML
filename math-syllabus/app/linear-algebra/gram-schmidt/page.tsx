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
    <div className="prose" style={{ maxWidth: "100%" }}>
      {/* Title Header */}
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">The Gram–Schmidt Process</h1>
        <p className="text-foreground-muted text-lg mt-2">
          From basic direction vectors to stable, orthonormal representations for modern AI & Machine Learning.
        </p>
      </div>

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
