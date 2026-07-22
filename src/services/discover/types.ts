import { Song } from '@/types/music';

export interface DiscoverSuggestion {
  title: string;
  artist: string;
}

export interface DiscoverResult {
  tracks: Song[];
  fromCache: boolean;
  generatedAt: string;
}

export interface SongProfile {
  name: string;
  artist: string;
  genre: string;
  playCount: number;
}
