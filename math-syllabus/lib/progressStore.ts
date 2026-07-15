/**
 * Progress tracking store backed by localStorage.
 *
 * Each topic is keyed by its full path (e.g. "/graph-theory/bfs").
 * A topic can be "visited" (the page was opened) or "completed"
 * (the user explicitly marked it done via a button/checkbox).
 */

import { SECTIONS } from "./courseStructure";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TopicProgress {
  visited: boolean;
  completed: boolean;
  /** Unix timestamp (ms) of last interaction */
  timestamp: number;
}

export type ProgressData = Record<string, TopicProgress>;

export interface SectionProgress {
  total: number;
  visited: number;
  completed: number;
}

export interface OverallProgress {
  total: number;
  visited: number;
  completed: number;
  percentage: number; // 0-100
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "math-syllabus-progress";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function read(): ProgressData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressData) : {};
  } catch {
    return {};
  }
}

function write(data: ProgressData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function markVisited(topicPath: string): void {
  const data = read();
  const prev = data[topicPath];
  data[topicPath] = {
    visited: true,
    completed: prev?.completed ?? false,
    timestamp: Date.now(),
  };
  write(data);
}

export function markCompleted(topicPath: string): void {
  const data = read();
  data[topicPath] = {
    visited: true,
    completed: true,
    timestamp: Date.now(),
  };
  write(data);
}

export function toggleCompleted(topicPath: string): void {
  const data = read();
  const prev = data[topicPath];
  data[topicPath] = {
    visited: true,
    completed: !(prev?.completed ?? false),
    timestamp: Date.now(),
  };
  write(data);
}

export function getProgress(): ProgressData {
  return read();
}

export function getSectionProgress(basePath: string): SectionProgress {
  const section = SECTIONS.find((s) => s.basePath === basePath);
  if (!section) return { total: 0, visited: 0, completed: 0 };

  const data = read();
  let visited = 0;
  let completed = 0;

  for (const topic of section.topics) {
    const key = `${basePath}/${topic.slug}`;
    const entry = data[key];
    if (entry?.visited) visited++;
    if (entry?.completed) completed++;
  }

  return { total: section.topics.length, visited, completed };
}

export function getOverallProgress(): OverallProgress {
  const data = read();
  let total = 0;
  let visited = 0;
  let completed = 0;

  for (const section of SECTIONS) {
    for (const topic of section.topics) {
      total++;
      const key = `${section.basePath}/${topic.slug}`;
      const entry = data[key];
      if (entry?.visited) visited++;
      if (entry?.completed) completed++;
    }
  }

  return {
    total,
    visited,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns all topic paths that exist in the course structure.
 */
export function getAllTopicPaths(): string[] {
  const paths: string[] = [];
  for (const section of SECTIONS) {
    for (const topic of section.topics) {
      paths.push(`${section.basePath}/${topic.slug}`);
    }
  }
  return paths;
}
