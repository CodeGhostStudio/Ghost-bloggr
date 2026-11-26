export type PromptTarget = 'selection' | 'draft';

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  target: PromptTarget;
  createdAt: number;
}

const PROMPT_LIBRARY_KEY = 'ghost_bloggr_prompt_library_v1';

const STARTER_PROMPTS: SavedPrompt[] = [
  {
    id: 'starter-tldr',
    name: 'TL;DR Summary',
    prompt: 'Summarize the core takeaway in 3 concise bullet points suitable for the top of a blog post.',
    target: 'draft',
    createdAt: 1700000000001,
  },
  {
    id: 'starter-code-walkthrough',
    name: 'Technical Walkthrough',
    prompt: 'Turn this point into a practical developer walkthrough with clear step-by-step reasoning and a short code example.',
    target: 'selection',
    createdAt: 1700000000002,
  },
  {
    id: 'starter-counterargument',
    name: 'Trade-offs & Caveats',
    prompt: 'Add a balanced paragraph covering the main trade-offs, edge cases, and when not to use this approach.',
    target: 'selection',
    createdAt: 1700000000003,
  },
];

export function loadPromptLibrary(): SavedPrompt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PROMPT_LIBRARY_KEY);
    if (!raw) {
      window.localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(STARTER_PROMPTS));
      return STARTER_PROMPTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePromptLibrary(prompts: SavedPrompt[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(prompts));
  } catch {
    // Ignore quota failures
  }
}

export function createSavedPrompt(params: {
  name: string;
  prompt: string;
  target: PromptTarget;
}): SavedPrompt {
  const now = Date.now();
  return {
    id: `prompt-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: params.name.trim(),
    prompt: params.prompt.trim(),
    target: params.target,
    createdAt: now,
  };
}
