import { LrcLine } from '@/types/utils/lrc';

export interface KaraokeLineProps {
  line: LrcLine;
  currentTime: number;
  isActive: boolean;
}
