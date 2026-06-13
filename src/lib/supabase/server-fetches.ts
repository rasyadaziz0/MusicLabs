import { createClient } from './server';
import type { UserProfile, FollowCounts } from '@/types/profile';
import type { PlaylistRecord } from './music';

const PROFILE_COLUMNS = 'id, username, display_name, bio, avatar_url, banner_url, social_instagram, social_twitter, social_tiktok, is_public, show_now_playing, show_recently_played, lyrics_font_size, romanization_enabled, created_at';

export async function getServerProfileByUsername(username: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Server: Error fetching profile by username:', error);
    return null;
  }
  return data as UserProfile | null;
}

export async function getServerUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Server: Error fetching user profile:', error);
    return null;
  }
  return data as UserProfile;
}

export async function getServerPublicPlaylists(userId: string): Promise<PlaylistRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, description, cover_url, is_public, created_at')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Server: Error fetching public playlists:', error);
    return [];
  }
  return (data ?? []) as PlaylistRecord[];
}

export async function getServerFollowCounts(userId: string): Promise<FollowCounts> {
  const supabase = await createClient();

  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);

  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  };
}

export async function getServerIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function getServerCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getServerUserPlaylists(userId: string): Promise<PlaylistRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Server: Error fetching user playlists:', error);
    return [];
  }
  return (data ?? []) as PlaylistRecord[];
}

export async function getServerListeningStats(userId: string): Promise<{ totalPlays: number }> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('listening_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return { totalPlays: 0 };
  return { totalPlays: count ?? 0 };
}

export async function getServerLikedSongIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('liked_tracks')
    .select('track_id')
    .eq('user_id', userId)
    .order('liked_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => row.track_id);
}

export async function getServerRecentTrackIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listening_history')
    .select('track_id')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(30);

  if (error) return [];
  const rawIds = (data ?? []).map((row) => row.track_id);
  return Array.from(new Set(rawIds)).slice(0, 15);
}
