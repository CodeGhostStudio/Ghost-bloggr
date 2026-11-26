'use client';

import React, { useEffect, useState } from 'react';
import { Check, Code2, Copy, FileDown, FileText, Pencil, Trash2, X } from 'lucide-react';
import { BlogPost } from '@/lib/blog-library';
import { sanitizeEditorHtml } from '@/lib/sanitize';

interface ReaderModalProps {
  post: BlogPost | null;
  onClose: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onCopyMarkdown: (post: BlogPost) => Promise<void> | void;
  onDownloadMarkdown: (post: BlogPost) => void;
  onDownloadHtml: (post: BlogPost) => void;
  onDownloadPdf: (post: BlogPost) => void;
}

export default function ReaderModal({
  post,
  onClose,
  onEdit,
  onDelete,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadHtml,
  onDownloadPdf,
}: ReaderModalProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  useEffect(() => {
    if (!post) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [post, onClose]);

  if (!post) return null;

  const formattedDate = new Date(post.updatedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[820px] max-h-[90vh] flex flex-col rounded-2xl bg-[var(--gb-surface)] border border-[var(--gb-border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-[var(--gb-border)] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(post)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
            >
              <Pencil className="size-3.5" />
              <span>Edit in Canvas</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await onCopyMarkdown(post);
                setCopiedMd(true);
                setTimeout(() => setCopiedMd(false), 1600);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              {copiedMd ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5 text-[var(--gb-muted)]" />
              )}
              <span>{copiedMd ? 'Copied' : 'Copy .md'}</span>
            </button>
            <button
              type="button"
              onClick={() => onDownloadMarkdown(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <FileText className="size-3.5 text-[var(--gb-muted)]" />
              <span>.md</span>
            </button>
            <button
              type="button"
              onClick={() => onDownloadHtml(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <Code2 className="size-3.5 text-[var(--gb-muted)]" />
              <span>HTML</span>
            </button>
            <button
              type="button"
              onClick={() => onDownloadPdf(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <FileDown className="size-3.5 text-[var(--gb-muted)]" />
              <span>PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              aria-label="Delete post"
              className="size-9 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-red-400 hover:bg-[var(--gb-hover)] transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close reader view"
              className="size-9 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-8 sm:py-10">
          <article className="max-w-[680px] mx-auto">
            <h1
              id="reader-modal-title"
              className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--gb-text)] leading-tight"
            >
              {post.title}
            </h1>
            <div className="mt-3 mb-8 pb-6 border-b border-[var(--gb-border)] text-xs sm:text-sm text-[var(--gb-muted)] tabular-nums flex flex-wrap items-center gap-2">
              <span className="capitalize">{post.status}</span>
              <span aria-hidden="true">·</span>
              <span>{post.tone}</span>
              <span aria-hidden="true">·</span>
              <span>{post.wordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>{post.readingTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
            </div>

            <div
              className="gb-prose"
              dangerouslySetInnerHTML={{
                __html: sanitizeEditorHtml(post.contentHtml || '<p>No content yet.</p>'),
              }}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
