'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  BlogPost,
  LibrarySortField,
  LibraryStatusFilter,
  filterAndSortPosts,
} from '@/lib/blog-library';
import { formatRelativeTime } from '@/lib/publishing';

interface LibraryViewProps {
  posts: BlogPost[];
  onOpenReader: (post: BlogPost) => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (id: string) => void;
  onNewPost: () => void;
}

export default function LibraryView({
  posts,
  onOpenReader,
  onEditPost,
  onDeletePost,
  onNewPost,
}: LibraryViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>('all');
  const [sortBy, setSortBy] = useState<LibrarySortField>('updatedAt');

  const visiblePosts = useMemo(
    () => filterAndSortPosts(posts, query, statusFilter, sortBy),
    [posts, query, statusFilter, sortBy]
  );

  return (
    <div className="w-full max-w-[920px] mx-auto px-4 sm:px-6 pb-12">
      <div className="bg-[var(--gb-surface)] border border-[var(--gb-border)] rounded-[16px] p-5 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--gb-border)]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--gb-text)]">
              Library
            </h1>
            <p className="mt-1 text-sm text-[var(--gb-muted)]">
              Saved drafts and published posts stored locally in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewPost}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus className="size-3.5" />
            <span>New Draft</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-[var(--gb-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, excerpts, or tones..."
              aria-label="Search library posts"
              className="w-full rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)] pl-10 pr-4 py-2 text-sm text-[var(--gb-text)] placeholder:text-[var(--gb-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)]">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'published', label: 'Published' },
                  { id: 'draft', label: 'Drafts' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-[var(--gb-accent)] text-[var(--gb-accent-fg)]'
                      : 'text-[var(--gb-muted)] hover:text-[var(--gb-text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Sort posts"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LibrarySortField)}
              className="rounded-full bg-[var(--gb-canvas)] border border-[var(--gb-border)] px-3.5 py-2 text-xs font-medium text-[var(--gb-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gb-accent)]"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="title">Title (A–Z)</option>
              <option value="wordCount">Word Count</option>
            </select>
          </div>
        </div>

        {visiblePosts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-[var(--gb-muted)]">
              {posts.length === 0
                ? 'Your library has no saved posts yet.'
                : 'No posts match your current search or filter.'}
            </p>
            {posts.length === 0 ? (
              <button
                type="button"
                onClick={onNewPost}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--gb-accent)] text-[var(--gb-accent-fg)] hover:opacity-90"
              >
                Start Writing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--gb-border)]">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className="py-5 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenReader(post)}
                    className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] rounded-md"
                  >
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--gb-text)] group-hover:underline underline-offset-4">
                      {post.title}
                    </h2>
                  </button>
                  <p className="text-sm text-[var(--gb-muted)] line-clamp-2 leading-relaxed max-w-[65ch]">
                    {post.excerpt}
                  </p>
                  <div className="pt-1 text-xs text-[var(--gb-muted)] tabular-nums flex flex-wrap items-center gap-2">
                    <span className="capitalize">{post.status}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.tone}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.wordCount} words</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTimeMinutes} min read</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(post.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenReader(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                  >
                    <BookOpen className="size-3.5 text-[var(--gb-muted)]" />
                    <span>Read</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditPost(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors"
                  >
                    <Pencil className="size-3.5 text-[var(--gb-muted)]" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => onDeletePost(post.id)}
                    className="size-8 rounded-full flex items-center justify-center text-[var(--gb-muted)] hover:text-red-400 hover:bg-[var(--gb-hover)] transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
