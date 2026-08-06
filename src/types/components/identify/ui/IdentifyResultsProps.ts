import { Song } from '@/types/music';
import { IdentifyMode } from '@/types/hooks/identify';

export interface IdentifyResultsProps {
  mode: IdentifyMode;
  matchedSong: Song | null;
  speechResults: Song[];
  speechTranscript: string;
  onPlay: (song: Song) => void;
  onSearch: (title: string, artist: string) => void;
  onReset: () => void;
}
