import { PlaylistRecord } from '@/types/models/Playlist';
import { IPlaylistLikeRepository } from '@/types/repositories/IPlaylistLikeRepository';
import { SupabaseClient } from '@supabase/supabase-js';

export class PlaylistLikeRepository implements IPlaylistLikeRepository {
  constructor(private supabase: SupabaseClient) {}

  async isLiked(userId: string, playlistId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('playlist_likes')
        .select('playlist_id')
        .eq('user_id', userId)
        .eq('playlist_id', playlistId)
        .maybeSingle();

      if (error) {
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  }

  async toggleLike(userId: string, playlistId: string): Promise<boolean> {
    const liked = await this.isLiked(userId, playlistId);

    if (liked) {
      const { error } = await this.supabase
        .from('playlist_likes')
        .delete()
        .eq('user_id', userId)
        .eq('playlist_id', playlistId);

      if (error) throw error;
      return false;
    }

    const { error } = await this.supabase.from('playlist_likes').insert({
      user_id: userId,
      playlist_id: playlistId,
    });

    if (error) throw error;
    return true;
  }

  async getLikeCount(playlistId: string): Promise<number> {
    try {
      // 1. Try reading like_count from playlists table
      const { data: playlistData, error: pError } = await this.supabase
        .from('playlists')
        .select('like_count')
        .eq('id', playlistId)
        .maybeSingle();

      if (!pError && playlistData && typeof (playlistData as any).like_count === 'number') {
        return (playlistData as any).like_count;
      }

      // 2. Fallback: count from playlist_likes table directly
      const { count, error } = await this.supabase
        .from('playlist_likes')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  async getLikedPlaylists(userId: string): Promise<PlaylistRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('playlist_likes')
        .select(`
          liked_at,
          playlists:playlist_id (
            id, user_id, name, description, cover_url, is_public, is_pinned, created_at, updated_at
          )
        `)
        .eq('user_id', userId)
        .order('liked_at', { ascending: false });

      if (error) {
        console.warn('Notice: playlist_likes query failed (migration might need to be run):', error.message);
        return [];
      }

      const playlists = (data ?? [])
        .map((row: any) => {
          if (!row.playlists) return null;
          return {
            ...row.playlists,
            is_liked: true,
          } as PlaylistRecord;
        })
        .filter(Boolean) as PlaylistRecord[];

      return playlists;
    } catch (err) {
      console.warn('Error in getLikedPlaylists:', err);
      return [];
    }
  }

  async getLikedPlaylistIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('playlist_likes')
        .select('playlist_id')
        .eq('user_id', userId);

      if (error) return [];
      return (data ?? []).map((row: any) => row.playlist_id);
    } catch {
      return [];
    }
  }
}
