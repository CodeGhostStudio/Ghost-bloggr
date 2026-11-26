'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MotionValue, motion, useInView, useReducedMotion, useTransform } from 'motion/react';

interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function RevealText({ children, delay = 0, className = '' }: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.48,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface TypewriterTextProps {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  showCaretAfterDone?: boolean;
}

export function TypewriterText({
  text,
  speedMs = 24,
  startDelayMs = 120,
  className = '',
  showCaretAfterDone = false,
}: TypewriterTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.35 });
  const shouldReduceMotion = useReducedMotion();
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setTypedCount((prev) => {
          if (prev >= text.length) {
            if (intervalId) clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isInView, shouldReduceMotion, text, speedMs, startDelayMs]);

  const isComplete = shouldReduceMotion || typedCount >= text.length;
  const visibleText = shouldReduceMotion ? text : text.slice(0, typedCount);

  return (
    <span ref={ref} className={`relative inline-block max-w-full align-bottom ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible select-none block truncate">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0 truncate">
        {visibleText}
        {(!isComplete || showCaretAfterDone) && <span className="gb-typewriter-caret" />}
      </span>
    </span>
  );
}

interface MarqueeBadgeStripProps {
  items: string[];
  reverse?: boolean;
  label: string;
}

export function MarqueeBadgeStrip({
  items,
  reverse = false,
  label,
}: MarqueeBadgeStripProps) {
  const repeated = [...items, ...items];

  return (
    <div
      aria-label={label}
      className="gb-marquee-group w-full border-y border-[var(--gb-border)] bg-[var(--gb-surface)]/50 py-2.5"
    >
      <div className={`gb-marquee-track ${reverse ? 'gb-marquee-track-reverse' : ''} items-center gap-2.5`}>
        {repeated.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            aria-hidden={idx >= items.length}
            className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--gb-elevated)] border border-[var(--gb-border)] text-[11px] font-medium text-[var(--gb-text)] whitespace-nowrap shrink-0"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

interface StackedScrollCardProps {
  index: number;
  total: number;
  progress: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}

export function StackedScrollCard({
  index,
  total,
  progress,
  children,
  className = '',
}: StackedScrollCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const targetScale = 1 - (total - 1 - index) * 0.035;
  const rangeStart = index / Math.max(total, 1);
  const scale = useTransform(progress, [rangeStart, 1], [1, targetScale]);
  const topOffset = 72 + index * 16;

  return (
    <div
      className="sticky"
      style={{ top: shouldReduceMotion ? undefined : `${topOffset}px` }}
    >
      <motion.div
        style={{
          scale: shouldReduceMotion ? 1 : scale,
          transformOrigin: 'top center',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface HighlightTextProps {
  children: React.ReactNode;
  className?: string;
}

export function HighlightText({ children, className = '' }: HighlightTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <span
      ref={ref}
      data-active={shouldReduceMotion || isInView ? 'true' : 'false'}
      className={`gb-highlight-text ${className}`}
    >
      {children}
    </span>
  );
}
