import { Song } from '@/types/music';

export interface ShareMoreBySectionProps {
  title: string;
  tracks: Song[];
  artistId?: string;
}
