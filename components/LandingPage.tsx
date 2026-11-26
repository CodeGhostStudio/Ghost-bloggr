'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  Download,
  FileCode2,
  FileDown,
  ImagePlus,
  ListTree,
  Moon,
  Sparkles,
  Sun,
  Terminal,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { ThemeMode, applyThemeToDocument, loadPreferences, savePreferences } from '@/lib/ui';
import CapabilityCardStack, { CapabilityItem } from './CapabilityCardStack';
import GhostBloggrLogo from './GhostBloggrLogo';
import PWAInstallModal from './PWAInstallModal';
import {
  HighlightText,
  MarqueeBadgeStrip,
  RevealText,
  StackedScrollCard,
  TypewriterText,
} from './ScrollEffects';

const emptySubscribe = () => () => {};

const REPO_URL = 'https://github.com/CodeGhostStudio/GhostBloggr.git';
const REPO_CLONE_CMD = `git clone ${REPO_URL}`;

const CAPABILITIES: CapabilityItem[] = [
  {
    number: '01.',
    title: 'Rich Text & Markdown Output',
    description:
      'Write in a clean visual editor, toggle live Markdown with frontmatter, and copy or export .md files in one click.',
    tag: 'Markdown + Frontmatter',
  },
  {
    number: '02.',
    title: 'Custom Writing Agents',
    description:
      'Define your own agents with dedicated roles, system instructions, and optional model overrides for each draft.',
    tag: 'Agent Personas',
  },
  {
    number: '03.',
    title: 'Reusable Prompt Library',
    description:
      'Save recurring outlining, rewriting, and editing instructions once and run them against selections or full posts.',
    tag: 'Saved Prompts',
  },
  {
    number: '04.',
    title: 'Developer Tone Presets',
    description:
      'Switch writing voice between Web Developer, Full Stack Developer, Technical, Editorial, Conversational, and Executive.',
    tag: '6 Writing Tones',
  },
  {
    number: '05.',
    title: 'Auto-Linked URLs & Image Drop',
    description:
      'Detect pasted or typed links into clean anchor tags automatically, and drop PNG, JPEG, WebP, or GIF images onto the canvas.',
    tag: 'Auto-Link + Image Drop',
  },
  {
    number: '06.',
    title: 'Local Library & Instant Export',
    description:
      'Auto-save every draft to browser storage, search your archive, and download standalone HTML or formatted PDF files.',
    tag: 'HTML · .md · PDF',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Pick an AI Engine or BYOK Key',
    description:
      'Start immediately with the built-in Gemini server route, or connect OpenRouter, Requesty, Google Gemini, or a local endpoint.',
    previewLabel: 'Provider: Built-in Gemini or BYOK',
  },
  {
    step: '02',
    title: 'Draft with Agents & Outline',
    description:
      'Outline sections, rewrite paragraphs, jump between H2 and H3 headings from the floating outline, and ask the coach in context.',
    previewLabel: 'Active Agent: Technical Reviewer',
  },
  {
    step: '03',
    title: 'Publish, Export, or Install',
    description:
      'Store finished articles in your local Library, export to Markdown, HTML, or PDF, or install the standalone PWA on your device.',
    previewLabel: 'Exports: .md · .html · .pdf',
  },
];

const FEATURE_MARQUEE_ITEMS = [
  'Web Developer Tone',
  'Full Stack Developer Tone',
  'Markdown & Frontmatter',
  'Custom Writing Agents',
  'Reusable Prompt Library',
  'Floating H2/H3 Outline',
  'Auto-Linked URLs',
  'Drag & Drop Images',
  'HTML & PDF Export',
  'Installable PWA',
];

const ENGINE_MARQUEE_ITEMS = [
  'Built-in Gemini',
  'OpenRouter BYOK',
  'Requesty BYOK',
  'Google Gemini BYOK',
  'Local Ollama & LM Studio',
  'Browser-Local Drafts',
  'Offline Standalone Shell',
];

export default function LandingPage() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [themeOverride, setThemeOverride] = useState<ThemeMode | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const heroShowcaseRef = useRef<HTMLDivElement>(null);
  const workflowSectionRef = useRef<HTMLElement>(null);
  const stickyAgentsRef = useRef<HTMLElement>(null);
  const installSectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress: pageProgress } = useScroll();
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroShowcaseRef,
    offset: ['start end', 'end start'],
  });
  const { scrollYProgress: workflowProgress } = useScroll({
    target: workflowSectionRef,
    offset: ['start start', 'end end'],
  });
  const { scrollYProgress: stickyScrollProgress } = useScroll({
    target: stickyAgentsRef,
    offset: ['start end', 'end start'],
  });
  const { scrollYProgress: installScrollProgress } = useScroll({
    target: installSectionRef,
    offset: ['start end', 'end start'],
  });

  const heroParallaxY = useTransform(heroScrollProgress, [0, 1], [12, -16]);
  const cardOneY = useTransform(stickyScrollProgress, [0, 1], [14, -10]);
  const cardTwoY = useTransform(stickyScrollProgress, [0, 1], [22, -16]);
  const cardThreeY = useTransform(stickyScrollProgress, [0, 1], [30, -22]);
  const installBackLayerY = useTransform(installScrollProgress, [0, 1], [10, -10]);

  const theme: ThemeMode = themeOverride ?? (isClient ? loadPreferences().theme : 'dark');

  useEffect(() => {
    applyThemeToDocument(loadPreferences().theme);
  }, []);

  const handleToggleTheme = () => {
    const current = loadPreferences();
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setThemeOverride(next);
    savePreferences({ ...current, theme: next });
    applyThemeToDocument(next);
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

  const handleCopyClone = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(REPO_CLONE_CMD);
      setCopiedClone(true);
      setTimeout(() => setCopiedClone(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--gb-canvas)] text-[var(--gb-text)] transition-colors duration-150">
      <motion.div
        aria-hidden="true"
        style={{ scaleX: shouldReduceMotion ? 0 : pageProgress, transformOrigin: '0% 50%' }}
        className="fixed top-0 inset-x-0 h-[2px] bg-[var(--gb-accent)] z-50 pointer-events-none"
      />

      <header className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-6 border-b border-[var(--gb-border)]">
        <Link
          href="/"
          aria-label="Ghost Bloggr"
          className="inline-flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] rounded-md"
        >
          <GhostBloggrLogo size="md" priority />
        </Link>

        <nav aria-label="Landing sections" className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--gb-muted)]">
          <a href="#features" className="hover:text-[var(--gb-text)] transition-colors whitespace-nowrap shrink-0">
            Features
          </a>
          <a href="#workflow" className="hover:text-[var(--gb-text)] transition-colors whitespace-nowrap shrink-0">
            Workflow
          </a>
          <a href="#agents" className="hover:text-[var(--gb-text)] transition-colors whitespace-nowrap shrink-0">
            Agents
          </a>
          <a href="#install-pwa" className="hover:text-[var(--gb-text)] transition-colors whitespace-nowrap shrink-0">
            Install PWA
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="size-8 rounded-full flex items-center justify-center bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors shrink-0"
          >
            {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>

          <Link
            href="/studio"
            className="gb-cta-btn px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
          >
            Open Ghost Bloggr
          </Link>
        </div>
      </header>

      <main>
        <section className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-12 sm:pb-14">
          <div className="max-w-2xl mx-auto text-center space-y-3.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[2.375rem] font-semibold tracking-tight leading-[1.14] text-[var(--gb-text)] text-balance">
              Focused AI writing studio for{' '}
              <span className="gb-hero-gradient-text">technical blog posts and articles</span>
            </h1>
            <p className="text-sm sm:text-[15px] text-[var(--gb-muted)] leading-relaxed max-w-[54ch] mx-auto">
              Draft in <HighlightText className="text-[var(--gb-text)] font-medium">rich text or Markdown</HighlightText>, run custom writing agents and saved prompts, and export clean HTML or PDF straight from your browser.
            </p>

            <div className="pt-1.5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/studio"
                className="gb-cta-btn w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
              >
                <span>Open Ghost Bloggr</span>
                <ArrowRight className="size-3.5 gb-cta-arrow" />
              </Link>

              {isInstalled ? (
                <Link
                  href="/studio"
                  className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap shrink-0"
                >
                  <Check className="size-3.5" />
                  <span>PWA Installed</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                >
                  <Download className="size-3.5 text-[var(--gb-muted)]" />
                  <span>Install PWA Version</span>
                </button>
              )}
            </div>

            <div className="pt-1 flex justify-center">
              <div className="max-w-full inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-[var(--gb-surface)] border border-[var(--gb-border)]">
                <Terminal className="size-3 text-[var(--gb-muted)] shrink-0" />
                <code className="font-mono text-[11px] text-[var(--gb-text)] flex items-center min-w-0">
                  <span className="text-[var(--gb-muted)] mr-1.5 shrink-0">git clone</span>
                  <TypewriterText
                    text={REPO_URL}
                    speedMs={72}
                    startDelayMs={220}
                    className="min-w-0 text-[var(--gb-text)]"
                  />
                </code>
                <button
                  type="button"
                  onClick={handleCopyClone}
                  aria-label="Copy git clone command"
                  className="min-h-[28px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
                >
                  {copiedClone ? (
                    <>
                      <Check className="size-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-[var(--gb-muted)]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--gb-muted)]">
              Built-in Gemini or BYOK API keys · Auto-saved locally · Installable standalone web app
            </p>
          </div>

          <div ref={heroShowcaseRef} className="mt-8 sm:mt-10 max-w-[900px] mx-auto">
            <motion.div
              style={{ y: shouldReduceMotion ? 0 : heroParallaxY }}
              className="rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] overflow-hidden shadow-xl"
            >
              <div className="px-4 py-2.5 border-b border-[var(--gb-border)] bg-[var(--gb-elevated)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <GhostBloggrLogo size="xs" />
                  <span className="hidden sm:inline text-[11px] text-[var(--gb-muted)]">
                    Write · Library · Settings
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--gb-muted)]">
                  <span className="hidden sm:inline">Tone: Full Stack Developer</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span>Markdown</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--gb-text)] font-medium">Publish</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[var(--gb-border)] p-4 space-y-3 bg-[var(--gb-canvas)]/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--gb-text)]">AI Assistant</span>
                    <span className="text-[var(--gb-muted)]">Tools · Prompts · Chat</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--gb-surface)] border border-[var(--gb-border)] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--gb-text)]">
                      <Bot className="size-3 text-[var(--gb-muted)]" />
                      <span>Agent: Technical Reviewer</span>
                    </div>
                    <p className="text-[11px] text-[var(--gb-muted)] leading-snug">
                      Focus on concrete trade-offs, edge cases, and clear architecture notes.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-[var(--gb-muted)]">Draft Topic</div>
                    <div className="p-2.5 rounded-lg bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[11px] text-[var(--gb-text)] leading-snug">
                      Designing idempotent webhook consumers with PostgreSQL advisory locks and retry queues.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="px-2.5 py-1.5 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-center text-[var(--gb-text)]">
                      Ideas
                    </div>
                    <div className="px-2.5 py-1.5 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-center text-[var(--gb-text)]">
                      SEO Titles
                    </div>
                    <div className="px-2.5 py-1.5 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-center text-[var(--gb-text)]">
                      Rewrite
                    </div>
                    <div className="px-2.5 py-1.5 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-center text-[var(--gb-text)]">
                      Expand
                    </div>
                  </div>

                  <Link
                    href="/studio"
                    className="block w-full py-2 rounded-full text-center text-[11px] font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity"
                  >
                    Open Live Editor
                  </Link>
                </div>

                <div className="lg:col-span-8 p-5 sm:p-6 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--gb-muted)] pb-2.5 border-b border-[var(--gb-border)]">
                    <span>642 words · 4 min read · Auto-saved</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <ListTree className="size-3" />
                        Outline
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileCode2 className="size-3" />
                        .md
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileDown className="size-3" />
                        PDF
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--gb-text)]">
                      <TypewriterText
                        text="Designing Idempotent Webhook Consumers"
                        speedMs={28}
                        startDelayMs={250}
                      />
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
                      Webhook providers retry failed deliveries on exponential schedules, which means your ingestion handler will eventually receive the same event twice. Treating delivery IDs as primary keys turns duplicate traffic into a safe no-op.
                    </p>
                    <div className="rounded-lg bg-[var(--gb-code-bg)] border border-[var(--gb-border)] p-3 font-mono text-[11px] text-[var(--gb-text)] overflow-x-auto leading-relaxed">
                      <code>
                        {`INSERT INTO webhook_events (event_id, payload)\nVALUES ($1, $2)\nON CONFLICT (event_id) DO NOTHING;`}
                      </code>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
                      Pair the deduplication write with a worker queue so HTTP endpoints respond in under 100ms while downstream jobs execute safely.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <MarqueeBadgeStrip
          items={FEATURE_MARQUEE_ITEMS}
          label="Supported writing tones, tools, and export formats"
        />

        <section id="features" className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-9 sm:py-12">
          <RevealText className="max-w-xl space-y-1.5 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--gb-text)] text-balance">
              Write, structure, and export <HighlightText>in one workspace</HighlightText>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
              Flip through the card stack or choose any capability to see how every tool connects to your draft.
            </p>
          </RevealText>

          <CapabilityCardStack items={CAPABILITIES} />
        </section>

        <section
          id="workflow"
          ref={workflowSectionRef}
          className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-[var(--gb-border)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-20 self-start space-y-4">
              <RevealText className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--gb-text)] text-balance">
                  How Ghost Bloggr works
                </h2>
                <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
                  Three focused stages take you from an initial idea or raw engineering notes to a clean published post.
                </p>
              </RevealText>

              <RevealText delay={0.08}>
                <Link
                  href="/studio"
                  className="gb-cta-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] whitespace-nowrap"
                >
                  <span>Try the Workflow</span>
                  <ArrowRight className="size-3.5 gb-cta-arrow" />
                </Link>
              </RevealText>
            </div>

            <div className="lg:col-span-7 space-y-5 pb-4">
              {WORKFLOW_STEPS.map((item, idx) => (
                <StackedScrollCard
                  key={item.step}
                  index={idx}
                  total={WORKFLOW_STEPS.length}
                  progress={workflowProgress}
                >
                  <div className="p-5 sm:p-6 rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] shadow-lg flex flex-col justify-between gap-4 min-h-[168px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[var(--gb-muted)]">
                        <span>Step {item.step}</span>
                        <span>0{idx + 1} / 0{WORKFLOW_STEPS.length}</span>
                      </div>
                      <h3 className="text-base font-semibold tracking-tight text-[var(--gb-text)]">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="px-3 py-2 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-[11px] font-mono text-[var(--gb-muted)] truncate">
                      {item.previewLabel}
                    </div>
                  </div>
                </StackedScrollCard>
              ))}
            </div>
          </div>
        </section>

        <MarqueeBadgeStrip
          items={ENGINE_MARQUEE_ITEMS}
          reverse
          label="Compatible AI endpoints and storage modes"
        />

        <section
          id="agents"
          ref={stickyAgentsRef}
          className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-20 self-start space-y-4">
              <RevealText className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--gb-text)] text-balance">
                  Custom agents and writing tools <HighlightText>built around your draft</HighlightText>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
                  Switch perspectives mid-article without repeating instructions.
                </p>
              </RevealText>

              <div className="space-y-3 pt-1">
                <RevealText delay={0.05} className="pb-3 border-b border-[var(--gb-border)] space-y-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--gb-text)]">
                    <Bot className="size-3.5 text-[var(--gb-muted)]" />
                    <span>Enter Custom Writing Agents</span>
                  </div>
                  <p className="text-xs text-[var(--gb-muted)] leading-relaxed">
                    Create agents like Technical Reviewer, SEO Strategist, or your own editorial persona with optional model overrides.
                  </p>
                </RevealText>

                <RevealText delay={0.1} className="pb-3 border-b border-[var(--gb-border)] space-y-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--gb-text)]">
                    <ListTree className="size-3.5 text-[var(--gb-muted)]" />
                    <span>Floating H2 &amp; H3 Outline</span>
                  </div>
                  <p className="text-xs text-[var(--gb-muted)] leading-relaxed">
                    Automatically reads your article headings so you can jump straight to any section on long technical posts.
                  </p>
                </RevealText>

                <RevealText delay={0.15} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--gb-text)]">
                    <ImagePlus className="size-3.5 text-[var(--gb-muted)]" />
                    <span>Drag-and-Drop Images &amp; Auto-Links</span>
                  </div>
                  <p className="text-xs text-[var(--gb-muted)] leading-relaxed">
                    Drop local screenshots directly onto the canvas and automatically convert pasted or typed URLs into anchor links.
                  </p>
                </RevealText>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <motion.div
                style={{ y: shouldReduceMotion ? 0 : cardOneY }}
                className="p-4 sm:p-5 rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--gb-border)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gb-text)]">
                    <Bot className="size-3.5 text-[var(--gb-muted)]" />
                    <span>01. Writing Agent Switcher</span>
                  </div>
                  <span className="text-[11px] text-[var(--gb-muted)]">Saved locally</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] font-medium">
                    <span>Technical Reviewer</span>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-[var(--gb-muted)]">
                    <span>SEO Strategist</span>
                    <span>Use Agent</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] text-[var(--gb-muted)]">
                    <span>General Editor</span>
                    <span>Use Agent</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                style={{ y: shouldReduceMotion ? 0 : cardTwoY }}
                className="p-4 sm:p-5 rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--gb-border)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gb-text)]">
                    <Sparkles className="size-3.5 text-[var(--gb-muted)]" />
                    <span>02. Reusable Prompt Library</span>
                  </div>
                  <span className="text-[11px] text-[var(--gb-muted)]">One-click run</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--gb-text)]">Tighten Technical Intro</div>
                      <div className="text-[11px] text-[var(--gb-muted)] truncate">
                        Cut filler and open with the core engineering problem.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] text-[11px] font-semibold shrink-0">
                      Run
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--gb-text)]">Convert Notes to H2 Outline</div>
                      <div className="text-[11px] text-[var(--gb-muted)] truncate">
                        Organize rough bullet notes into clear H2 and H3 headings.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] text-[11px] font-medium shrink-0">
                      Run
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                style={{ y: shouldReduceMotion ? 0 : cardThreeY }}
                className="p-4 sm:p-5 rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--gb-border)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gb-text)]">
                    <ListTree className="size-3.5 text-[var(--gb-muted)]" />
                    <span>03. Floating Outline &amp; Auto-Links</span>
                  </div>
                  <span className="text-[11px] text-[var(--gb-muted)]">Live DOM sync</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-1 text-[var(--gb-muted)]">
                    <div className="text-[var(--gb-text)] font-medium">1. Why Webhooks Duplicate</div>
                    <div className="pl-3 text-[11px]">1.1 Delivery Guarantees</div>
                    <div className="text-[var(--gb-text)] font-medium">2. Idempotency Keys in SQL</div>
                    <div className="pl-3 text-[11px]">2.1 Worker Queue Pattern</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-1.5 text-[var(--gb-muted)]">
                    <div className="text-[var(--gb-text)] font-medium">Auto-Linked URLs</div>
                    <p className="text-[11px] leading-relaxed">
                      Type or paste <span className="underline text-[var(--gb-text)]">https://github.com/CodeGhostStudio</span> and Ghost Bloggr wraps it into a clickable anchor tag.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="install-pwa"
          ref={installSectionRef}
          className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 pt-4 pb-12"
        >
          <RevealText>
            <div className="rounded-xl bg-[var(--gb-surface)] border border-[var(--gb-border)] p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 relative pt-3">
                <motion.div
                  aria-hidden="true"
                  style={{ y: shouldReduceMotion ? 0 : installBackLayerY }}
                  className="absolute inset-x-5 top-0 h-8 rounded-t-xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] opacity-60"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-2.5 top-1.5 h-8 rounded-t-xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] opacity-85"
                />
                <div className="relative p-4 sm:p-5 rounded-xl bg-[var(--gb-canvas)] border border-[var(--gb-border)] space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-lg bg-[#121212] border border-[var(--gb-border)] flex items-center justify-center p-1.5 shrink-0">
                      <GhostBloggrLogo size="icon" onDarkSurface />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[var(--gb-text)]">Ghost Bloggr</div>
                      <div className="text-[11px] text-[var(--gb-muted)]">Standalone Progressive Web App</div>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--gb-border)] space-y-1.5 text-[11px] text-[var(--gb-muted)]">
                    <div>Display: Standalone window</div>
                    <div>Storage: Local drafts, agents, and prompt library</div>
                    <div>Platforms: macOS, Windows, Linux, iOS, Android</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3.5">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--gb-text)] text-balance">
                  Install Ghost Bloggr as a <HighlightText>standalone app</HighlightText> or launch directly in your browser
                </h2>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--gb-muted)]">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--gb-text)] shrink-0" />
                    <span>Works in standalone mode with offline access to saved drafts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--gb-text)] shrink-0" />
                    <span>Uses built-in server Gemini or your own OpenAI-compatible API key</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-[var(--gb-text)] shrink-0" />
                    <span>Exports clean Markdown, standalone HTML, and formatted PDF files</span>
                  </li>
                </ul>

                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Link
                    href="/studio"
                    className="gb-cta-btn min-h-[40px] inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] whitespace-nowrap shrink-0"
                  >
                    <span>Open Ghost Bloggr</span>
                    <ArrowRight className="size-3.5 gb-cta-arrow" />
                  </Link>

                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={handleInstallPWA}
                      className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="size-3.5 text-[var(--gb-muted)]" />
                      <span>Install PWA Version</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </RevealText>
        </section>
      </main>

      <footer className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 border-t border-[var(--gb-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--gb-muted)]">
        <div className="flex items-center gap-3">
          <GhostBloggrLogo size="sm" />
          <span>Drafts, agents, prompts, and BYOK keys remain in your browser.</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/studio" className="hover:text-[var(--gb-text)] transition-colors">
            Open Studio
          </Link>
          <a href="#features" className="hover:text-[var(--gb-text)] transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-[var(--gb-text)] transition-colors">
            Workflow
          </a>
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="hover:text-[var(--gb-text)] transition-colors"
            >
              Install PWA
            </button>
          )}
        </div>
      </footer>

      <PWAInstallModal
        open={installModalOpen}
        isIOS={isIOS}
        onClose={() => setInstallModalOpen(false)}
      />
    </div>
  );
}
