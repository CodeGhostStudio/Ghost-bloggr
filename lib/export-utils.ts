import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { computeEditorMetrics } from './blog-editor';
import { escapeHtmlText, sanitizeEditorHtml } from './sanitize';
import { ThemeMode } from './ui';

function slugifyFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || 'ghost-bloggr-post';
}

export function buildStandaloneHtmlDocument(params: {
  title: string;
  bodyHtml: string;
  theme: ThemeMode;
  dateLabel?: string;
}): string {
  const safeTitle = escapeHtmlText(params.title.trim() || 'Untitled Post');
  const cleanBody = sanitizeEditorHtml(params.bodyHtml);
  const metrics = computeEditorMetrics(params.title, cleanBody);
  const isDark = params.theme === 'dark';
  const dateText = escapeHtmlText(
    params.dateLabel ||
      new Date().toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 48px 20px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: ${isDark ? '#121212' : '#F5F5F7'};
      color: ${isDark ? '#EAEAEA' : '#18181A'};
      line-height: 1.65;
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      background: ${isDark ? '#18181A' : '#FFFFFF'};
      border: 1px solid ${isDark ? '#2A2A2D' : '#E2E2E7'};
      border-radius: 16px;
      padding: 48px 40px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 2.25rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    .meta {
      color: ${isDark ? '#8E8E93' : '#636369'};
      font-size: 0.875rem;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid ${isDark ? '#2A2A2D' : '#E2E2E7'};
    }
    article { font-size: 1.0625rem; }
    article h2 { font-size: 1.5rem; margin: 1.75rem 0 0.75rem; letter-spacing: -0.02em; }
    article h3 { font-size: 1.25rem; margin: 1.5rem 0 0.625rem; }
    article p { margin: 0 0 1rem; }
    article ul, article ol { padding-left: 1.5rem; margin: 0 0 1rem; }
    article blockquote {
      margin: 1.25rem 0;
      padding: 1rem 1.25rem;
      background: ${isDark ? '#1F1F23' : '#F4F4F6'};
      border: 1px solid ${isDark ? '#2A2A2D' : '#E2E2E7'};
      border-radius: 12px;
      font-style: italic;
    }
    article pre {
      background: ${isDark ? '#141416' : '#F0F0F4'};
      border: 1px solid ${isDark ? '#2A2A2D' : '#E2E2E7'};
      border-radius: 12px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.875rem;
    }
    article code {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 0.875em;
    }
    article img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      display: block;
      margin: 1.25rem 0;
    }
    article figure { margin: 1.5rem 0; }
    article figcaption {
      font-size: 0.8125rem;
      color: ${isDark ? '#8E8E93' : '#636369'};
      text-align: center;
      margin-top: 0.5rem;
    }
    @media (max-width: 640px) {
      body { padding: 16px 12px; }
      main { padding: 28px 20px; }
      h1 { font-size: 1.75rem; }
    }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <div class="meta">${dateText} &middot; ${metrics.words} words &middot; ${metrics.readingTimeMinutes} min read</div>
    <article>${cleanBody || '<p></p>'}</article>
  </main>
</body>
</html>`;
}

export function downloadPostAsHtml(params: {
  title: string;
  bodyHtml: string;
  theme: ThemeMode;
}): void {
  const doc = buildStandaloneHtmlDocument(params);
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyFilename(params.title)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadPostAsPdf(params: {
  title: string;
  bodyHtml: string;
  format?: 'a4' | 'letter';
}): Promise<void> {
  const safeTitle = escapeHtmlText(params.title.trim() || 'Untitled Post');
  const cleanBody = sanitizeEditorHtml(params.bodyHtml);
  const metrics = computeEditorMetrics(params.title, cleanBody);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '720px';
  container.style.padding = '48px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#18181A';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  container.style.lineHeight = '1.65';

  container.innerHTML = `
    <h1 style="margin:0 0 10px;font-size:30px;line-height:1.25;font-weight:700;color:#18181A;">${safeTitle}</h1>
    <div style="font-size:13px;color:#636369;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid #E2E2E7;">
      ${new Date().toLocaleDateString()} &middot; ${metrics.words} words &middot; ${metrics.readingTimeMinutes} min read
    </div>
    <div style="font-size:16px;color:#18181A;">${cleanBody || '<p></p>'}</div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: params.format || 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${slugifyFilename(params.title)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function serializeInlineNodes(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\u00a0/g, ' ');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') return '\n';
  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    const alt = el.getAttribute('alt') || 'Image';
    return src ? `![${alt}](${src})` : '';
  }

  const childrenText = Array.from(el.childNodes).map(serializeInlineNodes).join('');

  switch (tag) {
    case 'strong':
    case 'b': {
      const trimmed = childrenText.trim();
      return trimmed ? `**${trimmed}**` : '';
    }
    case 'em':
    case 'i': {
      const trimmed = childrenText.trim();
      return trimmed ? `*${trimmed}*` : '';
    }
    case 's':
    case 'del': {
      const trimmed = childrenText.trim();
      return trimmed ? `~~${trimmed}~~` : '';
    }
    case 'code': {
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        return el.textContent ?? '';
      }
      const trimmed = childrenText.trim();
      return trimmed ? `\`${trimmed.replaceAll('`', '\\`')}\`` : '';
    }
    case 'a': {
      const href = el.getAttribute('href') || '';
      const label = childrenText.trim() || href;
      return href ? `[${label}](${href})` : label;
    }
    default:
      return childrenText;
  }
}

function serializeBlockNodes(nodes: NodeListOf<ChildNode> | ChildNode[]): string[] {
  const blocks: string[] = [];

  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (text) blocks.push(text);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') {
      const text = serializeInlineNodes(el).trim();
      if (text) blocks.push(`# ${text}`);
    } else if (tag === 'h2') {
      const text = serializeInlineNodes(el).trim();
      if (text) blocks.push(`## ${text}`);
    } else if (tag === 'h3') {
      const text = serializeInlineNodes(el).trim();
      if (text) blocks.push(`### ${text}`);
    } else if (tag === 'h4') {
      const text = serializeInlineNodes(el).trim();
      if (text) blocks.push(`#### ${text}`);
    } else if (tag === 'hr') {
      blocks.push('---');
    } else if (tag === 'pre') {
      const codeText = (el.textContent ?? '').replace(/\n+$/, '');
      blocks.push(`\`\`\`\n${codeText}\n\`\`\``);
    } else if (tag === 'blockquote') {
      const innerBlocks = serializeBlockNodes(el.childNodes);
      const quoteText = (innerBlocks.length > 0 ? innerBlocks.join('\n\n') : serializeInlineNodes(el)).trim();
      if (quoteText) {
        blocks.push(
          quoteText
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        );
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((li, idx) => {
          const prefix = tag === 'ol' ? `${idx + 1}. ` : '- ';
          const text = serializeInlineNodes(li).replace(/\s*\n\s*/g, ' ').trim();
          return text ? `${prefix}${text}` : '';
        })
        .filter(Boolean);
      if (items.length > 0) blocks.push(items.join('\n'));
    } else if (tag === 'figure') {
      const img = el.querySelector('img');
      const caption = el.querySelector('figcaption')?.textContent?.trim();
      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || caption || 'Image';
        const lines = src ? [`![${alt}](${src})`] : [];
        if (caption && caption !== alt) {
          lines.push(`*${caption}*`);
        }
        if (lines.length > 0) blocks.push(lines.join('\n'));
      }
    } else if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || 'Image';
      if (src) blocks.push(`![${alt}](${src})`);
    } else if (tag === 'p' || tag === 'div') {
      const hasBlockChildren = Array.from(el.children).some((child) =>
        ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'pre', 'figure', 'hr'].includes(
          child.tagName.toLowerCase()
        )
      );
      if (hasBlockChildren) {
        blocks.push(...serializeBlockNodes(el.childNodes));
      } else {
        const text = serializeInlineNodes(el).trim();
        if (text) blocks.push(text);
      }
    } else {
      const text = serializeInlineNodes(el).trim();
      if (text) blocks.push(text);
    }
  }

  return blocks;
}

export function htmlToMarkdownBody(bodyHtml: string): string {
  const clean = sanitizeEditorHtml(bodyHtml);
  if (!clean.trim()) return '';

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    const blocks = serializeBlockNodes(doc.body.childNodes);
    return blocks.join('\n\n').trim();
  }

  return clean
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function buildMarkdownBlogPost(params: {
  title: string;
  bodyHtml: string;
  tone?: string;
  dateLabel?: string;
  includeFrontmatter?: boolean;
}): string {
  const titleText = params.title.trim() || 'Untitled Post';
  const cleanBody = sanitizeEditorHtml(params.bodyHtml);
  const metrics = computeEditorMetrics(titleText, cleanBody);
  const bodyMd = htmlToMarkdownBody(cleanBody);
  const isoDate = params.dateLabel || new Date().toISOString().slice(0, 10);
  const includeFrontmatter = params.includeFrontmatter !== false;

  const sections: string[] = [];

  if (includeFrontmatter) {
    const escapedYamlTitle = titleText.replaceAll('"', '\\"');
    const slug = slugifyFilename(titleText);
    const fmLines = [
      '---',
      `title: "${escapedYamlTitle}"`,
      `slug: "${slug}"`,
      `date: "${isoDate}"`,
      params.tone ? `tone: "${params.tone.replaceAll('"', '\\"')}"` : null,
      `reading_time: "${metrics.readingTimeMinutes} min read"`,
      `word_count: ${metrics.words}`,
      '---',
    ].filter(Boolean);
    sections.push(fmLines.join('\n'));
  }

  sections.push(`# ${titleText}`);

  if (bodyMd) {
    sections.push(bodyMd);
  }

  return `${sections.join('\n\n')}\n`;
}

export async function copyPostAsMarkdown(params: {
  title: string;
  bodyHtml: string;
  tone?: string;
  includeFrontmatter?: boolean;
}): Promise<string> {
  const markdown = buildMarkdownBlogPost(params);
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(markdown);
      return markdown;
    } catch {
      // Fall through to textarea fallback when Clipboard API is blocked
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = markdown;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return markdown;
}

export function downloadPostAsMarkdown(params: {
  title: string;
  bodyHtml: string;
  tone?: string;
  includeFrontmatter?: boolean;
}): void {
  const markdown = buildMarkdownBlogPost(params);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyFilename(params.title)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
