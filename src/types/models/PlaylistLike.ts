export interface PlaylistLikeRow {
  user_id: string;
  playlist_id: string;
  liked_at: string;
}

export interface PlaylistSearchResult {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  like_count: number;
  track_count: number;
  owner_name?: string;
  owner_avatar?: string;
  created_at?: string;
  updated_at?: string;
}
