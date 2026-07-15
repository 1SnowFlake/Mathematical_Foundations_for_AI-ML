"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  type ProgressData,
  type OverallProgress,
  type SectionProgress,
  getProgress,
  getOverallProgress,
  getSectionProgress,
  markVisited,
  markCompleted as storeMarkCompleted,
  toggleCompleted as storeToggleCompleted,
  resetProgress as storeResetProgress,
} from "@/lib/progressStore";

/* ------------------------------------------------------------------ */
/*  Context type                                                       */
/* ------------------------------------------------------------------ */

interface ProgressContextValue {
  /** Full progress map */
  data: ProgressData;
  /** Aggregated overall stats */
  overall: OverallProgress;
  /** Get stats for a single section */
  sectionProgress: (basePath: string) => SectionProgress;
  /** Mark a topic completed (idempotent) */
  markCompleted: (topicPath: string) => void;
  /** Toggle completion state */
  toggleCompleted: (topicPath: string) => void;
  /** Reset all progress */
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<ProgressData>({});
  const [overall, setOverall] = useState<OverallProgress>({
    total: 0,
    visited: 0,
    completed: 0,
    percentage: 0,
  });

  /** Refresh React state from localStorage */
  const refresh = useCallback(() => {
    setData(getProgress());
    setOverall(getOverallProgress());
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-mark visited on route change
  useEffect(() => {
    if (pathname && pathname !== "/" && !pathname.startsWith("/about") && !pathname.startsWith("/progress") && !pathname.startsWith("/dev")) {
      markVisited(pathname);
      refresh();
    }
  }, [pathname, refresh]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "math-syllabus-progress") refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const handleMarkCompleted = useCallback(
    (topicPath: string) => {
      storeMarkCompleted(topicPath);
      refresh();
    },
    [refresh]
  );

  const handleToggleCompleted = useCallback(
    (topicPath: string) => {
      storeToggleCompleted(topicPath);
      refresh();
    },
    [refresh]
  );

  const handleResetProgress = useCallback(() => {
    storeResetProgress();
    refresh();
  }, [refresh]);

  const sectionProgress = useCallback(
    (basePath: string) => getSectionProgress(basePath),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  return (
    <ProgressContext.Provider
      value={{
        data,
        overall,
        sectionProgress,
        markCompleted: handleMarkCompleted,
        toggleCompleted: handleToggleCompleted,
        resetProgress: handleResetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a <ProgressProvider>");
  }
  return ctx;
}
