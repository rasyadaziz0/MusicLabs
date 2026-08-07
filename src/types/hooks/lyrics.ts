import { LrcLine } from '@/types/utils/lrc';
export interface CachedLyrics {
  lines: LrcLine[];
  isSynced: boolean;
}

export interface UseLyricsScrollOptions {
  lines: LrcLine[];
  isSynced: boolean;
  currentTime: number;
  trackId: string | null;
  disableScroll?: boolean;
}

export interface UseLyricsScrollReturn {
  activeIndex: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}