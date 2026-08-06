import { Song } from '@/types/music';
export interface UseMediaSessionProps {
  currentTrack: Song | null;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}