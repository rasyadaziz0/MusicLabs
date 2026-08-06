import { Song } from '@/types/music';

export interface ArtistTopSongsProps {
  topTracks: Song[];
  isTracksLoading: boolean;
  currentTrackId?: string;
  isPlaying: boolean;
  playTrack: (song: Song, list: Song[]) => void;
}
