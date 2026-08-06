import { Song } from '@/types/music';
import { User } from '@supabase/supabase-js';

export interface RecentlyPlayedSectionProps {
  recentlyPlayedSongs: Song[];
  isRecentLoading: boolean;
  user: User | null;
  playTrack: (song: Song, context: Song[]) => void;
}
