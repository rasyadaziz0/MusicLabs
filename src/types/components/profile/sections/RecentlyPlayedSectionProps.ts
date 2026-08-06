import { Song } from '@/types/music';

export interface RecentlyPlayedSectionProps {
  recentlyPlayed: Song[];
  playTrack: (track: Song, queue: Song[]) => void;
}
