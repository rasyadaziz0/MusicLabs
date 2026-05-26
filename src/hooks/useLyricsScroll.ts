'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { LrcLine } from '@/lib/utils/lrcParser';

const LYRICS_SYNC_DELAY_SEC = 0;

/* Cubic-bezier easing — easeOutQuart for a gentle deceleration */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

interface UseLyricsScrollOptions {
  lines: LrcLine[];
  isSynced: boolean;
  currentTime: number;
}

interface UseLyricsScrollReturn {
  activeIndex: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function useLyricsScroll({
  lines,
  isSynced,
  currentTime,
}: UseLyricsScrollOptions): UseLyricsScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    const lyricTime = Math.max(0, currentTime - LYRICS_SYNC_DELAY_SEC);
    if (lyricTime < lines[0].time) return -1;

    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= lyricTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }, [currentTime, lines, isSynced]);

  /* Custom smooth-scroll with easing via rAF */
  const smoothScrollTo = useCallback((container: HTMLElement, targetY: number, duration: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startY = container.scrollTop;
    const diff = targetY - startY;

    /* Skip animation for tiny movements */
    if (Math.abs(diff) < 2) {
      container.scrollTop = targetY;
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      container.scrollTop = startY + diff * eased;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current) return;
    if (lines[activeIndex]?.isPlaceholder) return;

    const container = scrollRef.current;
    const activeLine = container.querySelector(`[data-lyric-index="${activeIndex}"]`) as HTMLElement;
    if (!activeLine) return;

    /* Calculate target scroll position to centre the active line */
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const lineCenter = lineRect.top + lineRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const scrollOffset = lineCenter - containerCenter;
    const targetScroll = container.scrollTop + scrollOffset;

    smoothScrollTo(container, targetScroll, 550);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeIndex, lines, smoothScrollTo]);

  return { activeIndex, scrollRef };
}

