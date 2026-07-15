/**
 * Course structure data — shared between the sidebar, home page, and any
 * other component that needs to enumerate topics.
 * 
 * Kept in a plain .ts file (not a client component) so it can be imported
 * in both server and client contexts.
 */

export interface TopicLink {
  slug: string;
  title: string;
}

export interface Section {
  title: string;
  basePath: string;
  icon: string;
  topics: TopicLink[];
}

export const SECTIONS: Section[] = [
  {
    title: "Linear Algebra",
    basePath: "/linear-algebra",
    icon: "📐",
    topics: [
      { slug: "vectors", title: "Vectors" },
      { slug: "matrix-transformations", title: "Matrix Transformations" },
      { slug: "eigenvalues", title: "Eigenvalues & Eigenvectors" },
      { slug: "gram-schmidt", title: "Gram-Schmidt Process" },
      { slug: "svd", title: "Singular Value Decomposition" },
    ],
  },
  {
    title: "Calculus",
    basePath: "/calculus",
    icon: "∫",
    topics: [
      { slug: "derivatives", title: "Derivatives" },
      { slug: "integrals", title: "Integrals" },
      { slug: "partial-derivatives", title: "Partial Derivatives" },
      { slug: "gradient", title: "Gradient" },
    ],
  },
  {
    title: "Probability",
    basePath: "/probability",
    icon: "🎲",
    topics: [
      { slug: "distributions", title: "Distributions" },
      { slug: "bayes-theorem", title: "Bayes' Theorem" },
      { slug: "expected-value", title: "Expected Value" },
    ],
  },
  {
    title: "Graph Theory",
    basePath: "/graph-theory",
    icon: "🔗",
    topics: [
      { slug: "bfs", title: "Breadth-First Search" },
      { slug: "dfs", title: "Depth-First Search" },
      { slug: "dijkstra", title: "Dijkstra's Algorithm" },
      { slug: "mst", title: "Minimum Spanning Tree" },
      { slug: "coloring", title: "Graph Coloring" },
      { slug: "euler-hamiltonian", title: "Euler & Hamiltonian Paths" },
    ],
  },
  {
    title: "Search Algorithms",
    basePath: "/search-algorithms",
    icon: "🔍",
    topics: [
      { slug: "grid-search", title: "Grid Search (BFS/DFS)" },
      { slug: "a-star", title: "A* Search" },
      { slug: "hill-climbing", title: "Hill Climbing" },
    ],
  },
  {
    title: "Game Playing",
    basePath: "/game-playing",
    icon: "🎮",
    topics: [
      { slug: "minimax", title: "Minimax" },
      { slug: "alpha-beta", title: "Alpha-Beta Pruning" },
    ],
  },
  {
    title: "Neural Networks",
    basePath: "/neural-networks",
    icon: "🧠",
    topics: [
      { slug: "perceptron", title: "Perceptron" },
      { slug: "backpropagation", title: "Backpropagation" },
      { slug: "decision-boundary", title: "Decision Boundary" },
    ],
  },
  {
    title: "Deep Learning",
    basePath: "/deep-learning",
    icon: "🏗️",
    topics: [
      { slug: "cnns", title: "Convolutional Neural Networks" },
      { slug: "regularization", title: "Regularization" },
      { slug: "optimization", title: "Optimization" },
    ],
  },
  {
    title: "Transformers",
    basePath: "/transformers",
    icon: "⚡",
    topics: [
      { slug: "attention", title: "Attention Mechanism" },
      { slug: "self-attention", title: "Self-Attention" },
      { slug: "positional-encoding", title: "Positional Encoding" },
    ],
  },
  {
    title: "Advanced Topics",
    basePath: "/advanced",
    icon: "🚀",
    topics: [
      { slug: "gnns", title: "Graph Neural Networks" },
      { slug: "gans", title: "GANs" },
      { slug: "regression", title: "Regression" },
    ],
  },
];
