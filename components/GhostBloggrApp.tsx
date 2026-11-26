'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import {
  WritingAgent,
  loadActiveAgentId,
  loadAgents,
  saveActiveAgentId,
  saveAgents,
} from '@/lib/agents';
import { AIConfig, loadAIConfig, saveAIConfig } from '@/lib/api';
import {
  BlogPost,
  deleteLibraryPost,
  loadLibraryPosts,
  upsertLibraryPost,
} from '@/lib/blog-library';
import {
  copyPostAsMarkdown,
  downloadPostAsHtml,
  downloadPostAsMarkdown,
  downloadPostAsPdf,
} from '@/lib/export-utils';
import {
  ActiveDraft,
  createEmptyDraft,
  loadActiveDraft,
  saveActiveDraft,
} from '@/lib/publishing';
import {
  AppTab,
  EditorPreferences,
  ToastItem,
  WritingTone,
  applyThemeToDocument,
  loadPreferences,
  savePreferences,
} from '@/lib/ui';
import GhostBloggrLogo from './GhostBloggrLogo';
import LibraryView from './LibraryView';
import PWAInstallModal from './PWAInstallModal';
import ReaderModal from './ReaderModal';
import SettingsView from './SettingsView';
import TopNav from './TopNav';
import WriteCanvas from './WriteCanvas';

const emptySubscribe = () => () => {};

export default function GhostBloggrApp() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--gb-canvas)] text-[var(--gb-text)]">
        <header className="w-full max-w-[1220px] mx-auto px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-4">
          <GhostBloggrLogo size="md" priority />
        </header>
        <main className="flex-1 pt-2 px-4 sm:px-6">
          <div className="w-full max-w-[1220px] mx-auto h-[580px] rounded-[16px] bg-[var(--gb-surface)] border border-[var(--gb-border)]" />
        </main>
      </div>
    );
  }

  return <GhostBloggrStudio />;
}

function GhostBloggrStudio() {
  const [activeTab, setActiveTab] = useState<AppTab>('write');
  const [prefs, setPrefs] = useState<EditorPreferences>(() => loadPreferences());
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => loadAIConfig());
  const [agents, setAgents] = useState<WritingAgent[]>(() => loadAgents());
  const [activeAgentId, setActiveAgentId] = useState<string>(() => loadActiveAgentId());
  const [draft, setDraft] = useState<ActiveDraft>(() => loadActiveDraft(loadPreferences().defaultTone));
  const [syncVersion, setSyncVersion] = useState(0);
  const [libraryPosts, setLibraryPosts] = useState<BlogPost[]>(() => loadLibraryPosts());
  const [readerPost, setReaderPost] = useState<BlogPost | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const notify = useCallback((message: string, variant: 'neutral' | 'error' = 'neutral') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    applyThemeToDocument(prefs.theme);
  }, [prefs.theme]);

  useEffect(() => {
    if (!prefs.autoSave) return;
    const timer = setTimeout(() => {
      saveActiveDraft(draft);
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, prefs.autoSave]);

  const updatePrefs = (next: EditorPreferences) => {
    setPrefs(next);
    savePreferences(next);
    applyThemeToDocument(next.theme);
  };

  const handleToggleTheme = () => {
    const nextTheme = prefs.theme === 'dark' ? 'light' : 'dark';
    updatePrefs({ ...prefs, theme: nextTheme });
    notify(nextTheme === 'light' ? 'Switched to Light Mode.' : 'Switched to Dark Mode.');
  };

  const handleToggleFocusMode = () => {
    const nextFocus = !prefs.focusMode;
    updatePrefs({ ...prefs, focusMode: nextFocus });
    if (nextFocus) {
      setActiveTab('write');
    }
  };

  const handleSaveDraftToLibrary = () => {
    saveActiveDraft(draft);
    const nextPosts = upsertLibraryPost(libraryPosts, {
      id: draft.id,
      title: draft.title,
      contentHtml: draft.contentHtml,
      tone: draft.tone,
      status: draft.status,
      createdAt: draft.createdAt,
    });
    setLibraryPosts(nextPosts);
    setDraft((prev) => ({ ...prev, updatedAt: Date.now() }));
    notify('Draft saved to Library.');
  };

  const handlePublishPost = () => {
    const publishedDraft: ActiveDraft = {
      ...draft,
      status: 'published',
      updatedAt: Date.now(),
    };
    setDraft(publishedDraft);
    saveActiveDraft(publishedDraft);
    const nextPosts = upsertLibraryPost(libraryPosts, publishedDraft);
    setLibraryPosts(nextPosts);
    notify('Post published to local Library.');
  };

  const handleNewDraft = () => {
    const fresh = createEmptyDraft(prefs.defaultTone);
    setDraft(fresh);
    saveActiveDraft(fresh);
    setSyncVersion((v) => v + 1);
    setActiveTab('write');
    notify('Started a new draft.');
  };

  const handleEditPostFromLibrary = (post: BlogPost) => {
    const nextDraft: ActiveDraft = {
      id: post.id,
      title: post.title,
      contentHtml: post.contentHtml,
      tone: post.tone,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
    setDraft(nextDraft);
    saveActiveDraft(nextDraft);
    setSyncVersion((v) => v + 1);
    setReaderPost(null);
    setActiveTab('write');
  };

  const handleDeletePost = (id: string) => {
    const nextPosts = deleteLibraryPost(libraryPosts, id);
    setLibraryPosts(nextPosts);
    if (readerPost?.id === id) {
      setReaderPost(null);
    }
    notify('Post removed from Library.');
  };

  const handleCopyMarkdown = async (target?: {
    title: string;
    contentHtml: string;
    tone?: WritingTone;
  }) => {
    const item = target ?? draft;
    try {
      await copyPostAsMarkdown({
        title: item.title || 'Untitled Post',
        bodyHtml: item.contentHtml,
        tone: item.tone,
      });
      notify('Copied Markdown to clipboard.');
    } catch {
      notify('Could not copy Markdown to clipboard.', 'error');
    }
  };

  const handleDownloadMarkdown = (target?: {
    title: string;
    contentHtml: string;
    tone?: WritingTone;
  }) => {
    const item = target ?? draft;
    downloadPostAsMarkdown({
      title: item.title || 'Untitled Post',
      bodyHtml: item.contentHtml,
      tone: item.tone,
    });
    notify('Downloaded Markdown (.md) file.');
  };

  const handleDownloadHtml = (target?: { title: string; contentHtml: string }) => {
    const item = target ?? draft;
    downloadPostAsHtml({
      title: item.title || 'Untitled Post',
      bodyHtml: item.contentHtml,
      theme: prefs.theme,
    });
    notify('Downloaded HTML file.');
  };

  const handleDownloadPdf = async (target?: { title: string; contentHtml: string }) => {
    if (isExportingPdf) return;
    const item = target ?? draft;
    setIsExportingPdf(true);
    try {
      await downloadPostAsPdf({
        title: item.title || 'Untitled Post',
        bodyHtml: item.contentHtml,
        format: prefs.pdfFormat,
      });
      notify('Downloaded PDF file.');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'PDF export failed.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveAIConfig = (next: AIConfig) => {
    setAIConfig(next);
    saveAIConfig(next);
  };

  const handleSelectAgent = (id: string) => {
    setActiveAgentId(id);
    saveActiveAgentId(id);
    const chosen = agents.find((a) => a.id === id);
    if (chosen) {
      notify(`Switched agent to ${chosen.name}.`);
    }
  };

  const handleAddAgent = (agent: WritingAgent) => {
    const next = [agent, ...agents];
    setAgents(next);
    saveAgents(next);
    setActiveAgentId(agent.id);
    saveActiveAgentId(agent.id);
    notify(`Added and activated agent "${agent.name}".`);
  };

  const handleDeleteAgent = (id: string) => {
    if (agents.length <= 1) return;
    const next = agents.filter((a) => a.id !== id);
    setAgents(next);
    saveAgents(next);
    if (activeAgentId === id && next[0]) {
      setActiveAgentId(next[0].id);
      saveActiveAgentId(next[0].id);
    }
    notify('Agent removed.');
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'unavailable') {
        setInstallModalOpen(true);
      }
      return;
    }
    setInstallModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--gb-canvas)] text-[var(--gb-text)] transition-colors duration-150">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={prefs.theme}
        focusMode={prefs.focusMode}
        isExportingPdf={isExportingPdf}
        onToggleTheme={handleToggleTheme}
        onToggleFocusMode={handleToggleFocusMode}
        onSaveDraft={handleSaveDraftToLibrary}
        onCopyMarkdown={() => handleCopyMarkdown()}
        onDownloadMarkdown={() => handleDownloadMarkdown()}
        onDownloadHtml={() => handleDownloadHtml()}
        onDownloadPdf={() => handleDownloadPdf()}
        showInstallPWA={!isInstalled}
        onInstallPWA={handleInstallPWA}
      />

      <main className={`flex-1 ${prefs.focusMode ? 'pt-10' : 'pt-2'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'write' && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <WriteCanvas
                draftId={draft.id}
                title={draft.title}
                contentHtml={draft.contentHtml}
                tone={draft.tone}
                status={draft.status}
                updatedAt={draft.updatedAt}
                syncVersion={syncVersion}
                focusMode={prefs.focusMode}
                agents={agents}
                activeAgentId={activeAgentId}
                onSelectAgent={handleSelectAgent}
                onAddAgent={handleAddAgent}
                onChangeTitle={(nextTitle) =>
                  setDraft((prev) => ({ ...prev, title: nextTitle, updatedAt: Date.now() }))
                }
                onChangeContent={(nextHtml) =>
                  setDraft((prev) => ({ ...prev, contentHtml: nextHtml, updatedAt: Date.now() }))
                }
                onChangeTone={(nextTone: WritingTone) =>
                  setDraft((prev) => ({ ...prev, tone: nextTone, updatedAt: Date.now() }))
                }
                onNewDraft={handleNewDraft}
                onPublishPost={handlePublishPost}
                onSaveDraft={handleSaveDraftToLibrary}
                onOpenSettings={() => setActiveTab('settings')}
                onNotify={notify}
              />
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <LibraryView
                posts={libraryPosts}
                onOpenReader={(post) => setReaderPost(post)}
                onEditPost={handleEditPostFromLibrary}
                onDeletePost={handleDeletePost}
                onNewPost={handleNewDraft}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <SettingsView
                aiConfig={aiConfig}
                prefs={prefs}
                agents={agents}
                activeAgentId={activeAgentId}
                onSelectAgent={handleSelectAgent}
                onAddAgent={handleAddAgent}
                onDeleteAgent={handleDeleteAgent}
                onSaveAIConfig={handleSaveAIConfig}
                onSavePrefs={updatePrefs}
                onNotify={notify}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReaderModal
        post={readerPost}
        onClose={() => setReaderPost(null)}
        onEdit={handleEditPostFromLibrary}
        onDelete={handleDeletePost}
        onCopyMarkdown={(p) => handleCopyMarkdown(p)}
        onDownloadMarkdown={(p) => handleDownloadMarkdown(p)}
        onDownloadHtml={(p) => handleDownloadHtml(p)}
        onDownloadPdf={(p) => handleDownloadPdf(p)}
      />

      <PWAInstallModal
        open={installModalOpen}
        isIOS={isIOS}
        onClose={() => setInstallModalOpen(false)}
      />

      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-16 md:bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-full text-xs font-medium border shadow-lg ${
                toast.variant === 'error'
                  ? 'bg-red-950/90 border-red-500/40 text-red-200'
                  : 'bg-[var(--gb-elevated)] border-[var(--gb-border)] text-[var(--gb-text)]'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
