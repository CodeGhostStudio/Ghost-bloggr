'use client';

import React from 'react';
import { ArrowUp, ListTree, X } from 'lucide-react';
import { OutlineHeading } from '@/lib/blog-editor';

interface FloatingOutlineProps {
  title: string;
  headings: OutlineHeading[];
  activeIndex: number | null;
  open: boolean;
  onToggle: () => void;
  onJumpToTop: () => void;
  onJumpToHeading: (heading: OutlineHeading) => void;
}

export default function FloatingOutline({
  title,
  headings,
  activeIndex,
  open,
  onToggle,
  onJumpToTop,
  onJumpToHeading,
}: FloatingOutlineProps) {
  return (
    <div className="fixed bottom-16 md:bottom-5 left-4 sm:left-6 z-30 flex flex-col items-start gap-2">
      {open && (
        <aside
          aria-label="Table of contents"
          className="w-64 sm:w-72 max-h-[55vh] flex flex-col rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] shadow-2xl overflow-hidden"
        >
          <div className="px-3.5 py-2.5 border-b border-[var(--gb-border)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ListTree className="size-3.5 text-[var(--gb-muted)] shrink-0" />
              <span className="text-xs font-semibold text-[var(--gb-text)] truncate">
                Table of Contents
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Close outline"
              className="size-7 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <button
              type="button"
              onClick={onJumpToTop}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-medium text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <span className="truncate">{title.trim() || 'Post Headline'}</span>
              <ArrowUp className="size-3 shrink-0" />
            </button>

            {headings.length === 0 ? (
              <p className="px-2.5 py-4 text-xs text-[var(--gb-muted)] leading-relaxed">
                Add H2 or H3 headings in your post to jump between sections.
              </p>
            ) : (
              headings.map((h) => {
                const isActive = activeIndex === h.index;
                return (
                  <button
                    key={`${h.index}-${h.level}-${h.text}`}
                    type="button"
                    onClick={() => onJumpToHeading(h)}
                    className={`w-full text-left py-1.5 pr-2.5 rounded-xl text-xs transition-colors truncate ${
                      h.level === 3 ? 'pl-5' : 'pl-2.5 font-medium'
                    } ${
                      isActive
                        ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                        : h.level === 3
                          ? 'text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                          : 'text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                    }`}
                  >
                    {h.text}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Toggle table of contents"
        className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] shadow-lg hover:bg-[var(--gb-hover)] transition-colors tabular-nums"
      >
        <ListTree className="size-3.5 text-[var(--gb-muted)]" />
        <span>Outline</span>
        <span className="text-[var(--gb-muted)]">{headings.length}</span>
      </button>
    </div>
  );
}
