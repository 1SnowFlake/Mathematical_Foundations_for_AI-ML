"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { SECTIONS } from "@/lib/courseStructure";
import { useProgress } from "./ProgressProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { data, overall, sectionProgress } = useProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => {
      // Auto-expand the section that matches the current path
      const section = SECTIONS.find((s) => pathname.startsWith(s.basePath));
      return new Set(section ? [section.basePath] : []);
    }
  );

  const toggleSection = (basePath: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(basePath)) {
        next.delete(basePath);
      } else {
        next.add(basePath);
      }
      return next;
    });
  };

  /** Tiny SVG progress ring for the sidebar header */
  const ProgressRing = ({ size = 28, stroke = 3 }: { size?: number; stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (overall.percentage / 100) * circumference;
    return (
      <svg width={size} height={size} className="progress-ring">
        <circle className="progress-ring__bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    );
  };

  /** Completion badge for individual topics */
  const TopicBadge = ({ topicPath }: { topicPath: string }) => {
    const entry = data[topicPath];
    if (entry?.completed) {
      return <span className="completion-badge completion-badge--done">✓</span>;
    }
    if (entry?.visited) {
      return <span className="completion-badge completion-badge--visited">●</span>;
    }
    return <span className="completion-badge completion-badge--empty" />;
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg
                   border border-border bg-surface shadow-md lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-[280px] overflow-y-auto border-r border-border
                    bg-background transition-transform duration-200 ease-out
                    lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="text-lg">📘</span>
            <div>
              <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                Interactive Syllabus
              </span>
              <span className="block text-[10px] text-foreground-subtle tracking-wide uppercase">
                AI · Math · ML
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ProgressRing />
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4" aria-label="Main navigation">
          {SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.basePath);
            const isActiveSection = pathname.startsWith(section.basePath);
            const sp = sectionProgress(section.basePath);

            return (
              <div key={section.basePath} className="mb-1">
                <button
                  onClick={() => toggleSection(section.basePath)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm
                             transition-colors ${
                               isActiveSection
                                 ? "bg-accent-subtle text-accent font-medium"
                                 : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                             }`}
                >
                  <span className="text-base">{section.icon}</span>
                  <span className="flex-1">{section.title}</span>
                  {sp.completed > 0 && (
                    <span className="text-[10px] text-foreground-subtle font-medium mr-1">
                      {sp.completed}/{sp.total}
                    </span>
                  )}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ml-5 mt-0.5 border-l border-border pl-3">
                    {section.topics.map((topic) => {
                      const href = `${section.basePath}/${topic.slug}`;
                      const isActive = pathname === href;

                      return (
                        <Link
                          key={topic.slug}
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-accent text-white font-medium"
                              : "text-foreground-subtle hover:text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <TopicBadge topicPath={href} />
                          <span className="truncate">{topic.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="border-t border-border px-5 py-3 space-y-0.5">
          <Link
            href="/progress"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
              pathname === "/progress"
                ? "bg-accent-subtle text-accent font-medium"
                : "text-foreground-subtle hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <span>📊</span> Progress Dashboard
          </Link>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
              pathname.startsWith("/about")
                ? "bg-accent-subtle text-accent font-medium"
                : "text-foreground-subtle hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <span>ℹ️</span> About This Project
          </Link>
          <Link
            href="/dev/components"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-foreground-subtle
                       hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <span>🧪</span> Dev Components
          </Link>
        </div>
      </aside>
    </>
  );
}
