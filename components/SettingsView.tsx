'use client';

import React, { useState } from 'react';
import { Bot, Check, CheckCircle2, Eye, EyeOff, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
import { WritingAgent, createWritingAgent } from '@/lib/agents';
import {
  AI_PROVIDER_PRESETS,
  AIConfig,
  AIProviderId,
  testAIConnection,
} from '@/lib/api';
import { EditorPreferences, WRITING_TONES, WritingTone } from '@/lib/ui';

interface SettingsViewProps {
  aiConfig: AIConfig;
  prefs: EditorPreferences;
  agents: WritingAgent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onAddAgent: (agent: WritingAgent) => void;
  onDeleteAgent: (id: string) => void;
  onSaveAIConfig: (next: AIConfig) => void;
  onSavePrefs: (next: EditorPreferences) => void;
  onNotify: (msg: string, variant?: 'neutral' | 'error') => void;
}

export default function SettingsView({
  aiConfig,
  prefs,
  agents,
  activeAgentId,
  onSelectAgent,
  onAddAgent,
  onDeleteAgent,
  onSaveAIConfig,
  onSavePrefs,
  onNotify,
}: SettingsViewProps) {
  const [draftConfig, setDraftConfig] = useState<AIConfig>(aiConfig);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentModel, setAgentModel] = useState('');

  const selectedPreset =
    AI_PROVIDER_PRESETS.find((p) => p.id === draftConfig.provider) ?? AI_PROVIDER_PRESETS[0];

  const handleSelectProvider = (providerId: AIProviderId) => {
    const preset = AI_PROVIDER_PRESETS.find((p) => p.id === providerId)!;
    const next: AIConfig = {
      provider: providerId,
      baseUrl: preset.defaultBaseUrl,
      apiKey: providerId === 'studio-gemini' ? '' : draftConfig.apiKey,
      model: preset.defaultModel,
    };
    setDraftConfig(next);
    setTestResult(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAIConfig(draftConfig);
    onNotify('AI provider configuration saved locally.');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testAIConnection(draftConfig);
    setTestResult(result);
    setTesting(false);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;
    const created = createWritingAgent({
      name: agentName,
      role: agentRole,
      systemPrompt: agentPrompt,
      modelOverride: agentModel,
    });
    onAddAgent(created);
    setAgentName('');
    setAgentRole('');
    setAgentPrompt('');
    setAgentModel('');
    setShowAgentForm(false);
  };

  return (
    <div className="w-full max-w-[820px] mx-auto px-4 sm:px-6 pb-12">
      <div className="bg-[var(--gb-surface)] border border-[var(--gb-border)] rounded-[16px] p-5 sm:p-8 space-y-8">
        <div className="pb-5 border-b border-[var(--gb-border)]">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gb-text)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--gb-muted)]">
            Configure your AI model connection and editor defaults. All custom keys stay in browser storage.
          </p>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--gb-text)]">
              AI Engine &amp; BYOK Configuration
            </h2>
            <p className="mt-1 text-xs text-[var(--gb-muted)]">
              Choose the built-in Gemini endpoint or connect your own OpenAI-compatible provider.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {AI_PROVIDER_PRESETS.map((preset) => {
              const active = draftConfig.provider === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectProvider(preset.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                      : 'bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[var(--gb-muted)]">{selectedPreset.description}</p>

          {draftConfig.provider === 'studio-gemini' ? (
            <div className="space-y-2">
              <label htmlFor="studio-model" className="block text-xs font-medium text-[var(--gb-muted)]">
                Model
              </label>
              <select
                id="studio-model"
                value={draftConfig.model}
                onChange={(e) => setDraftConfig({ ...draftConfig, model: e.target.value })}
                className="w-full sm:w-80 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2.5 text-sm text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              >
                <option value="gemini-4-hydrogen">gemini-4-hydrogen (Balanced &amp; Fast)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Lightweight)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="byok-base-url" className="block text-xs font-medium text-[var(--gb-muted)]">
                  OpenAI-Compatible Base URL
                </label>
                <input
                  id="byok-base-url"
                  type="url"
                  required
                  value={draftConfig.baseUrl}
                  onChange={(e) => setDraftConfig({ ...draftConfig, baseUrl: e.target.value })}
                  placeholder="https://openrouter.ai/api/v1"
                  className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2.5 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="byok-api-key" className="block text-xs font-medium text-[var(--gb-muted)]">
                    API Key (stored in localStorage)
                  </label>
                  <div className="relative">
                    <input
                      id="byok-api-key"
                      type={showKey ? 'text' : 'password'}
                      value={draftConfig.apiKey}
                      onChange={(e) => setDraftConfig({ ...draftConfig, apiKey: e.target.value })}
                      placeholder={selectedPreset.requiresKey ? 'sk-...' : 'Optional for local endpoints'}
                      className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                    />
                    <button
                      type="button"
                      aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      onClick={() => setShowKey((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)]"
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="byok-model" className="block text-xs font-medium text-[var(--gb-muted)]">
                    Custom Model ID
                  </label>
                  <input
                    id="byok-model"
                    type="text"
                    required
                    value={draftConfig.model}
                    onChange={(e) => setDraftConfig({ ...draftConfig, model: e.target.value })}
                    placeholder={selectedPreset.defaultModel}
                    className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2.5 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                  />
                </div>
              </div>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <XCircle className="size-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
            >
              Save Configuration
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] disabled:opacity-50 transition-colors"
            >
              {testing && <Loader2 className="size-3.5 animate-spin" />}
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-[var(--gb-border)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--gb-text)]">
                Writing Agents
              </h2>
              <p className="mt-1 text-xs text-[var(--gb-muted)]">
                Create and select custom AI agents with dedicated instructions and optional model overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAgentForm((p) => !p)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap"
            >
              <Plus className="size-3.5" />
              <span>{showAgentForm ? 'Cancel' : 'Add Agent'}</span>
            </button>
          </div>

          {showAgentForm && (
            <form
              onSubmit={handleCreateAgent}
              className="p-4 rounded-2xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="agent-name-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                    Agent Name
                  </label>
                  <input
                    id="agent-name-input"
                    type="text"
                    required
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g., DevRel Docs Writer"
                    className="w-full rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] px-3 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="agent-role-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                    Specialty / Role
                  </label>
                  <input
                    id="agent-role-input"
                    type="text"
                    value={agentRole}
                    onChange={(e) => setAgentRole(e.target.value)}
                    placeholder="e.g., Step-by-step developer tutorials"
                    className="w-full rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] px-3 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="agent-prompt-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                  Agent Instructions
                </label>
                <textarea
                  id="agent-prompt-input"
                  rows={3}
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  placeholder="Describe how this agent should write, structure arguments, or critique drafts..."
                  className="w-full rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] px-3 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)] resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="agent-model-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                    Model Override (optional)
                  </label>
                  <input
                    id="agent-model-input"
                    type="text"
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                    placeholder="Leave blank to use active provider model"
                    className="w-full rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] px-3 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity shrink-0"
                >
                  Save Agent
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[var(--gb-border)] rounded-2xl border border-[var(--gb-border)] bg-[var(--gb-canvas)] overflow-hidden">
            {agents.map((agent) => {
              const isActive = agent.id === activeAgentId;
              return (
                <div
                  key={agent.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Bot className="size-4 text-[var(--gb-muted)] shrink-0" />
                      <span className="text-sm font-semibold text-[var(--gb-text)] truncate">
                        {agent.name}
                      </span>
                      {agent.modelOverride && (
                        <span className="text-xs text-[var(--gb-muted)] font-mono truncate">
                          · {agent.modelOverride}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--gb-muted)]">
                      {agent.role}
                    </p>
                    {agent.systemPrompt && (
                      <p className="text-xs text-[var(--gb-muted)] line-clamp-2 pt-0.5">
                        {agent.systemPrompt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectAgent(agent.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                          : 'bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]'
                      }`}
                    >
                      {isActive && <Check className="size-3.5" />}
                      <span>{isActive ? 'Active' : 'Use Agent'}</span>
                    </button>

                    {agents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteAgent(agent.id)}
                        aria-label={`Delete ${agent.name}`}
                        className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-red-400 hover:bg-[var(--gb-hover)] transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--gb-border)] space-y-5">
          <h2 className="text-base font-semibold text-[var(--gb-text)]">
            Editor &amp; Export Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="default-tone" className="block text-xs font-medium text-[var(--gb-muted)]">
                Default Writing Tone
              </label>
              <select
                id="default-tone"
                value={prefs.defaultTone}
                onChange={(e) =>
                  onSavePrefs({ ...prefs, defaultTone: e.target.value as WritingTone })
                }
                className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2.5 text-sm text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              >
                {WRITING_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pdf-size" className="block text-xs font-medium text-[var(--gb-muted)]">
                PDF Paper Size
              </label>
              <select
                id="pdf-size"
                value={prefs.pdfFormat}
                onChange={(e) =>
                  onSavePrefs({ ...prefs, pdfFormat: e.target.value as 'a4' | 'letter' })
                }
                className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2.5 text-sm text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              >
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] cursor-pointer">
            <div>
              <div className="text-sm font-medium text-[var(--gb-text)]">Auto-save active draft</div>
              <div className="text-xs text-[var(--gb-muted)]">
                Automatically persist your headline and body text to localStorage as you type.
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.autoSave}
              onChange={(e) => onSavePrefs({ ...prefs, autoSave: e.target.checked })}
              className="size-4 accent-[var(--gb-accent)]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
