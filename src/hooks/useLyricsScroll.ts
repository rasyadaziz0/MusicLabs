'use client';

import { useMemo, useRef, useEffect } from 'react';
import { LrcLine } from '@/lib/utils/lrcParser';

const LYRICS_SYNC_DELAY_SEC = 0;

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

  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current) return;
    if (lines[activeIndex]?.isPlaceholder) return;
    const activeLine = scrollRef.current.querySelector(`[data-lyric-index="${activeIndex}"]`) as HTMLElement;
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, lines]);

  return { activeIndex, scrollRef };
}
