'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Bot,
  Check,
  FileText,
  Heading,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { WritingAgent, createWritingAgent } from '@/lib/agents';
import { markdownSnippetToHtml } from '@/lib/blog-editor';
import { CoachMessage, createCoachMessage, sendCoachMessage } from '@/lib/chat-module';
import {
  IdeaSuggestion,
  expandSectionText,
  generateBlogIdeas,
  generateFullBlogDraft,
  rewriteDraftSelection,
  runCustomPrompt,
  suggestSeoTitles,
} from '@/lib/editor-ai';
import {
  PromptTarget,
  SavedPrompt,
  createSavedPrompt,
  loadPromptLibrary,
  savePromptLibrary,
} from '@/lib/prompt-library';
import { WritingTone } from '@/lib/ui';

interface AiAssistantPanelProps {
  title: string;
  bodyHtml: string;
  tone: WritingTone;
  wordCount: number;
  selectedText: string;
  agents: WritingAgent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onAddAgent: (agent: WritingAgent) => void;
  onApplyHeadline: (nextTitle: string) => void;
  onReplaceSelection: (html: string) => boolean;
  onInsertHtml: (html: string) => void;
  onReplaceFullDraft: (nextTitle: string, html: string) => void;
  onOpenSettings: () => void;
  onClose?: () => void;
}

type AssistantTab = 'tools' | 'prompts' | 'chat';

export default function AiAssistantPanel({
  title,
  bodyHtml,
  tone,
  wordCount,
  selectedText,
  agents,
  activeAgentId,
  onSelectAgent,
  onAddAgent,
  onApplyHeadline,
  onReplaceSelection,
  onInsertHtml,
  onReplaceFullDraft,
  onOpenSettings,
  onClose,
}: AiAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<AssistantTab>('tools');
  const [topicInput, setTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [seoTitles, setSeoTitles] = useState<string[]>([]);
  const [generatedSnippet, setGeneratedSnippet] = useState<{
    label: string;
    markdown: string;
  } | null>(null);
  const [fullDraftPreview, setFullDraftPreview] = useState<{
    title: string;
    markdownBody: string;
  } | null>(null);

  const [prompts, setPrompts] = useState<SavedPrompt[]>(() => loadPromptLibrary());
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTarget, setNewPromptTarget] = useState<PromptTarget>('selection');
  const [showNewPromptForm, setShowNewPromptForm] = useState(false);

  useEffect(() => {
    const syncPrompts = () => setPrompts(loadPromptLibrary());
    window.addEventListener('ghost-bloggr-prompts-updated', syncPrompts);
    return () => window.removeEventListener('ghost-bloggr-prompts-updated', syncPrompts);
  }, []);

  const [chatHistory, setChatHistory] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('');

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? agents[0];

  const runTool = async (fn: () => Promise<void>) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await fn();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIdeas = () =>
    runTool(async () => {
      setSeoTitles([]);
      setGeneratedSnippet(null);
      setFullDraftPreview(null);
      const list = await generateBlogIdeas(topicInput || title, tone);
      setIdeas(list);
    });

  const handleSuggestTitles = () =>
    runTool(async () => {
      setIdeas([]);
      setGeneratedSnippet(null);
      setFullDraftPreview(null);
      const titles = await suggestSeoTitles(title, bodyHtml, tone);
      setSeoTitles(titles);
    });

  const handleRewrite = () =>
    runTool(async () => {
      const target = selectedText.trim() || topicInput.trim();
      if (!target) {
        throw new Error('Select text in the editor or enter a sentence above to rewrite.');
      }
      setIdeas([]);
      setSeoTitles([]);
      setFullDraftPreview(null);
      const rewritten = await rewriteDraftSelection(target, tone);
      setGeneratedSnippet({ label: `Rewritten (${tone})`, markdown: rewritten });
    });

  const handleExpand = () =>
    runTool(async () => {
      const target = selectedText.trim() || topicInput.trim();
      if (!target) {
        throw new Error('Select a heading or bullet in the editor or enter a note above to expand.');
      }
      setIdeas([]);
      setSeoTitles([]);
      setFullDraftPreview(null);
      const expanded = await expandSectionText(target, title, tone);
      setGeneratedSnippet({ label: 'Expanded Section', markdown: expanded });
    });

  const handleFullDraft = () =>
    runTool(async () => {
      const topic = topicInput.trim() || title.trim();
      if (!topic) {
        throw new Error('Enter a topic or working headline first.');
      }
      setIdeas([]);
      setSeoTitles([]);
      setGeneratedSnippet(null);
      const result = await generateFullBlogDraft({ topic, title, tone });
      setFullDraftPreview(result);
    });

  const handleRunSavedPrompt = (item: SavedPrompt) =>
    runTool(async () => {
      setIdeas([]);
      setSeoTitles([]);
      setFullDraftPreview(null);
      const result = await runCustomPrompt({
        promptInstruction: item.prompt,
        target: item.target,
        selectedText,
        topicInput,
        title,
        bodyHtml,
        tone,
      });
      setGeneratedSnippet({ label: item.name, markdown: result });
    });

  const handleSaveNewPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName.trim() || !newPromptText.trim()) return;
    const item = createSavedPrompt({
      name: newPromptName,
      prompt: newPromptText,
      target: newPromptTarget,
    });
    const next = [item, ...prompts];
    setPrompts(next);
    savePromptLibrary(next);
    window.dispatchEvent(new Event('ghost-bloggr-prompts-updated'));
    setNewPromptName('');
    setNewPromptText('');
    setShowNewPromptForm(false);
  };

  const handleDeletePrompt = (id: string) => {
    const next = prompts.filter((p) => p.id !== id);
    setPrompts(next);
    savePromptLibrary(next);
    window.dispatchEvent(new Event('ghost-bloggr-prompts-updated'));
  };

  const handleSaveNewAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;
    const created = createWritingAgent({
      name: newAgentName,
      role: newAgentRole,
      systemPrompt: newAgentPrompt,
      modelOverride: newAgentModel,
    });
    onAddAgent(created);
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentPrompt('');
    setNewAgentModel('');
    setShowNewAgentForm(false);
  };

  const handleSendChat = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? chatInput).trim();
    if (!prompt || isChatLoading) return;
    setErrorMsg(null);
    if (!overridePrompt) setChatInput('');

    const userMsg = createCoachMessage('user', prompt);
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      const reply = await sendCoachMessage({
        history: chatHistory,
        userMessage: prompt,
        draftTitle: title,
        draftHtml: bodyHtml,
        tone,
        wordCount,
      });
      const assistantMsg = createCoachMessage('assistant', reply);
      setChatHistory([...updatedHistory, assistantMsg]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not reach AI coach.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderSnippetPreview = () =>
    generatedSnippet && (
      <div className="space-y-2.5 pt-2 border-t border-[var(--gb-border)]">
        <div className="text-xs font-medium text-[var(--gb-muted)]">{generatedSnippet.label}</div>
        <div className="p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-xs text-[var(--gb-text)] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          {generatedSnippet.markdown}
        </div>
        <div className="flex items-center gap-2">
          {selectedText && (
            <button
              type="button"
              onClick={() => {
                const html = markdownSnippetToHtml(generatedSnippet.markdown);
                const replaced = onReplaceSelection(html);
                if (!replaced) onInsertHtml(html);
                setGeneratedSnippet(null);
              }}
              className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
            >
              Replace Selection
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onInsertHtml(markdownSnippetToHtml(generatedSnippet.markdown));
              setGeneratedSnippet(null);
            }}
            className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
          >
            Insert into Draft
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-[var(--gb-border)]">
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeTab === 'tools'
                ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)]'
            }`}
          >
            <Wand2 className="size-3.5" />
            <span>Tools</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeTab === 'prompts'
                ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)]'
            }`}
          >
            <Bookmark className="size-3.5" />
            <span>Prompts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeTab === 'chat'
                ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)]'
            }`}
          >
            <MessageSquare className="size-3.5" />
            <span>Chat</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="px-3.5 py-2.5 border-b border-[var(--gb-border)] bg-[var(--gb-canvas)]/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Bot className="size-3.5 text-[var(--gb-muted)] shrink-0" />
            <select
              aria-label="Active writing agent"
              value={activeAgent?.id ?? activeAgentId}
              onChange={(e) => onSelectAgent(e.target.value)}
              className="flex-1 min-w-0 rounded-full bg-[var(--gb-surface)] border border-[var(--gb-border)] px-3 py-1.5 text-xs font-medium text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)] truncate"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                  {agent.modelOverride ? ` (${agent.modelOverride})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewAgentForm((p) => !p)}
            aria-expanded={showNewAgentForm}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors shrink-0"
          >
            <Plus className="size-3" />
            <span>{showNewAgentForm ? 'Cancel' : 'Add'}</span>
          </button>
        </div>

        {activeAgent && !showNewAgentForm && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--gb-muted)] px-0.5">
            <span className="truncate">{activeAgent.role}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="underline underline-offset-2 hover:text-[var(--gb-text)] shrink-0"
            >
              Manage
            </button>
          </div>
        )}

        {showNewAgentForm && (
          <form
            onSubmit={handleSaveNewAgent}
            className="p-3 rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] space-y-2"
          >
            <div className="space-y-1">
              <label htmlFor="quick-agent-name" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                Agent Name
              </label>
              <input
                id="quick-agent-name"
                type="text"
                required
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g., Docs Reviewer"
                className="w-full rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quick-agent-role" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                Role (optional)
              </label>
              <input
                id="quick-agent-role"
                type="text"
                value={newAgentRole}
                onChange={(e) => setNewAgentRole(e.target.value)}
                placeholder="e.g., Concise engineering blog editor"
                className="w-full rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quick-agent-prompt" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                Instructions
              </label>
              <textarea
                id="quick-agent-prompt"
                rows={2}
                value={newAgentPrompt}
                onChange={(e) => setNewAgentPrompt(e.target.value)}
                placeholder="Describe how this agent should write or review..."
                className="w-full rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)] resize-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="quick-agent-model" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                Model Override (optional)
              </label>
              <input
                id="quick-agent-model"
                type="text"
                value={newAgentModel}
                onChange={(e) => setNewAgentModel(e.target.value)}
                placeholder="Leave blank for active provider model"
                className="w-full rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90"
              >
                Save &amp; Use Agent
              </button>
            </div>
          </form>
        )}
      </div>

      {errorMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-700 dark:text-red-400 flex items-start justify-between gap-2">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="underline shrink-0 font-medium text-[var(--gb-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] rounded"
          >
            Settings
          </button>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="ai-topic-input" className="block text-xs font-medium text-[var(--gb-muted)]">
                Topic, outline note, or instruction
              </label>
              {topicInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPromptText(topicInput.trim());
                    setShowNewPromptForm(true);
                    setActiveTab('prompts');
                  }}
                  className="text-[11px] font-medium text-[var(--gb-muted)] hover:text-[var(--gb-text)] underline underline-offset-2"
                >
                  Save to Library
                </button>
              )}
            </div>
            <textarea
              id="ai-topic-input"
              rows={2}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g., Why small engineering teams ship faster with fewer meetings"
              className="w-full rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)] resize-none"
            />
            <div className="text-xs text-[var(--gb-muted)] flex items-center justify-between">
              <span>Tone: {tone}</span>
              <span>
                {selectedText ? `${selectedText.split(/\s+/).length} words selected` : 'No selection'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerateIdeas}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] disabled:opacity-50 transition-colors"
            >
              <Lightbulb className="size-3.5 text-[var(--gb-muted)] shrink-0" />
              <span className="truncate">Ideas</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleSuggestTitles}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] disabled:opacity-50 transition-colors"
            >
              <Heading className="size-3.5 text-[var(--gb-muted)] shrink-0" />
              <span className="truncate">SEO Titles</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleRewrite}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="size-3.5 text-[var(--gb-muted)] shrink-0" />
              <span className="truncate">Rewrite</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleExpand}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] disabled:opacity-50 transition-colors"
            >
              <Maximize2 className="size-3.5 text-[var(--gb-muted)] shrink-0" />
              <span className="truncate">Expand</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleFullDraft}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="size-3.5" />
                <span>Generate Full Blog Post</span>
              </>
            )}
          </button>

          {ideas.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--gb-border)]">
              <div className="text-xs font-medium text-[var(--gb-muted)]">Article Ideas</div>
              <div className="space-y-2">
                {ideas.map((idea, idx) => (
                  <button
                    key={`${idea.title}-${idx}`}
                    type="button"
                    onClick={() => {
                      onApplyHeadline(idea.title);
                      if (idea.angle) {
                        onInsertHtml(markdownSnippetToHtml(`<p>${idea.angle}</p>`));
                      }
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] hover:bg-[var(--gb-hover)] transition-colors space-y-1"
                  >
                    <div className="text-xs font-semibold text-[var(--gb-text)]">{idea.title}</div>
                    {idea.angle && (
                      <div className="text-xs text-[var(--gb-muted)] leading-relaxed">{idea.angle}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {seoTitles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--gb-border)]">
              <div className="text-xs font-medium text-[var(--gb-muted)]">Click to Use Headline</div>
              <div className="space-y-1.5">
                {seoTitles.map((suggestion, idx) => (
                  <button
                    key={`${suggestion}-${idx}`}
                    type="button"
                    onClick={() => onApplyHeadline(suggestion)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] hover:bg-[var(--gb-hover)] text-xs font-medium text-[var(--gb-text)] flex items-center justify-between gap-2 transition-colors"
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="size-3.5 text-[var(--gb-muted)] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderSnippetPreview()}

          {fullDraftPreview && (
            <div className="space-y-2.5 pt-2 border-t border-[var(--gb-border)]">
              <div className="text-xs font-medium text-[var(--gb-muted)]">Generated Draft Preview</div>
              <div className="p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-2 max-h-64 overflow-y-auto">
                <div className="text-sm font-semibold text-[var(--gb-text)]">{fullDraftPreview.title}</div>
                <div className="text-xs text-[var(--gb-muted)] whitespace-pre-wrap leading-relaxed">
                  {fullDraftPreview.markdownBody}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const html = markdownSnippetToHtml(fullDraftPreview.markdownBody);
                    onReplaceFullDraft(fullDraftPreview.title, html);
                    setFullDraftPreview(null);
                  }}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
                >
                  Apply to Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setFullDraftPreview(null)}
                  className="px-3 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-[var(--gb-text)]">Prompt Library</h3>
              <p className="text-[11px] text-[var(--gb-muted)]">
                Save and reuse prompts for repetitive tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewPromptForm((p) => !p)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors shrink-0"
            >
              <Plus className="size-3.5" />
              <span>{showNewPromptForm ? 'Cancel' : 'New'}</span>
            </button>
          </div>

          {showNewPromptForm && (
            <form
              onSubmit={handleSaveNewPrompt}
              className="p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-2.5"
            >
              <div className="space-y-1">
                <label htmlFor="prompt-name-input" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                  Prompt Name
                </label>
                <input
                  id="prompt-name-input"
                  type="text"
                  required
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g., Weekly Newsletter Intro"
                  className="w-full rounded-lg bg-[var(--gb-surface)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prompt-body-input" className="block text-[11px] font-medium text-[var(--gb-muted)]">
                  Instruction
                </label>
                <textarea
                  id="prompt-body-input"
                  rows={3}
                  required
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Describe exactly what the AI should do..."
                  className="w-full rounded-lg bg-[var(--gb-surface)] border border-[var(--gb-border)] px-2.5 py-1.5 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)] resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <select
                  aria-label="Prompt target"
                  value={newPromptTarget}
                  onChange={(e) => setNewPromptTarget(e.target.value as PromptTarget)}
                  className="rounded-full bg-[var(--gb-surface)] border border-[var(--gb-border)] px-2.5 py-1.5 text-[11px] text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
                >
                  <option value="selection">Target: Selection / Note</option>
                  <option value="draft">Target: Full Draft</option>
                </select>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[var(--gb-muted)]">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Running prompt...</span>
            </div>
          )}

          {renderSnippetPreview()}

          {prompts.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--gb-muted)]">
              No saved prompts yet. Click New to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {prompts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--gb-text)] truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--gb-muted)]">
                        {item.target === 'draft' ? 'Applies to full draft' : 'Applies to selection or note'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(item.id)}
                      aria-label={`Delete ${item.name}`}
                      className="size-7 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-[var(--gb-hover)] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--gb-muted)] leading-relaxed line-clamp-3">
                    {item.prompt}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleRunSavedPrompt(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 disabled:opacity-50"
                    >
                      <Play className="size-3" />
                      <span>Run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTopicInput(item.prompt);
                        setActiveTab('tools');
                      }}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]"
                    >
                      Load in Tools
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-[var(--gb-border)] text-xs text-[var(--gb-muted)] truncate">
            Context: {title.trim() || 'Untitled'} · {wordCount} words · {tone}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="space-y-3 py-4">
                <p className="text-xs text-[var(--gb-muted)] leading-relaxed">
                  Ask your writing coach for structural feedback, stronger transitions, or a draft paragraph tailored to your current article.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Review my opening hook',
                    'Suggest 3 subheadings',
                    'Tighten my conclusion',
                  ].map((quickPrompt) => (
                    <button
                      key={quickPrompt}
                      type="button"
                      onClick={() => handleSendChat(quickPrompt)}
                      className="px-3 py-1.5 rounded-full text-xs bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                    >
                      {quickPrompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                        : 'bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-[var(--gb-text)]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => {
                        onInsertHtml(markdownSnippetToHtml(msg.content));
                        setCopiedId(msg.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="size-3" />
                          <span>Inserted</span>
                        </>
                      ) : (
                        <span>Insert into Draft</span>
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--gb-muted)]">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-3 border-t border-[var(--gb-border)] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about structure, clarity, or tone..."
              className="flex-1 min-w-0 rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2 text-xs text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatLoading}
              aria-label="Send message"
              className="size-9 rounded-full flex items-center justify-center bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
