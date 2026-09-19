/**
 * Progress tracking store backed by localStorage.
 */

import { SECTIONS } from "./courseStructure";

export interface TopicProgress {
  visited?: boolean;
  completed?: boolean;
  timestamp?: number;
}

export type ProgressData = Record<string, TopicProgress>;

export interface SectionProgress {
  total: number;
  visited: number;
  completed: number;
  percentage: number;
}

export interface OverallProgress {
  total: number;
  visited: number;
  completed: number;
  percentage: number;
}

const STORAGE_KEY = "math-syllabus-progress";

function getStoredData(): ProgressData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredData(data: ProgressData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function markVisited(topicPath: string): void {
  const data = getStoredData();
  data[topicPath] = { ...data[topicPath], visited: true, timestamp: Date.now() };
  setStoredData(data);
}

export function markCompleted(topicPath: string): void {
  const data = getStoredData();
  data[topicPath] = { ...data[topicPath], completed: true, timestamp: Date.now() };
  setStoredData(data);
}

export function toggleCompleted(topicPath: string): void {
  const data = getStoredData();
  const current = data[topicPath]?.completed;
  data[topicPath] = { ...data[topicPath], completed: !current, timestamp: Date.now() };
  setStoredData(data);
}

export function getProgress(): ProgressData {
  return getStoredData();
}

export function getSectionProgress(basePath: string): SectionProgress {
  const section = SECTIONS.find((s) => s.basePath === basePath);
  if (!section) return { total: 0, visited: 0, completed: 0, percentage: 0 };
  const data = getStoredData();
  let visited = 0;
  let completed = 0;
  for (const topic of section.topics) {
    const p = `${section.basePath}/${topic.slug}`;
    if (data[p]?.visited) visited++;
    if (data[p]?.completed) completed++;
  }
  const total = section.topics.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, visited, completed, percentage };
}

export function getOverallProgress(): OverallProgress {
  let total = 0;
  let visited = 0;
  let completed = 0;
  const data = getStoredData();
  for (const section of SECTIONS) {
    for (const topic of section.topics) {
      total++;
      const p = `${section.basePath}/${topic.slug}`;
      if (data[p]?.visited) visited++;
      if (data[p]?.completed) completed++;
    }
  }
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, visited, completed, percentage };
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getAllTopicPaths(): string[] {
  const paths: string[] = [];
  for (const section of SECTIONS) {
    for (const topic of section.topics) {
      paths.push(`${section.basePath}/${topic.slug}`);
    }
  }
  return paths;
}
