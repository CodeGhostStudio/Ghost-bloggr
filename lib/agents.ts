export interface WritingAgent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelOverride?: string;
  createdAt: number;
}

const AGENTS_STORAGE_KEY = 'ghost_bloggr_agents_v1';
const ACTIVE_AGENT_KEY = 'ghost_bloggr_active_agent_v1';

export const DEFAULT_AGENTS: WritingAgent[] = [
  {
    id: 'agent-general',
    name: 'General Editor',
    role: 'Balanced writing and editing assistant',
    systemPrompt: '',
    createdAt: 1700000000001,
  },
  {
    id: 'agent-technical',
    name: 'Technical Reviewer',
    role: 'Architecture, code clarity, and trade-offs',
    systemPrompt:
      'Focus on concrete implementation details, practical trade-offs, edge cases, and production-ready code clarity.',
    createdAt: 1700000000002,
  },
  {
    id: 'agent-seo',
    name: 'SEO Strategist',
    role: 'Search intent, hooks, and scannable headings',
    systemPrompt:
      'Prioritize search intent, strong opening hooks, clear H2/H3 structure, and concise takeaways readers can scan quickly.',
    createdAt: 1700000000003,
  },
];

export function loadAgents(): WritingAgent[] {
  if (typeof window === 'undefined') return DEFAULT_AGENTS;
  try {
    const raw = window.localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(DEFAULT_AGENTS));
      return DEFAULT_AGENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_AGENTS;
  } catch {
    return DEFAULT_AGENTS;
  }
}

export function saveAgents(agents: WritingAgent[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  } catch {
    // Ignore storage quota failures
  }
}

export function loadActiveAgentId(): string {
  if (typeof window === 'undefined') return DEFAULT_AGENTS[0].id;
  try {
    return window.localStorage.getItem(ACTIVE_AGENT_KEY) || DEFAULT_AGENTS[0].id;
  } catch {
    return DEFAULT_AGENTS[0].id;
  }
}

export function saveActiveAgentId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_AGENT_KEY, id);
  } catch {
    // Ignore storage quota failures
  }
}

export function getActiveAgent(): WritingAgent {
  const agents = loadAgents();
  const activeId = loadActiveAgentId();
  return agents.find((a) => a.id === activeId) ?? agents[0] ?? DEFAULT_AGENTS[0];
}

export function createWritingAgent(params: {
  name: string;
  role: string;
  systemPrompt: string;
  modelOverride?: string;
}): WritingAgent {
  const now = Date.now();
  return {
    id: `agent-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: params.name.trim(),
    role: params.role.trim() || 'Custom writing agent',
    systemPrompt: params.systemPrompt.trim(),
    modelOverride: params.modelOverride?.trim() || undefined,
    createdAt: now,
  };
}
