import Link from 'next/link';
import GhostBloggrLogo from '@/components/GhostBloggrLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--gb-canvas)] text-[var(--gb-text)]">
      <div className="w-full max-w-md rounded-2xl bg-[var(--gb-surface)] border border-[var(--gb-border)] p-6 sm:p-8 text-center space-y-5">
        <div className="flex justify-center">
          <GhostBloggrLogo size="md" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-mono text-[var(--gb-muted)]">404</p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--gb-text)]">
            Page not found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed">
            The page you requested does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
          >
            Back to Home
          </Link>
          <Link
            href="/studio"
            className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
          >
            Open Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
