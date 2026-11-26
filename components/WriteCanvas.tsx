'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Copy,
  FileDown,
  FilePlus2,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  ListTree,
  Quote,
  Redo2,
  Send,
  Sparkles,
  Undo2,
  UploadCloud,
} from 'lucide-react';
import { WritingAgent } from '@/lib/agents';
import {
  OutlineHeading,
  applyBlockFormat,
  applyInlineCommand,
  autoLinkTypedUrlBeforeCaret,
  computeEditorMetrics,
  convertPlainTextWithUrlsToHtml,
  extractOutlineHeadings,
  getSelectedEditorText,
  insertCodeBlockAtSelection,
  insertHtmlAtCursor,
  linkifyUrlsInHtml,
  replaceSelectedEditorText,
} from '@/lib/blog-editor';
import {
  buildMarkdownBlogPost,
  copyPostAsMarkdown,
  downloadPostAsMarkdown,
} from '@/lib/export-utils';
import { buildImageFigureHtml, processLocalImageFile } from '@/lib/image-module';
import { formatRelativeTime } from '@/lib/publishing';
import { sanitizeEditorHtml } from '@/lib/sanitize';
import { WRITING_TONES, WritingTone } from '@/lib/ui';
import AiAssistantPanel from './AiAssistantPanel';
import FloatingOutline from './FloatingOutline';
import ImageUploadModal from './ImageUploadModal';

interface WriteCanvasProps {
  draftId: string;
  title: string;
  contentHtml: string;
  tone: WritingTone;
  status: 'draft' | 'published';
  updatedAt: number;
  syncVersion: number;
  focusMode: boolean;
  agents: WritingAgent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onAddAgent: (agent: WritingAgent) => void;
  onChangeTitle: (title: string) => void;
  onChangeContent: (html: string) => void;
  onChangeTone: (tone: WritingTone) => void;
  onNewDraft: () => void;
  onPublishPost: () => void;
  onSaveDraft: () => void;
  onOpenSettings: () => void;
  onNotify: (msg: string, variant?: 'neutral' | 'error') => void;
}

export default function WriteCanvas({
  draftId,
  title,
  contentHtml,
  tone,
  status,
  updatedAt,
  syncVersion,
  focusMode,
  agents,
  activeAgentId,
  onSelectAgent,
  onAddAgent,
  onChangeTitle,
  onChangeContent,
  onChangeTone,
  onNewDraft,
  onPublishPost,
  onSaveDraft,
  onOpenSettings,
  onNotify,
}: WriteCanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [markdownMode, setMarkdownMode] = useState(false);
  const [includeFrontmatter, setIncludeFrontmatter] = useState(true);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState<number | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const metrics = computeEditorMetrics(title, contentHtml);
  const outlineHeadings = useMemo(
    () => extractOutlineHeadings(contentHtml),
    [contentHtml]
  );
  const markdownPreview = markdownMode
    ? buildMarkdownBlogPost({
        title,
        bodyHtml: contentHtml,
        tone,
        includeFrontmatter,
      })
    : '';

  useEffect(() => {
    if (!editorRef.current) return;
    const clean = sanitizeEditorHtml(contentHtml);
    if (editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
    // Sync DOM only when loading a new post or programmatically replacing the full draft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, syncVersion]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(e.target as Node)) {
        setToneMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!editorRef.current || markdownMode) return;
      const nodes = Array.from(editorRef.current.querySelectorAll('h2, h3'));
      if (nodes.length === 0) {
        setActiveHeadingIndex(null);
        return;
      }
      let currentIdx = 0;
      nodes.forEach((node, idx) => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= 180) {
          currentIdx = idx;
        }
      });
      setActiveHeadingIndex(currentIdx);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [markdownMode]);

  const syncHtmlUp = () => {
    if (!editorRef.current) return;
    autoLinkTypedUrlBeforeCaret(editorRef.current, true);
    onChangeContent(editorRef.current.innerHTML);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      autoLinkTypedUrlBeforeCaret(editorRef.current, false);
    }
  };

  const captureSelection = () => {
    setSelectedText(getSelectedEditorText(editorRef.current));
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif']);
    const imageFiles = Array.from(files).filter((f) => allowed.has(f.type.toLowerCase()));
    if (imageFiles.length === 0) {
      onNotify('Drop a PNG, JPEG, WebP, GIF, or AVIF image file.', 'error');
      return;
    }
    let inserted = 0;
    for (const file of imageFiles) {
      try {
        const dataUrl = await processLocalImageFile(file);
        const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        insertHtmlAtCursor(editorRef.current, buildImageFigureHtml(dataUrl, alt));
        inserted += 1;
      } catch (err: unknown) {
        onNotify(err instanceof Error ? err.message : 'Could not insert image.', 'error');
      }
    }
    if (inserted > 0) {
      syncHtmlUp();
      onNotify(inserted === 1 ? 'Image inserted into draft.' : `${inserted} images inserted into draft.`);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const dataUrl = await processLocalImageFile(file);
              insertHtmlAtCursor(editorRef.current, buildImageFigureHtml(dataUrl, 'Pasted image'));
              syncHtmlUp();
              onNotify('Image pasted into draft.');
            } catch (err: unknown) {
              onNotify(err instanceof Error ? err.message : 'Image paste failed.', 'error');
            }
          }
          return;
        }
      }
    }

    const pastedHtml = e.clipboardData?.getData('text/html') ?? '';
    const pastedText = e.clipboardData?.getData('text/plain') ?? '';

    if (pastedHtml && /(?:https?:\/\/|www\.)/i.test(pastedHtml)) {
      e.preventDefault();
      const linkedHtml = linkifyUrlsInHtml(pastedHtml);
      insertHtmlAtCursor(editorRef.current, linkedHtml);
      syncHtmlUp();
      return;
    }

    if (pastedText && /(?:https?:\/\/|www\.)/i.test(pastedText)) {
      e.preventDefault();
      const linkedHtml = convertPlainTextWithUrlsToHtml(pastedText);
      insertHtmlAtCursor(editorRef.current, linkedHtml);
      syncHtmlUp();
    }
  };

  const hasImagePayload = (dt: DataTransfer | null): boolean => {
    if (!dt) return false;
    if (dt.types && Array.from(dt.types).includes('Files')) {
      return true;
    }
    return false;
  };

  const handleCanvasDragEnter = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImagePayload(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingImage(true);
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImagePayload(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (!hasImagePayload(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDraggingImage(false);
    }
  };

  const handleCanvasDrop = async (e: React.DragEvent<HTMLElement>) => {
    if (!hasImagePayload(e.dataTransfer)) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingImage(false);
    if (markdownMode) {
      setMarkdownMode(false);
    }
    await handleImageFiles(e.dataTransfer.files);
  };

  const handleInsertModalImage = (dataUrl: string, altText: string) => {
    if (markdownMode) {
      setMarkdownMode(false);
    }
    requestAnimationFrame(() => {
      insertHtmlAtCursor(editorRef.current, buildImageFigureHtml(dataUrl, altText));
      syncHtmlUp();
      onNotify('Image inserted into draft.');
    });
  };

  const handleJumpToHeading = (heading: OutlineHeading) => {
    if (markdownMode) {
      setMarkdownMode(false);
    }
    setActiveHeadingIndex(heading.index);
    requestAnimationFrame(() => {
      const target = editorRef.current?.querySelectorAll('h2, h3')[heading.index] as
        | HTMLElement
        | undefined;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editorRef.current?.focus({ preventScroll: true });
    });
  };

  const handleJumpToTop = () => {
    setActiveHeadingIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormatAction = (action: () => void) => {
    editorRef.current?.focus();
    action();
    syncHtmlUp();
    captureSelection();
  };

  const handleReplaceSelectionFromAI = (html: string): boolean => {
    const replaced = replaceSelectedEditorText(editorRef.current, html);
    if (replaced) {
      syncHtmlUp();
      setSelectedText('');
      onNotify('Selection updated.');
    }
    return replaced;
  };

  const handleInsertHtmlFromAI = (html: string) => {
    insertHtmlAtCursor(editorRef.current, html);
    syncHtmlUp();
    onNotify('Inserted into draft.');
  };

  const handleReplaceFullDraftFromAI = (nextTitle: string, html: string) => {
    onChangeTitle(nextTitle);
    const clean = sanitizeEditorHtml(html);
    if (editorRef.current) {
      editorRef.current.innerHTML = clean;
    }
    onChangeContent(clean);
    onNotify('Full draft applied to canvas.');
  };

  type ToolbarActionId = 'bold' | 'italic' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote' | 'code';

  const toolbarButtons: Array<{
    id: ToolbarActionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'bold', label: 'Bold', icon: Bold },
    { id: 'italic', label: 'Italic', icon: Italic },
    { id: 'h2', label: 'Heading 2', icon: Heading2 },
    { id: 'h3', label: 'Heading 3', icon: Heading3 },
    { id: 'ul', label: 'Bullet List', icon: List },
    { id: 'ol', label: 'Numbered List', icon: ListOrdered },
    { id: 'blockquote', label: 'Blockquote', icon: Quote },
    { id: 'code', label: 'Code Block', icon: Code },
  ];

  const handleToolbarId = (id: ToolbarActionId) => {
    handleFormatAction(() => {
      switch (id) {
        case 'bold':
          applyInlineCommand('bold');
          break;
        case 'italic':
          applyInlineCommand('italic');
          break;
        case 'h2':
          applyBlockFormat('h2');
          break;
        case 'h3':
          applyBlockFormat('h3');
          break;
        case 'ul':
          applyInlineCommand('insertUnorderedList');
          break;
        case 'ol':
          applyInlineCommand('insertOrderedList');
          break;
        case 'blockquote':
          applyBlockFormat('blockquote');
          break;
        case 'code':
          insertCodeBlockAtSelection(editorRef.current);
          break;
      }
    });
  };

  const handleCopyMarkdown = async () => {
    try {
      await copyPostAsMarkdown({
        title,
        bodyHtml: contentHtml,
        tone,
        includeFrontmatter,
      });
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 1800);
      onNotify('Copied Markdown blog post to clipboard.');
    } catch {
      onNotify('Could not copy Markdown to clipboard.', 'error');
    }
  };

  const handleExportMarkdown = () => {
    downloadPostAsMarkdown({
      title,
      bodyHtml: contentHtml,
      tone,
      includeFrontmatter,
    });
    onNotify('Downloaded Markdown (.md) file.');
  };

  const showDesktopDrawer = !focusMode && desktopDrawerOpen;

  return (
    <div className="w-full max-w-[1220px] mx-auto px-0 sm:px-6 pb-20 md:pb-8">
      <div className="flex flex-col lg:flex-row items-stretch gap-5">
        <section
          aria-label="Writing canvas"
          onDragEnter={handleCanvasDragEnter}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          className="relative flex-1 min-w-0 bg-[var(--gb-surface)] border-y sm:border border-[var(--gb-border)] sm:rounded-[16px] flex flex-col"
        >
          {isDraggingImage && (
            <div className="absolute inset-3 z-40 rounded-2xl border-2 border-dashed border-[var(--gb-accent)] bg-[var(--gb-surface)]/92 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="size-12 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] flex items-center justify-center">
                <UploadCloud className="size-5 text-[var(--gb-text)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--gb-text)]">
                Drop image to insert into post
              </p>
              <p className="text-xs text-[var(--gb-muted)]">
                PNG, JPEG, WebP, or GIF
              </p>
            </div>
          )}
          <div className="w-full max-w-[760px] mx-auto px-5 sm:px-10 pt-7 sm:pt-10 pb-12 flex-1 flex flex-col">
            <div className="space-y-4 pb-5 border-b border-[var(--gb-border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[var(--gb-muted)] tabular-nums flex items-center gap-2">
                  <span>{metrics.words} words</span>
                  <span aria-hidden="true">·</span>
                  <span>{metrics.readingTimeMinutes} min read</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {status === 'published' ? 'Published' : 'Draft'} · {formatRelativeTime(updatedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="relative" ref={toneMenuRef}>
                    <button
                      type="button"
                      onClick={() => setToneMenuOpen((p) => !p)}
                      aria-expanded={toneMenuOpen}
                      aria-haspopup="listbox"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap"
                    >
                      <span>Tone: {tone}</span>
                      <ChevronDown className="size-3.5 text-[var(--gb-muted)]" />
                    </button>

                    {toneMenuOpen && (
                      <div
                        role="listbox"
                        aria-label="Writing tone"
                        className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] shadow-xl p-1.5 z-30"
                      >
                        {WRITING_TONES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="option"
                            aria-selected={tone === t}
                            onClick={() => {
                              onChangeTone(t);
                              setToneMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                          >
                            <span>{t}</span>
                            {tone === t && <Check className="size-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!focusMode && (
                    <>
                      <button
                        type="button"
                        onClick={onNewDraft}
                        title="Start a new draft"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap"
                      >
                        <FilePlus2 className="size-3.5 text-[var(--gb-muted)]" />
                        <span className="hidden sm:inline">New</span>
                      </button>

                      <button
                        type="button"
                        onClick={onSaveDraft}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={onPublishPost}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <Send className="size-3" />
                        <span>Publish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMarkdownMode((p) => !p)}
                        aria-pressed={markdownMode}
                        title="Preview and export Markdown blog post"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                          markdownMode
                            ? 'bg-[var(--gb-accent)] border-transparent text-[var(--gb-accent-fg)]'
                            : 'bg-[var(--gb-elevated)] border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                        }`}
                      >
                        <FileText className="size-3.5" />
                        <span>Markdown</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDesktopDrawerOpen((p) => !p)}
                        className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                          desktopDrawerOpen
                            ? 'bg-[var(--gb-hover)] border-[var(--gb-border)] text-[var(--gb-text)]'
                            : 'bg-[var(--gb-elevated)] border-[var(--gb-border)] text-[var(--gb-muted)] hover:text-[var(--gb-text)]'
                        }`}
                      >
                        <Sparkles className="size-3.5" />
                        <span>AI Assistant</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Post headline..."
                aria-label="Post headline"
                className="w-full bg-transparent text-2xl sm:text-[2.125rem] font-semibold tracking-tight leading-tight text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none"
              />
            </div>

            {!focusMode && !markdownMode && (
              <div
                role="toolbar"
                aria-label="Text formatting"
                className="hidden md:flex items-center justify-between gap-2 py-2.5 border-b border-[var(--gb-border)] sticky top-0 bg-[var(--gb-surface)] z-20"
              >
                <div className="flex items-center gap-1 flex-wrap">
                  {toolbarButtons.map((btn) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        title={btn.label}
                        aria-label={btn.label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleToolbarId(btn.id)}
                        className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    title="Upload or Drag & Drop Image"
                    aria-label="Upload or Drag & Drop Image"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setImageModalOpen(true)}
                    className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                  >
                    <ImagePlus className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Undo"
                    aria-label="Undo"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleFormatAction(() => applyInlineCommand('undo'))}
                    className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                  >
                    <Undo2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Redo"
                    aria-label="Redo"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleFormatAction(() => applyInlineCommand('redo'))}
                    className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                  >
                    <Redo2 className="size-4" />
                  </button>
                  <span aria-hidden="true" className="h-4 w-px bg-[var(--gb-border)] mx-1" />
                  <FloatingOutline
                    title={title}
                    headings={outlineHeadings}
                    activeIndex={activeHeadingIndex}
                    open={outlineOpen}
                    variant="toolbar"
                    onToggle={() => setOutlineOpen((p) => !p)}
                    onClose={() => setOutlineOpen(false)}
                    onJumpToTop={handleJumpToTop}
                    onJumpToHeading={handleJumpToHeading}
                  />
                </div>
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Article body editor"
              data-placeholder="Start writing your post, drop an image, or use the AI assistant to outline..."
              onInput={syncHtmlUp}
              onKeyDown={handleEditorKeyDown}
              onMouseUp={captureSelection}
              onKeyUp={captureSelection}
              onPaste={handlePaste}
              className={`gb-prose flex-1 min-h-[420px] sm:min-h-[540px] pt-6 pb-8 break-words ${
                markdownMode ? 'hidden' : ''
              }`}
            />

            {markdownMode && (
              <div className="flex-1 flex flex-col pt-5 pb-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--gb-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--gb-muted)]">
                      Markdown Blog Post
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeFrontmatter((p) => !p)}
                      aria-pressed={includeFrontmatter}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        includeFrontmatter
                          ? 'bg-[var(--gb-elevated)] border-[var(--gb-border)] text-[var(--gb-text)]'
                          : 'bg-transparent border-[var(--gb-border)] text-[var(--gb-muted)]'
                      }`}
                    >
                      Frontmatter: {includeFrontmatter ? 'On' : 'Off'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
                    >
                      {copiedMarkdown ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span>{copiedMarkdown ? 'Copied' : 'Copy Markdown'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                    >
                      <FileDown className="size-3.5 text-[var(--gb-muted)]" />
                      <span>Export .md</span>
                    </button>
                  </div>
                </div>

                <pre className="flex-1 min-h-[420px] sm:min-h-[500px] rounded-2xl bg-[var(--gb-code-bg)] border border-[var(--gb-border)] p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-[var(--gb-text)] whitespace-pre-wrap break-words">
                  {markdownPreview}
                </pre>
              </div>
            )}
          </div>
        </section>

        {showDesktopDrawer && (
          <aside
            aria-label="AI Writing Assistant"
            className="hidden lg:flex w-[360px] shrink-0 bg-[var(--gb-surface)] border border-[var(--gb-border)] rounded-[16px] flex-col max-h-[calc(100vh-108px)] sticky top-4 overflow-hidden"
          >
            <AiAssistantPanel
              title={title}
              bodyHtml={contentHtml}
              tone={tone}
              wordCount={metrics.words}
              selectedText={selectedText}
              agents={agents}
              activeAgentId={activeAgentId}
              onSelectAgent={onSelectAgent}
              onAddAgent={onAddAgent}
              onApplyHeadline={onChangeTitle}
              onReplaceSelection={handleReplaceSelectionFromAI}
              onInsertHtml={handleInsertHtmlFromAI}
              onReplaceFullDraft={handleReplaceFullDraftFromAI}
              onOpenSettings={onOpenSettings}
              onClose={() => setDesktopDrawerOpen(false)}
            />
          </aside>
        )}
      </div>

      {/* Tablet toggle for AI panel when below lg breakpoint */}
      {!focusMode && (
        <div className="hidden md:flex lg:hidden fixed bottom-5 right-5 z-30">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] shadow-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="size-4" />
            <span>AI Assistant</span>
          </button>
        </div>
      )}

      {/* Mobile Sticky Bottom Formatting Bar */}
      {!focusMode && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--gb-surface)] border-t border-[var(--gb-border)] px-2 py-1 flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {toolbarButtons.slice(0, 6).map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  aria-label={btn.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToolbarId(btn.id)}
                  className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[var(--gb-muted)] active:bg-[var(--gb-hover)] active:text-[var(--gb-text)]"
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
            <button
              type="button"
              aria-label="Insert Image"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setImageModalOpen(true)}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[var(--gb-muted)] active:bg-[var(--gb-hover)] active:text-[var(--gb-text)]"
            >
              <ImagePlus className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Table of Contents"
              onClick={() => setOutlineOpen((p) => !p)}
              className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:bg-[var(--gb-hover)] ${
                outlineOpen ? 'text-[var(--gb-text)]' : 'text-[var(--gb-muted)]'
              }`}
            >
              <ListTree className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="min-h-[40px] px-3.5 rounded-full flex items-center gap-1.5 text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] shrink-0"
          >
            <Sparkles className="size-3.5" />
            <span>AI</span>
          </button>
        </div>
      )}

      {!focusMode && (
        <FloatingOutline
          title={title}
          headings={outlineHeadings}
          activeIndex={activeHeadingIndex}
          open={outlineOpen}
          variant="mobile"
          onToggle={() => setOutlineOpen((p) => !p)}
          onClose={() => setOutlineOpen(false)}
          onJumpToTop={handleJumpToTop}
          onJumpToHeading={handleJumpToHeading}
        />
      )}

      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onInsert={handleInsertModalImage}
      />

      {/* Mobile & Tablet Slide-Up Bottom Sheet */}
      {mobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
          onClick={() => setMobileSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI Writing Assistant"
            className="w-full max-w-[640px] h-[82vh] rounded-t-2xl bg-[var(--gb-surface)] border-t border-x border-[var(--gb-border)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--gb-border)]" />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <AiAssistantPanel
                title={title}
                bodyHtml={contentHtml}
                tone={tone}
                wordCount={metrics.words}
                selectedText={selectedText}
                agents={agents}
                activeAgentId={activeAgentId}
                onSelectAgent={onSelectAgent}
                onAddAgent={onAddAgent}
                onApplyHeadline={onChangeTitle}
                onReplaceSelection={handleReplaceSelectionFromAI}
                onInsertHtml={handleInsertHtmlFromAI}
                onReplaceFullDraft={(t, h) => {
                  handleReplaceFullDraftFromAI(t, h);
                  setMobileSheetOpen(false);
                }}
                onOpenSettings={() => {
                  setMobileSheetOpen(false);
                  onOpenSettings();
                }}
                onClose={() => setMobileSheetOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
