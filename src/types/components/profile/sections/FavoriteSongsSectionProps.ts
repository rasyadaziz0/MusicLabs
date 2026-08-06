import { Song } from '@/types/music';

export interface FavoriteSongsSectionProps {
  likedSongs: Song[];
  playTrack: (track: Song, queue: Song[]) => void;
}
