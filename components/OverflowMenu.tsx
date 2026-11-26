'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  Code2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  Home,
  Loader2,
  Moon,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { ThemeMode } from '@/lib/ui';

interface OverflowMenuProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  theme: ThemeMode;
  focusMode: boolean;
  isExportingPdf: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onDownloadHtml: () => void;
  onDownloadPdf: () => void;
  onOpenApiConfig: () => void;
  onToggleTheme: () => void;
  onToggleFocusMode: () => void;
  showInstallPWA?: boolean;
  onInstallPWA?: () => void;
}

export default function OverflowMenu({
  anchorRef,
  theme,
  focusMode,
  isExportingPdf,
  onClose,
  onSaveDraft,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadHtml,
  onDownloadPdf,
  onOpenApiConfig,
  onToggleTheme,
  onToggleFocusMode,
  showInstallPWA,
  onInstallPWA,
}: OverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Workspace actions"
      className="absolute right-0 top-12 z-50 w-60 rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] shadow-xl p-2"
    >
      <div className="space-y-0.5">
        <button
          type="button"
          role="menuitem"
          onClick={onSaveDraft}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <BookmarkCheck className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={onCopyMarkdown}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <Copy className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>Copy Markdown</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={onDownloadMarkdown}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <FileText className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>Download Markdown</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={onDownloadHtml}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <Code2 className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>Download HTML</span>
        </button>

        <button
          type="button"
          role="menuitem"
          disabled={isExportingPdf}
          onClick={onDownloadPdf}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          {isExportingPdf ? (
            <Loader2 className="size-4 text-[var(--gb-muted)] animate-spin shrink-0" />
          ) : (
            <FileDown className="size-4 text-[var(--gb-muted)] shrink-0" />
          )}
          <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={onOpenApiConfig}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <SlidersHorizontal className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>API Config</span>
        </button>

        {showInstallPWA && onInstallPWA && (
          <button
            type="button"
            role="menuitem"
            onClick={onInstallPWA}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
          >
            <Download className="size-4 text-[var(--gb-muted)] shrink-0" />
            <span>Install PWA</span>
          </button>
        )}

        <Link
          href="/"
          role="menuitem"
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <Home className="size-4 text-[var(--gb-muted)] shrink-0" />
          <span>Landing Page</span>
        </Link>
      </div>

      <div className="my-2 border-t border-[var(--gb-border)]" />

      <div className="space-y-1">
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={theme === 'light'}
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="size-4 text-[var(--gb-muted)]" />
            ) : (
              <Moon className="size-4 text-[var(--gb-muted)]" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
          <span className="text-xs text-[var(--gb-muted)]">
            {theme === 'dark' ? 'Off' : 'On'}
          </span>
        </button>

        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={focusMode}
          onClick={onToggleFocusMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
        >
          <span className="flex items-center gap-2.5">
            <Eye className="size-4 text-[var(--gb-muted)]" />
            <span>Focus Mode</span>
          </span>
          <span className="text-xs text-[var(--gb-muted)]">
            {focusMode ? 'On' : 'Off'}
          </span>
        </button>
      </div>
    </div>
  );
}
