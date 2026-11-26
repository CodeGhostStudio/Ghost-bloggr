import { escapeHtmlText, sanitizeEditorHtml } from './sanitize';

export interface EditorMetrics {
  words: number;
  characters: number;
  readingTimeMinutes: number;
}

export interface OutlineHeading {
  index: number;
  level: 2 | 3;
  text: string;
}

export function extractOutlineHeadings(bodyHtml: string): OutlineHeading[] {
  const clean = sanitizeEditorHtml(bodyHtml);
  if (!clean.trim()) return [];

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    const nodes = doc.body.querySelectorAll('h2, h3');
    const headings: OutlineHeading[] = [];
    nodes.forEach((node, index) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      headings.push({
        index,
        level: node.tagName.toLowerCase() === 'h3' ? 3 : 2,
        text,
      });
    });
    return headings;
  }

  return [];
}

export function extractPlainText(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = sanitizeEditorHtml(html);
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function computeEditorMetrics(title: string, bodyHtml: string): EditorMetrics {
  const plainBody = extractPlainText(bodyHtml);
  const combined = `${title.trim()} ${plainBody}`.trim();
  const words = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
  const characters = plainBody.length;
  const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
  return { words, characters, readingTimeMinutes };
}

export function extractExcerpt(bodyHtml: string, maxLength = 155): string {
  const text = extractPlainText(bodyHtml);
  if (!text) return 'Empty draft ready for writing.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function applyInlineCommand(command: string, value?: string): void {
  if (typeof document === 'undefined') return;
  document.execCommand(command, false, value);
}

export function applyBlockFormat(tag: 'p' | 'h2' | 'h3' | 'blockquote'): void {
  if (typeof document === 'undefined') return;
  const current = document.queryCommandValue('formatBlock').toLowerCase();
  if (current === tag) {
    document.execCommand('formatBlock', false, 'p');
  } else {
    document.execCommand('formatBlock', false, tag);
  }
}

export function insertCodeBlockAtSelection(editorEl: HTMLElement | null): void {
  if (!editorEl || typeof window === 'undefined') return;
  editorEl.focus();
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || '// Write code here';
  const html = `<pre><code>${escapeHtmlText(selectedText)}</code></pre><p><br></p>`;
  document.execCommand('insertHTML', false, html);
}

export function insertHtmlAtCursor(editorEl: HTMLElement | null, html: string): void {
  if (!editorEl || typeof window === 'undefined') return;
  const cleanHtml = sanitizeEditorHtml(html);
  editorEl.focus();
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && editorEl.contains(selection.anchorNode)) {
    document.execCommand('insertHTML', false, cleanHtml);
  } else {
    editorEl.innerHTML = `${editorEl.innerHTML}${cleanHtml}`;
  }
}

export function getSelectedEditorText(editorEl: HTMLElement | null): string {
  if (!editorEl || typeof window === 'undefined') return '';
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return '';
  if (!editorEl.contains(selection.anchorNode)) return '';
  return selection.toString().trim();
}

export function replaceSelectedEditorText(editorEl: HTMLElement | null, replacementHtml: string): boolean {
  if (!editorEl || typeof window === 'undefined') return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !editorEl.contains(selection.anchorNode)) {
    return false;
  }
  if (!selection.toString().trim()) {
    return false;
  }
  const cleanHtml = sanitizeEditorHtml(replacementHtml);
  document.execCommand('insertHTML', false, cleanHtml);
  return true;
}

export function markdownSnippetToHtml(text: string): string {
  const lines = text.trim().split('\n');
  const blocks: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push(`<${listType}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${listType}>`);
    }
    listType = null;
    listItems = [];
  };

  const formatInline = (line: string) =>
    escapeHtmlText(line)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('```')) {
      flushList();
      if (inCode) {
        blocks.push(`<pre><code>${escapeHtmlText(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(`<h2>${formatInline(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(`<blockquote><p>${formatInline(trimmed.slice(2))}</p></blockquote>`);
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(formatInline(trimmed.replace(/^[-*]\s+/, '')));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(formatInline(trimmed.replace(/^\d+\.\s+/, '')));
    } else {
      flushList();
      blocks.push(`<p>${formatInline(trimmed)}</p>`);
    }
  }

  flushList();
  if (inCode && codeLines.length > 0) {
    blocks.push(`<pre><code>${escapeHtmlText(codeLines.join('\n'))}</code></pre>`);
  }

  return sanitizeEditorHtml(blocks.join(''));
}

const TRAILING_URL_PUNCTUATION = /[.,;:!?)]+$/;
const URL_BEFORE_WHITESPACE_RE = /((?:https?:\/\/|www\.)[^\s<>"'`]+)(\s)$/;
const URL_AT_END_RE = /((?:https?:\/\/|www\.)[^\s<>"'`]+)()$/;
const INLINE_URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi;

export function normalizeSafeHttpUrl(rawUrl: string): { href: string; cleanDisplay: string; trailing: string } | null {
  let clean = rawUrl;
  let trailing = '';

  const trailingMatch = clean.match(TRAILING_URL_PUNCTUATION);
  if (trailingMatch) {
    // Preserve balanced closing paren if url has matching opening paren
    const candidate = clean.slice(0, -trailingMatch[0].length);
    if (trailingMatch[0].startsWith(')') && (candidate.match(/\(/g)?.length ?? 0) > (candidate.match(/\)/g)?.length ?? 0)) {
      const idx = trailingMatch[0].indexOf(')');
      clean = candidate + ')';
      trailing = trailingMatch[0].slice(idx + 1);
    } else {
      clean = candidate;
      trailing = trailingMatch[0];
    }
  }

  if (!clean) return null;
  const withScheme = clean.startsWith('www.') ? `https://${clean}` : clean;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return {
      href: parsed.toString(),
      cleanDisplay: clean,
      trailing,
    };
  } catch {
    return null;
  }
}

export function autoLinkTypedUrlBeforeCaret(
  editorEl: HTMLElement | null,
  requireTrailingSpace = true
): boolean {
  if (!editorEl || typeof window === 'undefined') return false;
  const selection = window.getSelection();
  if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE || !editorEl.contains(node)) return false;

  // Never linkify inside existing anchor, code, or pre blocks
  let parent: HTMLElement | null = node.parentElement;
  while (parent && parent !== editorEl) {
    const tag = parent.tagName.toLowerCase();
    if (tag === 'a' || tag === 'code' || tag === 'pre') {
      return false;
    }
    parent = parent.parentElement;
  }

  const textNode = node as Text;
  const offset = range.startOffset;
  const beforeCaret = (textNode.textContent ?? '').slice(0, offset);
  const afterCaret = (textNode.textContent ?? '').slice(offset);

  const pattern = requireTrailingSpace ? URL_BEFORE_WHITESPACE_RE : URL_AT_END_RE;
  const match = beforeCaret.match(pattern);
  if (!match) return false;

  const rawUrl = match[1];
  const spaceChar = match[2];
  const normalized = normalizeSafeHttpUrl(rawUrl);
  if (!normalized) return false;

  const prefixText = beforeCaret.slice(0, beforeCaret.length - rawUrl.length - spaceChar.length);
  const suffixText = `${normalized.trailing}${spaceChar}${afterCaret}`;

  const anchor = document.createElement('a');
  anchor.href = normalized.href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.textContent = normalized.cleanDisplay;

  const parentNode = textNode.parentNode;
  if (!parentNode) return false;

  const beforeTextNode = document.createTextNode(prefixText);
  const afterTextNode = document.createTextNode(suffixText);

  if (prefixText) {
    parentNode.insertBefore(beforeTextNode, textNode);
  }
  parentNode.insertBefore(anchor, textNode);
  parentNode.insertBefore(afterTextNode, textNode);
  parentNode.removeChild(textNode);

  // Place caret right after the trailing punctuation + whitespace
  const newRange = document.createRange();
  const caretPos = normalized.trailing.length + spaceChar.length;
  newRange.setStart(afterTextNode, Math.min(caretPos, afterTextNode.length));
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  return true;
}

export function convertPlainTextWithUrlsToHtml(plainText: string): string {
  const linkifySegment = (segment: string): string => {
    let result = '';
    let lastIndex = 0;
    for (const match of segment.matchAll(INLINE_URL_RE)) {
      const idx = match.index ?? 0;
      const rawUrl = match[0];
      result += escapeHtmlText(segment.slice(lastIndex, idx));
      const normalized = normalizeSafeHttpUrl(rawUrl);
      if (normalized) {
        result += `<a href="${escapeHtmlText(normalized.href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlText(normalized.cleanDisplay)}</a>${escapeHtmlText(normalized.trailing)}`;
      } else {
        result += escapeHtmlText(rawUrl);
      }
      lastIndex = idx + rawUrl.length;
    }
    result += escapeHtmlText(segment.slice(lastIndex));
    return result;
  };

  const lines = plainText.replace(/\r\n/g, '\n').split('\n');
  if (lines.length === 1) {
    return sanitizeEditorHtml(linkifySegment(lines[0]));
  }
  const html = lines
    .map((line) => (line.trim() ? `<p>${linkifySegment(line)}</p>` : '<p><br></p>'))
    .join('');
  return sanitizeEditorHtml(html);
}

export function linkifyUrlsInHtml(rawHtml: string): string {
  const clean = sanitizeEditorHtml(rawHtml);
  if (!clean || typeof DOMParser === 'undefined') return clean;

  const doc = new DOMParser().parseFromString(clean, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    let ancestor: HTMLElement | null = textNode.parentElement;
    let skip = false;
    while (ancestor && ancestor !== doc.body) {
      const tag = ancestor.tagName.toLowerCase();
      if (tag === 'a' || tag === 'code' || tag === 'pre') {
        skip = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    if (skip) continue;

    const text = textNode.textContent ?? '';
    if (!INLINE_URL_RE.test(text)) continue;
    INLINE_URL_RE.lastIndex = 0;

    const frag = doc.createDocumentFragment();
    let lastIndex = 0;
    for (const match of text.matchAll(INLINE_URL_RE)) {
      const idx = match.index ?? 0;
      const rawUrl = match[0];
      if (idx > lastIndex) {
        frag.appendChild(doc.createTextNode(text.slice(lastIndex, idx)));
      }
      const normalized = normalizeSafeHttpUrl(rawUrl);
      if (normalized) {
        const a = doc.createElement('a');
        a.href = normalized.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = normalized.cleanDisplay;
        frag.appendChild(a);
        if (normalized.trailing) {
          frag.appendChild(doc.createTextNode(normalized.trailing));
        }
      } else {
        frag.appendChild(doc.createTextNode(rawUrl));
      }
      lastIndex = idx + rawUrl.length;
    }
    if (lastIndex < text.length) {
      frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return sanitizeEditorHtml(doc.body.innerHTML);
}
