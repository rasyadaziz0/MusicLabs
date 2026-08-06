import { Song } from '@/types/music';

export interface ResultsBottomSheetProps {
  hasResults: boolean;
  state: 'idle' | 'recording' | 'processing' | 'results' | 'no-match' | 'error';
  mode: 'audd' | 'speech';
  matchedSong: Song | null;
  rawMatch: any;
  speechResults: Song[];
  errorMessage: string;
  speech: { transcript: string };
  resetState: () => void;
  handlePlay: (song: Song, onPlayStart: () => void) => void;
  handleSearchForSong: (name: string, artistName: string) => void;
  routerBack: () => void;
}
