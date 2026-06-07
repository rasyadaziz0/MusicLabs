import { supabase } from './client';

// ── Types ────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// ── Follow Actions ───────────────────────────────────────────

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('Cannot follow yourself');

  // Check if already following to avoid 409 Conflict on double click or out-of-sync UI
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) return true;

  const { error } = await supabase.from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) {
    // Duplicate follow — ignore gracefully
    if (error.code === '23505') return true;
    throw error;
  }
  return true;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

// ── Follow Counts ────────────────────────────────────────────

export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followers, following] = await Promise.all([
    getFollowerCount(userId),
    getFollowingCount(userId),
  ]);
  return { followers, following };
}

// ── Follow Lists ─────────────────────────────────────────────

export async function getFollowersList(userId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles!follows_follower_id_fkey(id, username, display_name, bio, avatar_url, created_at)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row: any) => row.profiles)
    .filter(Boolean) as UserProfile[];
}

export async function getFollowingList(userId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(id, username, display_name, bio, avatar_url, created_at)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row: any) => row.profiles)
    .filter(Boolean) as UserProfile[];
}

// ── User Profile ─────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile by username:', error);
    return null;
  }

  return data as UserProfile | null;
}

// ── Public Playlists ─────────────────────────────────────────

export async function getPublicPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, description, cover_url, is_public, created_at')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Search Users ─────────────────────────────────────────────

export async function searchUsers(query: string, limit = 20): Promise<UserProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

// ── Profile Updates ──────────────────────────────────────────

export async function updateUserProfile(userId: string, updates: { username?: string; display_name?: string; bio?: string; avatar_url?: string }) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
  return true;
}
