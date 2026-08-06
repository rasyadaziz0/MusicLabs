import { Song } from '@/types/music';

export interface ReplayArtist {
  id: string;
  name: string;
  imageUrl: string | undefined;
  trackCount: number;
}

export interface ReplayStats {
  totalTracks: number;
  estimatedMinutes: number;
  uniqueArtists: number;
}

export interface ReplayData {
  topTracks: Song[];
  topArtists: ReplayArtist[];
  stats: ReplayStats;
}
