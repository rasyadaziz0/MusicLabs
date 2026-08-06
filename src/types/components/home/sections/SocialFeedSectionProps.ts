import { User } from '@supabase/supabase-js';

export interface SocialFeedSectionProps {
  user: User | null;
  socialFeed: any[];
  isSocialFeedLoading: boolean;
  playTrack: (song: any, context: any[]) => void;
}
