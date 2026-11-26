'use client';

import React, { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { AppTab, ThemeMode } from '@/lib/ui';
import GhostBloggrLogo from './GhostBloggrLogo';
import OverflowMenu from './OverflowMenu';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  theme: ThemeMode;
  focusMode: boolean;
  isExportingPdf: boolean;
  onToggleTheme: () => void;
  onToggleFocusMode: () => void;
  onSaveDraft: () => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onDownloadHtml: () => void;
  onDownloadPdf: () => void;
  showInstallPWA?: boolean;
  onInstallPWA?: () => void;
}

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'write', label: 'Write' },
  { id: 'library', label: 'Library' },
  { id: 'settings', label: 'Settings' },
];

export default function TopNav({
  activeTab,
  onSelectTab,
  theme,
  focusMode,
  isExportingPdf,
  onToggleTheme,
  onToggleFocusMode,
  onSaveDraft,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadHtml,
  onDownloadPdf,
  showInstallPWA,
  onInstallPWA,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);

  if (focusMode) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={onToggleFocusMode}
          className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] text-[var(--gb-text)] border border-[var(--gb-border)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          Exit Focus
        </button>
      </div>
    );
  }

  return (
    <header className="w-full max-w-[1220px] mx-auto px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onSelectTab('write')}
        aria-label="Ghost Bloggr"
        className="inline-flex items-center shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] rounded-md px-1"
      >
        <GhostBloggrLogo size="md" priority />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] ${
                  isActive
                    ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                    : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button
          ref={overflowBtnRef}
          type="button"
          aria-label="More actions and settings"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="size-10 sm:size-9 rounded-full flex items-center justify-center bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] shrink-0"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {menuOpen && (
          <OverflowMenu
            anchorRef={overflowBtnRef}
            theme={theme}
            focusMode={focusMode}
            isExportingPdf={isExportingPdf}
            onClose={() => setMenuOpen(false)}
            onSaveDraft={() => {
              onSaveDraft();
              setMenuOpen(false);
            }}
            onCopyMarkdown={() => {
              onCopyMarkdown();
              setMenuOpen(false);
            }}
            onDownloadMarkdown={() => {
              onDownloadMarkdown();
              setMenuOpen(false);
            }}
            onDownloadHtml={() => {
              onDownloadHtml();
              setMenuOpen(false);
            }}
            onDownloadPdf={() => {
              onDownloadPdf();
              setMenuOpen(false);
            }}
            onOpenApiConfig={() => {
              onSelectTab('settings');
              setMenuOpen(false);
            }}
            onToggleTheme={onToggleTheme}
            onToggleFocusMode={() => {
              onToggleFocusMode();
              setMenuOpen(false);
            }}
            showInstallPWA={showInstallPWA}
            onInstallPWA={
              onInstallPWA
                ? () => {
                    onInstallPWA();
                    setMenuOpen(false);
                  }
                : undefined
            }
          />
        )}
      </div>
    </header>
  );
}
