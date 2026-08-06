import { Song } from '@/types/music';

export interface RecapContextAdapter {
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  monthLabel: string;
  topTracks: Song[];
  topArtists: any[];
  stats: any;
  hasData: boolean;
  isLoading: boolean;
  playTrack: (track: Song, queue?: Song[]) => void;
  user: any;
  signInWithGoogle: () => void;
}
