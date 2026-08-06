import { User } from '@supabase/supabase-js';

export interface MobileStationsSectionProps {
  user: User | null;
  discoverPlaylistId?: string;
}
