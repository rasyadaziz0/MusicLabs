import { Song } from '@/types/music';

export interface PersonalizedSection {
  key: string;
  title: string;
  subtitle: string;
  tracks: Song[];
}
