'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';
import { processLocalImageFile } from '@/lib/image-module';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string, altText: string) => void;
}

export default function ImageUploadModal({
  open,
  onClose,
  onInsert,
}: ImageUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleClose = () => {
    setPreviewUrl(null);
    setAltText('');
    setErrorMsg(null);
    setDragging(false);
    onClose();
  };

  if (!open) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setProcessing(true);
    try {
      const dataUrl = await processLocalImageFile(file);
      setPreviewUrl(dataUrl);
      setAltText(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load image.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    await handleFile(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-upload-title"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl bg-[var(--gb-surface)] border border-[var(--gb-border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-[var(--gb-border)] flex items-center justify-between">
          <h2 id="image-upload-title" className="text-sm font-semibold text-[var(--gb-text)]">
            Insert Image
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close image upload"
            className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          {!previewUrl ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
              }}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors space-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] ${
                dragging
                  ? 'border-[var(--gb-accent)] bg-[var(--gb-hover)]'
                  : 'border-[var(--gb-border)] bg-[var(--gb-canvas)] hover:bg-[var(--gb-elevated)]'
              }`}
            >
              <div className="mx-auto size-11 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] flex items-center justify-center">
                {processing ? (
                  <Loader2 className="size-5 text-[var(--gb-text)] animate-spin" />
                ) : (
                  <UploadCloud className="size-5 text-[var(--gb-text)]" />
                )}
              </div>
              <div className="text-sm font-medium text-[var(--gb-text)]">
                {processing ? 'Optimizing image...' : 'Drag and drop an image here'}
              </div>
              <p className="text-xs text-[var(--gb-muted)]">
                or click to choose PNG, JPEG, WebP, or GIF (up to 8 MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-[var(--gb-border)] bg-[var(--gb-canvas)] max-h-60 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={altText || 'Preview'}
                  className="max-h-60 w-auto object-contain"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="image-alt-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                  Caption &amp; Alt Text
                </label>
                <input
                  id="image-alt-input"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image..."
                  className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setAltText('');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]"
                >
                  Choose Another
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onInsert(previewUrl, altText);
                    handleClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90"
                >
                  <ImagePlus className="size-3.5" />
                  <span>Insert Image</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
