import { Song } from '@/types/music';
import { UserProfile } from '@/types/profile';

export interface SocialFeedItem {
  id: string;
  user: UserProfile;
  track: Song;
  played_at: string;
}
