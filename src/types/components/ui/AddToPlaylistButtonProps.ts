import { Song } from '@/types/music';

export interface AddToPlaylistButtonProps {
  track: Song;
  className?: string;
  asMenuItem?: boolean;
}
