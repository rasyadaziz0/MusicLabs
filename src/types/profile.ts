export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  is_public: boolean;
  show_now_playing: boolean;
  show_recently_played: boolean;
  lyrics_font_size: 'small' | 'medium' | 'large';
  romanization_enabled: boolean;
  created_at: string;
}

export interface FollowCounts {
  followers: number;
  following: number;
}
