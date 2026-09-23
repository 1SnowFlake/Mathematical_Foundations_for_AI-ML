# Master Topic Page Generation Prompt

Copy everything below the horizontal rule into your LLM of choice.
Fill in the `[ ]` placeholders before sending.

---

You are a Next.js/React expert AND a creative math teacher who knows how to make
teenagers go "wait, that's actually cool." Your job is to generate a complete,
production-grade, 100% self-contained `page.tsx` file for the topic below.

The output must match the exact visual style, interactive architecture, and
modular component structure of the gold-standard reference file:
`app/linear-algebra/cramers-rule/page.tsx`, which is an ~1800-line masterclass
full of draggable responsive SVG widgets, live KaTeX math readouts, Three.js 3D space,
and real-world AI applications.

---

## TOPIC TO GENERATE (Fill in before sending)

- **Topic Name**: [e.g. Linear Transformations & Matrices]
- **Category**: [e.g. Linear Algebra]
- **Topic Number**: [e.g. Topic 2]
- **Route Path**: [e.g. /linear-algebra/linear-transformations]
- **Parent Category Link**: [e.g. /linear-algebra]
- **Key Math Concepts** (list 3–4):
  - [Concept 1 — e.g. Matrix multiplication as grid warping]
  - [Concept 2 — e.g. Determinant as area/volume scaling factor]
  - [Concept 3 — e.g. Eigenvectors as invariant directional axes]
- **Real AI Connections**:
  - **Classic AI / Foundational**: [e.g. Linear Classifier / Dense Layer decision boundary]
  - **Modern Deep Learning**: [e.g. Multi-Head Attention QK^T projection in Transformers]

---

## AUDIENCE & TONE: TEENAGERS FIRST

Write everything for a 14–17 year old who has never seen this topic before.
Every section must pass the "so what?" test — never just show dry formulas;
always demonstrate what the math *does* and why modern technology cannot exist without it.

1. **No jargon without immediate plain-English translation.** Every technical term
   must be followed by a one-sentence intuition in parentheses or in an adjacent `<p>`.
2. **Cause-and-effect interactivity.** Every interactive canvas must have a clear
   guidance badge: `"✦ Drag the yellow dot"`, `"✦ Move slider to stretch coordinate grid"`, etc.
3. **Instant synchronized visual feedback.** When the user alters any input, at least
   TWO elements must update simultaneously: the visual geometry (SVG / 3D Canvas) AND
   a numeric readout chip or status badge.
4. **Active, exploratory phrasing.** Use invitations like "notice how...", "push the slider past zero",
   "what happens when the determinant hits 0?".
5. **Relatable real-world hooks.** Anchor sections with analogies teenagers interact with daily
   (camera zooms, game physics, TikTok/Instagram filters, Spotify recommenders, ChatGPT).

---

## EXACT VISUAL DESIGN SYSTEM & TOKENS

### Page Shell & Ambient Glows (Copy exactly into root component)
```tsx
<div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
  {/* Ambient background glow blobs */}
  <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
    <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
    <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
    <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
  </div>

  <HeroWidget />
  <FirstIntuition />
  <DeeperMechanics />
  <NumberCrunchingLab />
  <ThreeDSpace />
  <RealWorldData />
  <ClassicAI />
  <DeepLearningAI />
  <ConceptMap />
  <PageFooter />
</div>
```

### Curated Color Palette (Never use default HTML/CSS color names)
| Role | Hex | Purpose |
|---|---|---|
| Primary Accent / Highlight | `#ffd166` | Active vectors, hero results, focal values |
| Feature A / X-axis | `#ff5f9e` | First input vector, basis vector $e_1$, X dimension |
| Feature B / Y-axis | `#22e5c9` | Second input vector, basis vector $e_2$, Y dimension |
| Transformation / Z-axis | `#a78bfa` | Transformed grid, matrix operations, Z dimension |
| Positive / Success | `#34d399` | Model fires, valid determinants, positive outcomes |
| Warning / Flip | `#fb923c` | Inverted areas, negative scalars, below-threshold states |
| AI Connection / Indigo | `#6366f1` | Attention scores, neuron activations, deep learning readouts |

### Typography & Component Layout
- **Section Headings**: `<h2 className="text-2xl font-bold">N · [Section Title]</h2>`
- **Sub-headings**: `<h3 className="text-lg font-bold">`
- **Body Explanations**: `<p className="text-sm text-foreground-muted leading-relaxed">`
- **Monospace Values**: Always apply `font-mono` to numbers, coordinates, and equations.
- **Hero Category Pill**:
  ```tsx
  <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
    [Category] · Topic [N]
  </div>
  ```
- **Hero Gradient Title**:
  ```tsx
  <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
    What is{" "}
    <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
      [Topic Name]?
    </span>
  </h1>
  ```
- **Interactive Section Card Layout**:
  ```tsx
  <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
    {/* LEFT: SVG or Three.js visualizer canvas */}
    {/* RIGHT: Sliders, formula breakdowns, and live stat chips */}
  </div>
  ```
- **Stat Chips Panel**:
  ```tsx
  <div className="grid grid-cols-2 gap-3">
    {[
      { label: "Metric One", value: val1, color: "border-[#ffd166] text-[#ffd166]" },
      { label: "Metric Two", value: val2, color: "border-indigo-400 text-indigo-400" },
    ].map(s => (
      <div key={s.label} className={`border rounded-xl p-3 bg-background/60 ${s.color}`}>
        <div className="text-[10px] uppercase tracking-widest text-foreground-muted">{s.label}</div>
        <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
      </div>
    ))}
  </div>
  ```
- **Interactive Drag Hint Badge (bottom-left of every SVG)**:
  ```tsx
  <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono pointer-events-none">
    ✦ [Action instruction here]
  </div>
  ```

---

## MATH EQUATIONS — KaTeX COMPONENT (`<MathBlock />`)

The application includes a centralized `MathBlock` component. Use it for **all** mathematical formulas.
Never write raw LaTeX math strings directly in JSX text, and never use `dangerouslySetInnerHTML`.

```tsx
import MathBlock from "@/components/primitives/MathBlock";

// Display (Block) equation:
<MathBlock tex="\mathbf{A}\mathbf{x} = \mathbf{b}" />

// Inline equation inside sentences:
<p className="text-sm text-foreground-muted">
  Notice how the determinant <MathBlock tex="\det(\mathbf{A})" inline /> scales the polygon area.
</p>
```

---

## INTERACTIVE SVG ARCHITECTURE (Draggable & Fully Responsive)

Every 2D visualization MUST be an interactive, draggable SVG. Use these exact shared helpers at the top of the file:

```tsx
const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;

function toSvg(x: number, y: number) {
  return { x: OX + x * SCALE, y: OY - y * SCALE };
}

function toGrid(svgX: number, svgY: number, snap = 0.5) {
  return {
    x: Math.round(((svgX - OX) / SCALE) / snap) * snap,
    y: Math.round(((-(svgY - OY)) / SCALE) / snap) * snap,
  };
}

const LIMIT = 4.5;
function clamp(n: number) {
  return Math.max(-LIMIT, Math.min(LIMIT, n));
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto">
      <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
    </marker>
  );
}

function GridLines() {
  const lines: React.ReactNode[] = [];
  for (let i = -5; i <= 5; i++) {
    const vp = toSvg(i, 0), hp = toSvg(0, i), bold = i === 0;
    lines.push(
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H}
            stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
            strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y}
            stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}
            strokeWidth={bold ? 1.5 : 1} />
    );
    if (i !== 0) {
      lines.push(
        <text key={`lv${i}`} x={vp.x} y={OY + 16} fill="rgba(255,255,255,0.25)"
              fontSize="9" textAnchor="middle">{i}</text>,
        <text key={`lh${i}`} x={OX - 14} y={hp.y + 3.5} fill="rgba(255,255,255,0.25)"
              fontSize="9" textAnchor="middle">{i}</text>
      );
    }
  }
  return <>{lines}</>;
}

// CRITICAL: Includes responsive scaling fix ((e.clientX - r.left) / r.width) * W
function DragHandle({
  x, y, color, svgRef, onDrag,
}: {
  x: number; y: number; color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);
  const p = toSvg(x, y);

  return (
    <circle
      cx={p.x} cy={p.y} r={10}
      fill={color} fillOpacity={0.9} stroke="white" strokeWidth={2}
      style={{ cursor: "grab", filter: `drop-shadow(0 0 6px ${color})` }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !svgRef.current) return;
        const r = svgRef.current.getBoundingClientRect();
        // Scale client coordinates proportionally to internal SVG viewBox dimensions
        const g = toGrid(
          ((e.clientX - r.left) / r.width) * W,
          ((e.clientY - r.top) / r.height) * H
        );
        onDrag(clamp(g.x), clamp(g.y));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}
```

---

## THREE.JS 3D VISUALIZER PATTERN (Section 4)

```tsx
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
```

Requirements for 3D Visualizer:
- Dedicated `containerRef` (`HTMLDivElement`).
- Scene setup with `scene.background = new THREE.Color(0x080810)`.
- Directional and ambient lighting, 3D grid helper, and colored axis arrows: X (`#ff5f9e`), Y (`#22e5c9`), Z (`#ffd166`).
- OrbitControls with damping enabled: `controls.enableDamping = true; controls.dampingFactor = 0.07;`.
- Resize observer / window resize handling that updates camera aspect ratio and renderer size.
- **Mandatory cleanup return** inside `useEffect`: dispose geometries, materials, renderer DOM element, and cancel animation frame.
- Add an overlay hint: `"🖱️ Drag to orbit · Scroll to zoom"`.

---

## REQUIRED MODULAR SECTIONS (Implement all 10 components)

Each section MUST be implemented as its own distinct named functional component:

### SECTION 0 — `HeroWidget`
- Hero category badge pill.
- Gradient `<h1>` title (`What is [Topic Name]?`).
- 2–3 sentence hook specifically written for teenagers using everyday analogies (games, graphics, audio, filters).
- 1 sentence bridging the concept to Artificial Intelligence.

### SECTION 1 — `FirstIntuition`
- The most intuitive, hands-on, zero-barrier visual demonstration of the topic.
- Draggable SVG canvas on the left with `✦ Drag me!` hint badge.
- Live mathematical breakdown on the right with `<MathBlock />` and 2 stat chips.

### SECTION 2 — `DeeperMechanics`
- Explores a secondary critical property (composition, determinants, orthogonality, transformation).
- Second draggable element or interactive slider.
- Dynamic conditional callout card switching between success/warning themes:
  ```tsx
  <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
    condition
      ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
      : "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
  }`}>
    {condition ? "✓ Notice how..." : "⚠️ Note: this causes..."}
  </div>
  ```

### SECTION 3 — `NumberCrunchingLab`
- Matrix or algebraic representation with **live numbers** dynamically substituted in JSX (styled with color-coded column vector or matrix brackets).
- Parameter sliders (`<input type="range" />`) that immediately update the calculations.
- Color-coded outputs (green/teal for positive, orange/pink for negative or zero).

### SECTION 4 — `ThreeDSpace`
- Extends the core math concept into 3D using Three.js and OrbitControls.
- Sliders for 3D parameters (X, Y, Z or transformation angles).
- Live magnitude/readout sidebar and camera reset control.

### SECTION 5 — `RealWorldData`
- Maps an abstract mathematical construct to concrete real-world data (e.g. house pricing features, song audio profiles, game character stats).
- Interactive feature toggles (add/remove dimensions) showing how vectors or matrices expand.

### SECTION 6 — `ClassicAI` (Foundational AI Application)
- Connects the topic to classic/foundational ML (Perceptron, Decision Boundary, Linear Regression, PCA, or Naive Bayes).
- Shows the governing equation using `<MathBlock />` (e.g. $\hat{y} = \mathbf{w}^T\mathbf{x} + b$).
- Interactive simulator with 2–4 sliders (weights, inputs, bias).
- Output displayed large in `#6366f1` (`text-4xl font-extrabold font-mono`).
- Threshold status alert:
  ```tsx
  <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
    output > threshold
      ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
      : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
  }`}>
    {output > threshold ? "✓ Model fires — prediction: YES" : "✗ Below threshold — prediction: NO"}
  </div>
  ```
- Closes with a relatable takeaway: *"This is literally what runs inside [model] millions of times per second when [action]."*

### SECTION 7 — `DeepLearningAI` (Modern Deep Learning Application)
- Connects the topic to modern state-of-the-art architectures (Transformers, Self-Attention, CNN Convolutions, Diffusion noise scheduling, or Latent spaces).
- Full multi-step formula rendered with `<MathBlock />` (e.g. $\text{Attention}(Q,K,V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$).
- Interactive visualizer: **2D Attention/Activation Heatmap Grid** constructed with SVG `<rect>` cells whose opacity/fill dynamically maps to live scores, complete with numeric labels inside each cell.
- Stat strip underneath highlighting computed metrics (e.g. Max Attention, Entropy, Argmax).
- Callout with a left accent border (`border-l-2 border-[#6366f1] pl-3`) explaining why this powers modern LLMs like ChatGPT.

### SECTION 8 — `ConceptMap`
- 8 interconnected concept cards arranged in a responsive grid (`grid grid-cols-2 md:grid-cols-4 gap-3`).
- Cards follow the complete educational trajectory:
  `1. Core Math Concept → 2. First Operation → 3. Algebraic Mechanics → 4. 3D Extension → 5. Real Data Representation → 6. Classic AI Model → 7. Modern Deep Learning Architecture → 8. Production State-of-the-Art System`
- Nodes 6 & 7 match the exact models demonstrated in Sections 6 and 7.

### SECTION 9 — `PageFooter`
- Summarizes the lesson with a single relatable takeaway sentence.
- Back-link button styled cleanly:
  ```tsx
  <Link href="[Parent Category Link]"
        className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">
    ← [Parent Category Name]
  </Link>
  ```

---

## IMPORTS CHECKLIST

```tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";
```

---

## QUALITY & INTEGRITY CHECKLIST (Must satisfy 100% of these)

- [ ] `"use client";` on line 1.
- [ ] Gold-standard structure: Matches the 10-section architecture of `app/linear-algebra/cramers-rule/page.tsx`.
- [ ] Shared helpers (`toSvg`, `toGrid`, `clamp`, `ArrowMarker`, `GridLines`, `DragHandle`) placed before components.
- [ ] Responsive `DragHandle` includes the scaling adjustment: `((e.clientX - r.left) / r.width) * W`.
- [ ] Every section is an independent named function component (`HeroWidget`, `FirstIntuition`, `DeeperMechanics`, etc.).
- [ ] All formulas use `<MathBlock />` — zero raw LaTeX strings in plain JSX text.
- [ ] Section 4 (Three.js) has full cleanup in `useEffect` (disposing geometries, materials, cancelAnimationFrame).
- [ ] Section 6 contains an interactive foundational AI simulator with sliders and threshold badge.
- [ ] Section 7 contains a 2D SVG heatmap grid with dynamic opacity and stat readouts for modern Deep Learning.
- [ ] Concept Map contains exactly 8 sequenced nodes tracing math to production AI.
- [ ] Fully self-contained single file: No external custom component imports besides `@/components/primitives/MathBlock`.
- [ ] Full TypeScript typing with zero errors or unhandled edge cases.
- [ ] Complete output: Do NOT truncate, do NOT use placeholder comments like `// ... rest of code`. Output the entire file from line 1 to the closing brace.
