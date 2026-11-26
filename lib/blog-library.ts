import { computeEditorMetrics, extractExcerpt } from './blog-editor';
import { sanitizeEditorHtml } from './sanitize';
import { WritingTone } from './ui';

export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  contentHtml: string;
  excerpt: string;
  tone: WritingTone;
  status: PostStatus;
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: number;
  updatedAt: number;
}

export type LibrarySortField = 'updatedAt' | 'title' | 'wordCount';
export type LibraryStatusFilter = 'all' | PostStatus;

const LIBRARY_STORAGE_KEY = 'ghost_bloggr_library_v1';

const SEED_POSTS: BlogPost[] = [
  {
    id: 'seed-quiet-software',
    title: 'Why Quiet Writing Tools Help You Finish More Drafts',
    contentHtml:
      '<p>Most modern editors ask for your attention before you have written a single sentence. Sidebars slide in, badges blink, and formatting palettes compete with the blank page.</p><h2>Fewer decisions at the start</h2><p>When a writing tool strips away chrome, you spend your early energy on structure and argument instead of layout tweaks. A clear headline, readable line height, and predictable spacing keep momentum steady.</p><blockquote><p>The best writing environment disappears ten seconds after you start typing.</p></blockquote><h2>Editing as a separate pass</h2><p>Drafting and tightening use different parts of your brain. Write the first pass cleanly, then review headings, examples, and word count once the whole arc is visible.</p>',
    excerpt:
      'Most modern editors ask for your attention before you have written a single sentence. Sidebars slide in, badges blink, and formatting palettes compete with the blank page.',
    tone: 'Editorial',
    status: 'published',
    wordCount: 118,
    readingTimeMinutes: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'seed-local-first-notes',
    title: 'Notes on Building Local-First Web Apps',
    contentHtml:
      '<p>Keeping user drafts in the browser changes how fast an app feels. Every keystroke saves immediately without waiting on a round trip.</p><h2>Practical storage boundaries</h2><p>Resize local images before embedding them as data URLs, keep exported HTML self-contained, and treat server requests as optional helpers rather than gates around your own text.</p><pre><code>const draft = JSON.parse(localStorage.getItem("draft") ?? "{}");</code></pre><p>Simple formats age well because you can inspect and export your archive anytime.</p>',
    excerpt:
      'Keeping user drafts in the browser changes how fast an app feels. Every keystroke saves immediately without waiting on a round trip.',
    tone: 'Technical',
    status: 'draft',
    wordCount: 89,
    readingTimeMinutes: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
];

export function loadLibraryPosts(): BlogPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLibraryPosts(posts: BlogPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // Ignore storage quota errors
  }
}

export function upsertLibraryPost(
  posts: BlogPost[],
  draft: {
    id: string;
    title: string;
    contentHtml: string;
    tone: WritingTone;
    status: PostStatus;
    createdAt?: number;
  }
): BlogPost[] {
  const cleanHtml = sanitizeEditorHtml(draft.contentHtml);
  const metrics = computeEditorMetrics(draft.title, cleanHtml);
  const now = Date.now();
  const existing = posts.find((p) => p.id === draft.id);

  const updated: BlogPost = {
    id: draft.id,
    title: draft.title.trim() || 'Untitled Draft',
    contentHtml: cleanHtml,
    excerpt: extractExcerpt(cleanHtml),
    tone: draft.tone,
    status: draft.status,
    wordCount: metrics.words,
    readingTimeMinutes: metrics.readingTimeMinutes,
    createdAt: existing?.createdAt ?? draft.createdAt ?? now,
    updatedAt: now,
  };

  const next = existing
    ? posts.map((p) => (p.id === draft.id ? updated : p))
    : [updated, ...posts];

  saveLibraryPosts(next);
  return next;
}

export function deleteLibraryPost(posts: BlogPost[], id: string): BlogPost[] {
  const next = posts.filter((p) => p.id !== id);
  saveLibraryPosts(next);
  return next;
}

export function filterAndSortPosts(
  posts: BlogPost[],
  query: string,
  statusFilter: LibraryStatusFilter,
  sortBy: LibrarySortField
): BlogPost[] {
  const q = query.trim().toLowerCase();
  const filtered = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false;
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tone.toLowerCase().includes(q)
    );
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'wordCount') return b.wordCount - a.wordCount;
    return b.updatedAt - a.updatedAt;
  });
}
