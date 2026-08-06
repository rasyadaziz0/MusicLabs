import { UserProfile } from '@/types/profile';
import { Song } from '@/types/music';

export interface SocialFeedItem {
  id: string;
  user: UserProfile;
  track: Song;
  played_at: string;
}
