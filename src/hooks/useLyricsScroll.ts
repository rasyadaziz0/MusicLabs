'use client';

import { useMemo, useRef, useEffect } from 'react';
import { getEffectiveTime } from '@/lib/lyrics/lyricsOffsetStore';
import { UseLyricsScrollOptions, UseLyricsScrollReturn } from '@/types/hooks/lyrics';
import { LyricsScroller } from '@/lib/utils/LyricsScroller';

export function useLyricsScroll({
  lines,
  isSynced,
  currentTime,
  trackId,
}: UseLyricsScrollOptions): UseLyricsScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    const effectiveTime = getEffectiveTime(currentTime, trackId);
    if (effectiveTime < lines[0].time) return -1;

    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= effectiveTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }, [currentTime, lines, isSynced, trackId]);

  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current) return;
    if (lines[activeIndex]?.isPlaceholder) return;

    const container = scrollRef.current;
    const activeLine = container.querySelector(`[data-lyric-index="${activeIndex}"]`) as HTMLElement;
    if (!activeLine) return;

    LyricsScroller.scrollToCenter(container, activeLine, 550);

    return () => {
      LyricsScroller.cleanup();
    };
  }, [activeIndex, lines]);

  return { activeIndex, scrollRef };
}
