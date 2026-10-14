import { ArtistMetadata, FollowedArtist } from '@/types/models/ArtistFollow';
import { IArtistFollowRepository } from '@/types/repositories/IArtistFollowRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';

export const MAX_ARTIST_FOLLOWS = 500;

export class ArtistFollowRepository implements IArtistFollowRepository {
  private static instance: ArtistFollowRepository;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): ArtistFollowRepository {
    if (!ArtistFollowRepository.instance) {
      ArtistFollowRepository.instance = new ArtistFollowRepository();
    }
    return ArtistFollowRepository.instance;
  }

  async followArtist(artistId: string, metadata: ArtistMetadata): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Check idempotency: already following?
    const isAlreadyFollowing = await this.isFollowing(artistId);
    if (isAlreadyFollowing) {
      return true;
    }

    // 2. Check maximum limit of 500 followed artists (FOL-03)
    const { count, error: countError } = await this.supabase
      .from('artist_follows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) throw countError;

    if ((count ?? 0) >= MAX_ARTIST_FOLLOWS) {
      const error = new Error(`Kamu sudah mencapai batas follow artis (${MAX_ARTIST_FOLLOWS}). Unfollow artis lain untuk follow yang baru.`);
      (error as any).code = 'MAX_FOLLOWS_REACHED';
      throw error;
    }

    // 3. Insert record
    const { error: insertError } = await this.supabase
      .from('artist_follows')
      .insert({
        user_id: user.id,
        artist_id: artistId,
        artist_name: metadata.name,
        artist_image_url: metadata.imageUrl ?? null,
        followed_at: new Date().toISOString(),
      });

    if (insertError) {
      // 23505 = unique_violation (already followed concurrently)
      if (insertError.code === '23505') {
        return true;
      }
      throw insertError;
    }

    return true;
  }

  async unfollowArtist(artistId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('artist_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artistId);

    if (error) throw error;
    return true;
  }

  async isFollowing(artistId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await this.supabase
      .from('artist_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .maybeSingle();

    if (error) {
      console.warn('Error checking isFollowing for artist:', error);
      return false;
    }
    return Boolean(data);
  }

  async getFollowedArtists(limit: number = 50): Promise<FollowedArtist[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('artist_follows')
      .select('id, user_id, artist_id, artist_name, artist_image_url, has_station, followed_at')
      .eq('user_id', user.id)
      .order('followed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      artistId: row.artist_id,
      artistName: row.artist_name,
      artistImageUrl: row.artist_image_url,
      hasStation: row.has_station,
      followedAt: row.followed_at,
    }));
  }

  async getFollowedArtistIds(): Promise<string[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('artist_follows')
      .select('artist_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []).map((row: any) => row.artist_id);
  }

  async getFollowerCount(artistId: string): Promise<number> {
    try {
      // First attempt using RPC function (bypasses RLS)
      const { data, error } = await this.supabase.rpc('get_artist_follower_count', {
        p_artist_id: artistId,
      });

      if (!error && typeof data === 'number') {
        return data;
      }
    } catch {
      // Fallback if RPC is not deployed yet in Supabase
    }

    // Fallback: direct count query
    const { count, error } = await this.supabase
      .from('artist_follows')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    if (error) {
      console.warn('Error fetching artist follower count:', error);
      return 0;
    }

    return count ?? 0;
  }

  async updateArtistMetadata(artistId: string, metadata: ArtistMetadata): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    await this.supabase
      .from('artist_follows')
      .update({
        artist_name: metadata.name,
        artist_image_url: metadata.imageUrl ?? null,
      })
      .eq('user_id', user.id)
      .eq('artist_id', artistId);
  }

  async updateStationAvailability(artistId: string, hasStation: boolean): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    await this.supabase
      .from('artist_follows')
      .update({
        has_station: hasStation,
      })
      .eq('user_id', user.id)
      .eq('artist_id', artistId);
  }
}
