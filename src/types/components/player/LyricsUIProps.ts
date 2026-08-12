import { Song } from '@/types/music';
import { LrcLine } from '@/types/utils/lrc';

export interface LyricsUIProps {
  currentTrack: Song;
  lines: LrcLine[];
  activeIndex: number;
  isSynced: boolean;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
  hideHeader?: boolean;
  currentTime?: number;
  romanizations?: Map<number, string>;
  trackId: string | null;
}
