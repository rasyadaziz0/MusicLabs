'use client';

import { getEffectiveTime } from '@/lib/lyrics/lyricsOffsetStore';
import { UseLyricsScrollOptions, UseLyricsScrollReturn } from '@/types/hooks/lyrics';
import { useMemo, useRef } from 'react';

export function useLyricsScroll({
  lines,
  isSynced,
  currentTime,
  trackId,
  disableScroll,
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



  return { activeIndex, scrollRef };
}
