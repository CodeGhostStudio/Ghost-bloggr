import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'img',
  'figure',
  'figcaption',
  'div',
  'span',
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'class',
];

let hookRegistered = false;

function ensureDomPurifyHooks() {
  if (hookRegistered || typeof window === 'undefined') return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const target = node.getAttribute('target');
      if (target === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      } else if (target) {
        node.removeAttribute('target');
      }
    }
  });
  hookRegistered = true;
}

function sanitizeServerFallback(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button)\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpeg|jpg|gif|webp|avif);base64,))[^"]*"|'\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpeg|jpg|gif|webp|avif);base64,))[^']*')/gi, '');
}

export function sanitizeEditorHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return sanitizeServerFallback(html);
  }
  ensureDomPurifyHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,)/i,
    ALLOW_DATA_ATTR: false,
  });
}

export function escapeHtmlText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
