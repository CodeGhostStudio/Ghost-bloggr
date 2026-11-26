import { getActiveAgent } from './agents';

export type AIProviderId =
  | 'studio-gemini'
  | 'openrouter'
  | 'requesty'
  | 'gemini-openai'
  | 'custom';

export interface AIConfig {
  provider: AIProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AIProviderPreset {
  id: AIProviderId;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  requiresKey: boolean;
}

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'studio-gemini',
    label: 'Built-in Gemini',
    description: 'Uses the app server Gemini endpoint with no client key required.',
    defaultBaseUrl: '/api/gemini',
    defaultModel: 'gemini-4-hydrogen',
    requiresKey: false,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'OpenAI-compatible router at openrouter.ai.',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.5-flash',
    requiresKey: true,
  },
  {
    id: 'requesty',
    label: 'Requesty',
    description: 'Unified OpenAI-compatible gateway at router.requesty.ai.',
    defaultBaseUrl: 'https://router.requesty.ai/v1',
    defaultModel: 'openai/gpt-4o-mini',
    requiresKey: true,
  },
  {
    id: 'gemini-openai',
    label: 'Google Gemini (BYOK)',
    description: 'Direct OpenAI-compatible Gemini endpoint using your own key.',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    requiresKey: true,
  },
  {
    id: 'custom',
    label: 'Custom Endpoint',
    description: 'Any OpenAI-compatible /chat/completions endpoint (Ollama, LM Studio, vLLM).',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    requiresKey: false,
  },
];

const AI_CONFIG_KEY = 'ghost_bloggr_ai_config_v1';

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'studio-gemini',
  baseUrl: '/api/gemini',
  apiKey: '',
  model: 'gemini-4-hydrogen',
};

export function loadAIConfig(): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const raw = window.localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    const validProvider = AI_PROVIDER_PRESETS.some((p) => p.id === parsed.provider)
      ? (parsed.provider as AIProviderId)
      : 'studio-gemini';
    const preset = AI_PROVIDER_PRESETS.find((p) => p.id === validProvider)!;
    return {
      provider: validProvider,
      baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim() ? parsed.baseUrl.trim() : preset.defaultBaseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : preset.defaultModel,
    };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota issues
  }
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function validateHttpUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Base URL must be a valid http:// or https:// URL.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Base URL must use http:// or https://.');
  }
  return trimmed;
}

export async function generateAIText(params: {
  messages: ChatCompletionMessage[];
  systemInstruction?: string;
  config?: AIConfig;
  signal?: AbortSignal;
  skipAgentOverride?: boolean;
}): Promise<string> {
  const config = params.config ?? loadAIConfig();
  const activeAgent = params.skipAgentOverride ? null : getActiveAgent();

  const mergedSystemInstruction = [
    activeAgent?.systemPrompt ? `Agent Persona (${activeAgent.name}): ${activeAgent.systemPrompt}` : '',
    params.systemInstruction ?? '',
  ]
    .filter(Boolean)
    .join('\n\n') || undefined;

  const effectiveModel =
    (activeAgent?.modelOverride && activeAgent.modelOverride.trim()) || config.model;

  if (config.provider === 'studio-gemini') {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: params.messages,
        systemInstruction: mergedSystemInstruction,
        model: effectiveModel || 'gemini-4-hydrogen',
      }),
      signal: params.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.error || `Server AI request failed (${res.status}).`);
    }
    return (data.text ?? '').trim();
  }

  const baseUrl = validateHttpUrl(config.baseUrl);
  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const preset = AI_PROVIDER_PRESETS.find((p) => p.id === config.provider);
  if (preset?.requiresKey && !config.apiKey.trim()) {
    throw new Error(`Add your ${preset.label} API key in Settings before generating.`);
  }

  const combinedMessages: ChatCompletionMessage[] = [];
  if (mergedSystemInstruction) {
    combinedMessages.push({ role: 'system', content: mergedSystemInstruction });
  }
  combinedMessages.push(...params.messages);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }
  if (config.provider === 'openrouter' && typeof window !== 'undefined') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Ghost Bloggr';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: effectiveModel || preset?.defaultModel || 'gpt-4o-mini',
      messages: combinedMessages,
    }),
    signal: params.signal,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string } | string;
  };

  if (!res.ok) {
    const errMsg =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message || `AI endpoint returned ${res.status}.`;
    throw new Error(errMsg);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('The AI endpoint returned an empty response.');
  }
  return content.trim();
}

export async function testAIConnection(config: AIConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await generateAIText({
      config,
      skipAgentOverride: true,
      systemInstruction: 'Reply with two words: Connection ready.',
      messages: [{ role: 'user', content: 'Ping' }],
    });
    return {
      ok: true,
      message: text ? `Connected (${config.model}): "${text.slice(0, 60)}"` : `Connected to ${config.model}.`,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Connection failed.',
    };
  }
}
