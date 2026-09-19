# PROJECT RULE — Math Notation in JSX

This project renders mathematical notation using the `<MathBlock tex="..." inline />` component (KaTeX-based), located in [MathBlock.tsx](file:///z:/VS%20Code/python/Deep%20Learning/Mathematical_Foundations/math-syllabus-1/components/primitives/MathBlock.tsx).

## Mandatory Rules

**NEVER write raw LaTeX or math notation directly as plain JSX text content.**
- Never write `$ ... $`, `\mathbf{}`, `\frac{}{}`, `\sqrt{}`, `\lambda`, `\theta`, `\Sigma`, or any other LaTeX command directly inside JSX children (e.g. `<p>...$\Sigma$...</p>`).
- Never write bare single-letter math variables in curly braces inside JSX text (e.g. `{x}`, `{n}`, `{k}`, `{i}`) unless they are real, in-scope JS variables/props. These look valid to the compiler but throw `ReferenceError: X is not defined` at runtime — a bug that silently escapes the build and only appears when the page is actually rendered.

## Correct Usage

ALWAYS render math using the existing `<MathBlock>` component instead:
```tsx
import MathBlock from "@/components/primitives/MathBlock";

// Inline math:
<MathBlock tex="P(A)" inline />
<MathBlock tex={String.raw`\mathbf{\Sigma}`} inline />

// Display block math:
<MathBlock tex={String.raw`\int_0^1 x^2 dx = \frac{1}{3}`} />
```
> **Note**: Use `String.raw\`...\`` whenever the LaTeX string contains backslashes so they don't need manual double-escaping.

## Verification Checklist

Before finishing ANY task that adds or edits content in `app/**/page.tsx` or any component file:
1. **Search**: Search changed/added files for the patterns above (`$`, `\mathbf`, `\frac`, `\sqrt`, bare Greek-letter names, or any `{single_letter}` not declared in scope).
2. **Fix**: Replace any raw LaTeX/variable expressions with `<MathBlock>`.
3. **Build**: Run `npm run build` (not just dev server) and verify it completes with "Compiled successfully" and 0 TypeScript/lint errors.
4. **Report**: Report which files/lines were checked, even if no issues were found, to verify the check ran.
