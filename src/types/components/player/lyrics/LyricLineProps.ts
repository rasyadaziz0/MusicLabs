import { LrcLine } from '@/types/utils/lrc';

export interface LyricLineProps {
  line: LrcLine;
  index: number;
  activeIndex: number;
  isSynced: boolean;
  romanText?: string;
  currentTime: number;
  isUserScrolling?: boolean;
  trackId: string | null;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
}
