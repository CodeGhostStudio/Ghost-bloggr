'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, Share, Smartphone, X } from 'lucide-react';
import GhostBloggrLogo from './GhostBloggrLogo';

interface PWAInstallModalProps {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ open, isIOS, onClose }: PWAInstallModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = async () => {
    if (!currentUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="w-full max-w-md rounded-2xl bg-[var(--gb-surface)] border border-[var(--gb-border)] p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#121212] border border-[var(--gb-border)] flex items-center justify-center p-1.5 shrink-0">
              <GhostBloggrLogo size="icon" onDarkSurface />
            </div>
            <div className="space-y-1">
              <h2 id="pwa-install-title" className="text-lg font-semibold text-[var(--gb-text)]">
                Install Ghost Bloggr App
              </h2>
              <p className="text-xs text-[var(--gb-muted)] leading-relaxed">
                {isIOS
                  ? 'Install directly from Safari on iPhone or iPad for standalone writing.'
                  : 'Install Ghost Bloggr to your desktop or home screen as a standalone app.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install instructions"
            className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {isIOS ? (
          <ol className="space-y-3 text-xs text-[var(--gb-text)] leading-relaxed">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)]">
              <Share className="size-4 text-[var(--gb-muted)] shrink-0 mt-0.5" />
              <span>
                1. Tap the <strong>Share</strong> button in your Safari toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)]">
              <Smartphone className="size-4 text-[var(--gb-muted)] shrink-0 mt-0.5" />
              <span>
                2. Scroll down and select <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
              </span>
            </li>
          </ol>
        ) : (
          <div className="space-y-3 text-xs text-[var(--gb-text)] leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-2">
              <p className="font-medium text-[var(--gb-text)]">Chrome, Edge, or Brave</p>
              <p className="text-[var(--gb-muted)]">
                Open this page directly in its own browser tab, then click the install icon in the right side of the address bar or choose <strong>Install Ghost Bloggr</strong> from the browser menu.
              </p>
            </div>

            {currentUrl && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  aria-label="App URL"
                  value={currentUrl}
                  className="flex-1 min-w-0 rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2 text-xs text-[var(--gb-muted)] font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedUrl ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
