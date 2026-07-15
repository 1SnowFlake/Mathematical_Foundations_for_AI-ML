# Phase 0: Interactive AI/Math/ML Syllabus — Foundation & Primitives

## Goal

Bootstrap a Next.js 14+ project with TypeScript strict mode, Tailwind CSS, MDX support, and build the 6 core reusable primitives. By the end of Phase 0, `/dev/components` shows a working demo of every primitive and a nav shell links to stub pages for all topics.

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] Next.js project initialization

- `npx -y create-next-app@latest ./` with TypeScript, Tailwind CSS, App Router, ESLint
- Enable `strict: true` in `tsconfig.json`
- Install dependencies:
  - **MDX**: `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`
  - **Math**: `react-katex`, `katex`
  - **Sliders/Controls**: `leva`
  - **Graph visualization**: `reactflow` (React Flow v11+)
  - **3D Surface plots**: `react-plotly.js`, `plotly.js`
  - **Math library**: `mathjs`
  - **Types**: `@types/katex`

#### [NEW] `next.config.mjs`

- Configure `@next/mdx` with `.mdx` page extensions

#### [NEW] `mdx-components.tsx`

- Root-level MDX components file mapping custom components for use in `.mdx` pages

---

### 2. Design System & Layout

#### [NEW] `app/layout.tsx`

- Root layout with dark mode support (class-based toggling via `next-themes`)
- Google Fonts: Inter for body, JetBrains Mono for code
- Global nav sidebar with collapsible sections for each subject area

#### [NEW] `app/globals.css`

- Tailwind config + custom CSS variables for the "textbook meets playground" aesthetic
- Dark/light theme tokens
- Typography scale, prose styling for MDX content

#### [NEW] `tailwind.config.ts`

- Custom color palette (warm neutrals, accent blues/purples for interactive elements)
- Typography plugin for MDX prose
- Dark mode: `class` strategy

---

### 3. Core Primitives (`/components/primitives/`)

#### [NEW] `components/primitives/MathBlock.tsx`

- Wraps `react-katex`'s `InlineMath` and `BlockMath`
- Props: `tex: string`, `inline?: boolean`
- Consistent sizing, dark-mode aware text colors
- Error boundary for invalid LaTeX

#### [NEW] `components/primitives/ParamPanel.tsx`

- Wraps `leva`'s `useControls` with project-consistent styling
- Provides a `<ParamPanel>` component that accepts a schema and onChange callback
- Themed to match the site aesthetic (not leva's default look)
- Touch-friendly slider sizing

#### [NEW] `components/primitives/VectorCanvas.tsx`

- SVG-based 2D coordinate canvas
- Features:
  - Configurable grid with axis labels
  - One or more draggable points (touch + mouse via pointer events)
  - Vector arrows from origin to points
  - `onPointChange(id, x, y)` callback
  - Coordinate readout labels on each point
- Props: `width`, `height`, `vectors`, `onVectorChange`, `gridRange`

#### [NEW] `components/primitives/GraphEditor.tsx`

- Wraps React Flow
- Features:
  - Add/remove nodes (click canvas to add, right-click/long-press to delete)
  - Add/remove edges (drag between nodes)
  - Node dragging
  - `useGraphAlgorithm` hook interface: takes algorithm name + graph data, returns step-by-step animation state
  - Color-coded node/edge states for algorithm visualization
- Props: `initialNodes`, `initialEdges`, `algorithmState`, `onGraphChange`

#### [NEW] `components/primitives/Surface3D.tsx`

- Wraps `react-plotly.js` with `surface` and `contour` trace types
- Features:
  - Rotate/zoom/pan built in (Plotly's default 3D interaction)
  - Dark-mode aware colors
  - Configurable function `f(x, y)` to plot
  - Optional gradient vectors overlay
  - Optional animated path (for gradient descent visualization later)
- Props: `fn`, `xRange`, `yRange`, `resolution`, `showContour`, `paths`

#### [NEW] `components/primitives/EmbedFrame.tsx`

- Consistent iframe wrapper for third-party tools
- Features:
  - Title bar with tool name
  - Loading skeleton while iframe loads
  - Fixed aspect ratio (16:9 default, configurable)
  - Attribution link to original tool
  - Responsive sizing
- Props: `src`, `title`, `attribution`, `aspectRatio`

---

### 4. Utility Libraries (`/lib/`)

#### [NEW] `lib/matrix.ts`

- Thin typed wrappers around `mathjs` for matrix operations used by visualizations
- Types: `Vector2D`, `Matrix2x2`, `TransformResult`
- Functions: `multiply`, `determinant`, `eigenvalues`, `rotate`, `scale`, `reflect`

#### [NEW] `lib/graphAlgorithms.ts`

- Graph data types: `GraphNode`, `GraphEdge`, `AlgorithmStep`
- BFS, DFS, Dijkstra, A* implementations returning step arrays
- Each step: `{ visitedNodes, currentNode, frontierNodes, highlightedEdges, description }`

#### [NEW] `lib/stats.ts`

- Distribution functions: normal PDF/CDF, binomial, Poisson
- Typed wrappers, no `any`

---

### 5. QA Page

#### [NEW] `app/dev/components/page.tsx`

- Internal dev page showing one working demo of each primitive:
  1. `MathBlock` — renders a quadratic formula and an inline integral
  2. `ParamPanel` — sliders controlling a color/size demo
  3. `VectorCanvas` — two draggable vectors with dot product readout
  4. `GraphEditor` — pre-loaded 5-node graph, "Run BFS" button
  5. `Surface3D` — `sin(x)*cos(y)` surface with contour toggle
  6. `EmbedFrame` — embedded Desmos calculator
- Each primitive in its own card section with heading

---

### 6. Navigation Shell & Topic Stubs

#### [NEW] `components/layout/Sidebar.tsx`

- Collapsible nav with sections:
  - Linear Algebra (topics: vectors, matrix-transformations, eigenvalues, gram-schmidt, svd)
  - Calculus (topics: derivatives, integrals, partial-derivatives, gradient)
  - Probability (topics: distributions, bayes-theorem, expected-value)
  - Graph Theory (topics: bfs, dfs, dijkstra, mst, coloring, euler-hamiltonian)
  - Search Algorithms (topics: grid-search, a-star, hill-climbing)
  - Neural Networks (topics: perceptron, backpropagation, decision-boundary)
  - Deep Learning (topics: cnns, regularization, optimization)
  - Transformers (topics: attention, self-attention, positional-encoding)

#### [NEW] Stub pages for each topic

- Each stub: a simple MDX page with the topic title, a "Coming soon" message, and a breadcrumb
- Created as `app/[subject]/[topic]/page.mdx` files

---

## Key Design Decisions

> [!IMPORTANT]
> **React Flow vs Cytoscape.js**: The spec mentions Cytoscape.js or React Flow. I'll use **React Flow** because it's React-native, has better TypeScript support, and integrates more naturally with the component model. Cytoscape would require imperative bridging.

> [!IMPORTANT]
> **Plotly vs Three.js for 3D surfaces**: Using **react-plotly.js** for Surface3D as specified. It handles rotate/zoom natively. For Phase 2's eigenvector 3D viz, we'll introduce `react-three-fiber` as a separate component, not a primitive.

> [!IMPORTANT]
> **MDX approach**: Using `@next/mdx` with the App Router's built-in MDX support. Each topic page will be a `.mdx` file that can import interactive components directly. The `mdx-components.tsx` file at the project root will provide default component mappings.

> [!IMPORTANT]
> **Leva styling**: Leva's panels can look jarring in a polished site. I'll create a custom-themed leva panel that collapses into the widget card, using leva's theming API to match our design tokens.

## Open Questions

> [!NOTE]
> **Node.js version**: The project requires Node.js 18.17+ for Next.js 14. I'll assume this is available on your system. If `npx create-next-app` fails, we may need to check your Node version.

> [!NOTE]
> **Plotly bundle size**: `plotly.js` is ~3.5MB minified. For production, we'd want to use `plotly.js-dist-min` or a custom partial bundle. For Phase 0 dev, I'll use the full bundle and optimize in Phase 7. Acceptable?

> [!NOTE]  
> **Topic list completeness**: The stub pages I'll create cover the topics explicitly mentioned in your spec. If you want additional topics (e.g., PCA, SVD, LSTMs, RNNs, reinforcement learning), let me know and I'll add stubs.

## Verification Plan

### Automated Tests
- `npx next lint` — passes with no errors
- `npx tsc --noEmit` — TypeScript strict mode compiles cleanly

### Manual Verification
- `npm run dev` → navigate to `/dev/components` → all 6 primitives render correctly
- Dark mode toggle works on every primitive
- Touch interaction tested on VectorCanvas and GraphEditor (via Chrome DevTools device emulation)
- Nav sidebar links to all stub pages, each stub page loads
- MathBlock renders LaTeX without errors

## Estimated File Count

~40 files for Phase 0 (project config + primitives + stubs + layout)

## Phases 1–7 Summary

After Phase 0 approval and completion, the remaining phases follow the spec exactly:
1. **Phase 1**: Graph Theory & Search (BFS/DFS/Dijkstra/A*/maze/minimax)
2. **Phase 2**: Linear Algebra (vector ops, matrix transforms, eigenvectors)
3. **Phase 3**: Neural Networks, Deep Learning, CNNs, Transformers (embeds + custom)
4. **Phase 4**: Probability (Seeing Theory embed + custom distribution widgets)
5. **Phase 5**: Optimization & Multivariable Calculus (Surface3D + gradient descent)
6. **Phase 6**: GNNs, GANs, regression, remaining topics
7. **Phase 7**: Accessibility, mobile, dark-mode polish, Vercel deploy
