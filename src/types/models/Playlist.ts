export interface PlaylistRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_pinned?: boolean;
  is_public?: boolean;
  is_discover_weekly?: boolean;
  discover_generated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlaylistTrackRow {
  id?: string;
  playlist_id: string;
  track_id: string;
  position: number;
}
