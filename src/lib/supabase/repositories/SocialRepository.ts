import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';
import { getSongsByIds } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { UserProfile, FollowCounts } from '@/types/profile';
import { PROFILE_COLUMNS } from './ProfileRepository';

export interface SocialFeedItem {
  id: string;
  user: UserProfile;
  track: Song;
  played_at: string;
}

export class SocialRepository {
  private static instance: SocialRepository;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): SocialRepository {
    if (!SocialRepository.instance) {
      SocialRepository.instance = new SocialRepository();
    }
    return SocialRepository.instance;
  }

  async followUser(followingId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const followerId = user.id;

    if (followerId === followingId) throw new Error('Cannot follow yourself');

    const { data: existing } = await this.supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existing) return true;

    const { error } = await this.supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) {
      if (error.code === '23505') return true;
      throw error;
    }
    return true;
  }

  async unfollowUser(followingId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const followerId = user.id;

    const { error } = await this.supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw error;
    return count ?? 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw error;
    return count ?? 0;
  }

  async getFollowCounts(userId: string): Promise<FollowCounts> {
    const [followers, following] = await Promise.all([
      this.getFollowerCount(userId),
      this.getFollowingCount(userId),
    ]);
    return { followers, following };
  }

  async getFollowers(userId: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('follows')
      .select(`
        profiles!follows_follower_id_fkey (${PROFILE_COLUMNS})
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(f => f.profiles as unknown as UserProfile).filter(Boolean);
  }

  async getFollowing(userId: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('follows')
      .select(`
        profiles!follows_following_id_fkey (${PROFILE_COLUMNS})
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(f => f.profiles as unknown as UserProfile).filter(Boolean);
  }

  async getRecentlyPlayedByFollows(userId: string): Promise<{ track: Song; played_at: string; user: UserProfile }[]> {
    const following = await this.getFollowing(userId);
    const followingIds = following.map(u => u.id);

    if (followingIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id, played_at, profiles!inner(id, username, display_name, avatar_url, show_recently_played)')
      .in('user_id', followingIds)
      .eq('profiles.show_recently_played', true)
      .order('played_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const trackIds = Array.from(new Set(data.map(item => item.track_id)));
    const songs = await getSongsByIds(trackIds);
    const songMap = new Map(songs.map(s => [s.id, s]));

    return data
      .map(item => ({
        track: songMap.get(item.track_id)!,
        played_at: item.played_at,
        user: item.profiles as unknown as UserProfile
      }))
      .filter(item => item.track);
  }

  async getSocialFeed(userId: string): Promise<SocialFeedItem[]> {
    // 1. Get following IDs
    const following = await this.getFollowing(userId);
    const followingIds = following.map(u => u.id);

    if (followingIds.length === 0) return [];

    // 2. Get recent listens from these users
    const { data: historyData } = await this.supabase
      .from('listening_history')
      .select('id, user_id, track_id, played_at, profiles(id, username, display_name, bio, avatar_url, created_at)')
      .in('user_id', followingIds)
      .order('played_at', { ascending: false })
      .limit(30);

    if (!historyData || historyData.length === 0) return [];

    // 3. Fetch song details
    const trackIds = Array.from(new Set(historyData.map((h: any) => h.track_id)));
    const songs = await getSongsByIds(trackIds);
    const songMap = new Map(songs.map((s: Song) => [s.id, s]));

    // 4. Map back
    return historyData.map((h: any) => ({
      id: h.id,
      user: h.profiles as unknown as UserProfile,
      track: songMap.get(h.track_id),
      played_at: h.played_at
    })).filter((h: any) => h.track) as SocialFeedItem[];
  }
}
