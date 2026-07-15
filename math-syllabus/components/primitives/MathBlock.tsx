"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

interface MathBlockProps {
  /** LaTeX expression to render */
  tex: string;
  /** If true, renders inline; otherwise renders as a display block */
  inline?: boolean;
  /** Optional CSS class for the wrapper */
  className?: string;
}

/**
 * Consistent KaTeX math rendering with dark-mode support and error handling.
 * Uses KaTeX directly (not react-katex) for React 19 compatibility.
 *
 * Usage in MDX:
 *   <MathBlock tex="\\int_0^1 x^2 dx = \\frac{1}{3}" />
 *   <MathBlock tex="x^2" inline />
 */
export default function MathBlock({ tex, inline = false, className = "" }: MathBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: !inline,
        throwOnError: false,
        errorColor: "var(--error, #dc2626)",
        trust: true,
      });
    } catch {
      return `<span style="color: var(--error, #dc2626)">Error rendering: ${tex}</span>`;
    }
  }, [tex, inline]);

  if (inline) {
    return (
      <span
        className={`math-inline ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`math-block my-4 overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
