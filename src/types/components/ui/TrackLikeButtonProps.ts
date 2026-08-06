import { Song } from '@/types/music';

export interface TrackLikeButtonProps {
  track: Song;
  className?: string;
  asMenuItem?: boolean;
}
