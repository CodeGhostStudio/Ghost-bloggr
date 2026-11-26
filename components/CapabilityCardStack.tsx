'use client';

import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

export interface CapabilityItem {
  number: string;
  title: string;
  description: string;
  tag: string;
}

interface CapabilityCardStackProps {
  items: CapabilityItem[];
}

export default function CapabilityCardStack({ items }: CapabilityCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const deckRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ['start end', 'end start'],
  });

  const backSpreadY = useTransform(scrollYProgress, [0, 1], [14, -8]);
  const midSpreadY = useTransform(scrollYProgress, [0, 1], [8, -4]);

  const total = items.length;
  const current = items[activeIndex];
  const nextIndex = (activeIndex + 1) % total;
  const thirdIndex = (activeIndex + 2) % total;

  const goTo = (nextIdx: number) => {
    if (nextIdx === activeIndex) return;
    setDirection(nextIdx > activeIndex ? 1 : -1);
    setActiveIndex(nextIdx);
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div ref={deckRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
      <div className="lg:col-span-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5" role="tablist" aria-label="Workspace features">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.number}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => goTo(idx)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)] ${
                  isActive
                    ? 'bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] font-semibold shadow-sm'
                    : 'border border-transparent text-[var(--gb-muted)] hover:text-[var(--gb-text)] hover:bg-[var(--gb-surface)]/50'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono tabular-nums text-[11px] opacity-75 shrink-0">
                    {item.number}
                  </span>
                  <span className="truncate">{item.title}</span>
                </span>
                {isActive && <ArrowRight className="size-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous workspace card"
              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-full flex items-center justify-center bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
            >
              <ArrowLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next workspace card"
              className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-full flex items-center justify-center bg-[var(--gb-surface)] border border-[var(--gb-border)] text-[var(--gb-text)] hover:bg-[var(--gb-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
            >
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-[var(--gb-muted)]">
            0{activeIndex + 1} / 0{total}
          </span>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="relative min-h-[240px] sm:min-h-[250px] pb-7">
          <motion.div
            aria-hidden="true"
            style={{ y: shouldReduceMotion ? 0 : backSpreadY }}
            onClick={() => goTo(thirdIndex)}
            className="absolute inset-x-6 top-6 bottom-0 rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] opacity-55 scale-[0.93] rotate-[1.4deg] cursor-pointer"
          />

          <motion.div
            aria-hidden="true"
            style={{ y: shouldReduceMotion ? 0 : midSpreadY }}
            onClick={() => goTo(nextIndex)}
            className="absolute inset-x-3 top-3 bottom-3 rounded-2xl bg-[var(--gb-elevated)] border border-[var(--gb-border)] opacity-80 scale-[0.965] rotate-[0.6deg] cursor-pointer"
          />

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.button
              key={current.number}
              type="button"
              onClick={handleNext}
              aria-label={`${current.title}. Click to view next card.`}
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, x: 34 * direction, y: 10, scale: 0.96, rotate: 1.5 * direction }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: -42 * direction, y: -10, scale: 0.94, rotate: -2 * direction }
              }
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 28,
                mass: 0.85,
              }}
              className="relative z-10 w-full text-left p-5 sm:p-7 rounded-2xl bg-[var(--gb-surface)] border border-[var(--gb-border)] shadow-xl flex flex-col justify-between gap-6 min-h-[212px] sm:min-h-[220px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-[var(--gb-muted)]">
                  <span>{current.number}</span>
                  <span>{current.tag}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--gb-text)]">
                  {current.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--gb-muted)] leading-relaxed max-w-[52ch]">
                  {current.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--gb-border)] flex items-center justify-between text-xs text-[var(--gb-muted)]">
                <span>Click card to flip stack</span>
                <span className="inline-flex items-center gap-1 font-medium text-[var(--gb-text)]">
                  <span>Next</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </motion.button>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
