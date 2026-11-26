export type ThemeMode = 'dark' | 'light';
export type AppTab = 'write' | 'library' | 'settings';
export type WritingTone =
  | 'Editorial'
  | 'Technical'
  | 'Web Developer'
  | 'Full Stack Developer'
  | 'Conversational'
  | 'Concise'
  | 'Storytelling';

export const WRITING_TONES: WritingTone[] = [
  'Editorial',
  'Technical',
  'Web Developer',
  'Full Stack Developer',
  'Conversational',
  'Concise',
  'Storytelling',
];

export interface ToastItem {
  id: string;
  message: string;
  variant: 'neutral' | 'error';
}

export interface EditorPreferences {
  theme: ThemeMode;
  focusMode: boolean;
  defaultTone: WritingTone;
  autoSave: boolean;
  pdfFormat: 'a4' | 'letter';
}

const UI_PREFS_KEY = 'ghost_bloggr_ui_prefs_v1';

export const DEFAULT_PREFS: EditorPreferences = {
  theme: 'dark',
  focusMode: false,
  defaultTone: 'Editorial',
  autoSave: true,
  pdfFormat: 'a4',
};

export function loadPreferences(): EditorPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<EditorPreferences>;
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      focusMode: Boolean(parsed.focusMode),
      defaultTone: WRITING_TONES.includes(parsed.defaultTone as WritingTone)
        ? (parsed.defaultTone as WritingTone)
        : 'Editorial',
      autoSave: parsed.autoSave !== false,
      pdfFormat: parsed.pdfFormat === 'letter' ? 'letter' : 'a4',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: EditorPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota failures
  }
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
