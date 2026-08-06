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
}

export interface UseLyricsScrollReturn {
  activeIndex: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}