import { sanitizeEditorHtml } from './sanitize';
import { WritingTone } from './ui';
import { PostStatus } from './blog-library';

export interface ActiveDraft {
  id: string;
  title: string;
  contentHtml: string;
  tone: WritingTone;
  status: PostStatus;
  createdAt: number;
  updatedAt: number;
}

const ACTIVE_DRAFT_KEY = 'ghost_bloggr_active_draft_v1';

export function createEmptyDraft(defaultTone: WritingTone = 'Editorial'): ActiveDraft {
  const now = Date.now();
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return {
    id: `post-${now}-${randomPart}`,
    title: '',
    contentHtml: '',
    tone: defaultTone,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export function loadActiveDraft(defaultTone: WritingTone = 'Editorial'): ActiveDraft {
  if (typeof window === 'undefined') return createEmptyDraft(defaultTone);
  try {
    const raw = window.localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return createEmptyDraft(defaultTone);
    const parsed = JSON.parse(raw) as Partial<ActiveDraft>;
    if (!parsed.id) return createEmptyDraft(defaultTone);
    return {
      id: parsed.id,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      contentHtml: typeof parsed.contentHtml === 'string' ? sanitizeEditorHtml(parsed.contentHtml) : '',
      tone: parsed.tone ?? defaultTone,
      status: parsed.status === 'published' ? 'published' : 'draft',
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return createEmptyDraft(defaultTone);
  }
}

export function saveActiveDraft(draft: ActiveDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      ACTIVE_DRAFT_KEY,
      JSON.stringify({
        ...draft,
        contentHtml: sanitizeEditorHtml(draft.contentHtml),
        updatedAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota issues
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 15) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
