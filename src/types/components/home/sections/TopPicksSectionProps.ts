import { Song } from '@/types/music';

export interface TopPicksSectionProps {
  trendingSongs: Song[];
  playTrack: (song: Song, context: Song[]) => void;
}
