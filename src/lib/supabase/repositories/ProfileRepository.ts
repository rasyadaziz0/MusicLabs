import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';
import { UserProfile } from '@/types/profile';

export const PROFILE_COLUMNS = 'id, username, display_name, bio, avatar_url, banner_url, social_instagram, social_twitter, social_tiktok, is_public, show_now_playing, show_recently_played, lyrics_font_size, romanization_enabled, created_at';

export class ProfileRepository {
  private static instance: ProfileRepository;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): ProfileRepository {
    if (!ProfileRepository.instance) {
      ProfileRepository.instance = new ProfileRepository();
    }
    return ProfileRepository.instance;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as UserProfile;
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
    return data as UserProfile;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  async deleteAccount(userId: string): Promise<void> {
    // These should ideally be done via a Postgres function or ON DELETE CASCADE
    // but doing it explicitly here for completeness based on existing logic.
    await Promise.all([
      this.supabase.from('listening_history').delete().eq('user_id', userId),
      this.supabase.from('liked_tracks').delete().eq('user_id', userId),
      this.supabase.from('playlists').delete().eq('user_id', userId),
      this.supabase.from('follows').delete().eq('follower_id', userId),
      this.supabase.from('follows').delete().eq('following_id', userId),
      this.supabase.from('playlist_collaborators').delete().eq('user_id', userId),
    ]);
    
    // Finally delete profile (and auth user if trigger exists)
    const { error } = await this.supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  }

  async searchUsers(query: string, limit = 20): Promise<UserProfile[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await this.supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as UserProfile[];
  }
}
