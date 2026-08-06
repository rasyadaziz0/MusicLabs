import { Song } from '@/types/music';

export interface AddToQueueButtonProps {
  track: Song;
  className?: string;
  showText?: boolean;
}
