'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowUp, ListTree, X } from 'lucide-react';
import { OutlineHeading } from '@/lib/blog-editor';

interface OutlinePanelContentProps {
  title: string;
  headings: OutlineHeading[];
  activeIndex: number | null;
  onClose: () => void;
  onJumpToTop: () => void;
  onJumpToHeading: (heading: OutlineHeading) => void;
}

function OutlinePanelContent({
  title,
  headings,
  activeIndex,
  onClose,
  onJumpToTop,
  onJumpToHeading,
}: OutlinePanelContentProps) {
  return (
    <>
      <div className="px-3.5 py-2.5 border-b border-[var(--gb-border)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree className="size-3.5 text-[var(--gb-muted)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--gb-text)] truncate">
            Table of Contents
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close outline"
          className="size-7 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <button
          type="button"
          onClick={onJumpToTop}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-medium text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
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
                className={`w-full text-left py-1.5 pr-2.5 rounded-xl text-xs transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] ${
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
    </>
  );
}

interface FloatingOutlineProps {
  title: string;
  headings: OutlineHeading[];
  activeIndex: number | null;
  open: boolean;
  variant?: 'toolbar' | 'mobile';
  onToggle: () => void;
  onClose: () => void;
  onJumpToTop: () => void;
  onJumpToHeading: (heading: OutlineHeading) => void;
}

export default function FloatingOutline({
  title,
  headings,
  activeIndex,
  open,
  variant = 'toolbar',
  onToggle,
  onClose,
  onJumpToTop,
  onJumpToHeading,
}: FloatingOutlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (variant === 'mobile') {
    if (!open) return null;
    return (
      <div
        ref={containerRef}
        className="md:hidden fixed bottom-16 left-4 right-4 sm:right-auto z-30 flex flex-col items-start"
      >
        <aside
          aria-label="Table of contents"
          className="w-full max-w-72 max-h-[55vh] flex flex-col rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] shadow-2xl overflow-hidden"
        >
          <OutlinePanelContent
            title={title}
            headings={headings}
            activeIndex={activeIndex}
            onClose={onClose}
            onJumpToTop={onJumpToTop}
            onJumpToHeading={onJumpToHeading}
          />
        </aside>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Toggle table of contents"
        title="Table of Contents"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] ${
          open
            ? 'bg-[var(--gb-hover)] text-[var(--gb-text)]'
            : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
        }`}
      >
        <ListTree className="size-3.5 shrink-0" />
        <span>Outline</span>
        <span className="text-[11px] opacity-75">{headings.length}</span>
      </button>

      {open && (
        <aside
          aria-label="Table of contents"
          className="absolute right-0 top-full mt-2 z-30 w-72 max-h-[55vh] flex flex-col rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] shadow-2xl overflow-hidden"
        >
          <OutlinePanelContent
            title={title}
            headings={headings}
            activeIndex={activeIndex}
            onClose={onClose}
            onJumpToTop={onJumpToTop}
            onJumpToHeading={onJumpToHeading}
          />
        </aside>
      )}
    </div>
  );
}
