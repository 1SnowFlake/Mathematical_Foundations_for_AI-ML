"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { SECTIONS, Section, TopicLink } from "../../lib/courseStructure";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => {
      // Auto-expand the section that matches the current path
      const currentPath = pathname.toLowerCase();
      const section = SECTIONS.find((s: Section) => currentPath.startsWith(s.basePath.toLowerCase()));
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

  const currentPath = pathname.toLowerCase();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg
                   border border-border bg-surface shadow-md lg:hidden text-foreground"
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
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4" aria-label="Main navigation">
          {SECTIONS.map((section: Section) => {
            const isExpanded = expandedSections.has(section.basePath);
            const isActiveSection = currentPath.startsWith(section.basePath.toLowerCase());

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
                    {section.topics.map((topic: TopicLink) => {
                      const href = `${section.basePath}/${topic.slug}`;
                      const isActive = currentPath === href.toLowerCase();

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
        </div>
      </aside>
    </>
  );
}
