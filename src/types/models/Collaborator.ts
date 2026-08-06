import { UserProfile } from '@/types/profile';

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  added_at: string;
  added_by: string;
  profile: UserProfile;
}
