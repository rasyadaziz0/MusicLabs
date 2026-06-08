import { SupabaseClient } from '@supabase/supabase-js';
import { Song } from '@/types/music';
import { getSongsByIds } from '@/lib/api/musicApi';

export interface LikedSongRow {
  track_id: string;
  liked_at?: string;
}

export class LikeRepository {
  constructor(private supabase: SupabaseClient) {}

  async getLikedSongs(userId: string): Promise<LikedSongRow[]> {
    const { data, error } = await this.supabase
      .from('liked_tracks')
      .select('track_id, liked_at')
      .eq('user_id', userId)
      .order('liked_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as LikedSongRow[];
  }

  async getLikedSongIds(userId: string): Promise<string[]> {
    const rows = await this.getLikedSongs(userId);
    return rows.map((row) => row.track_id);
  }

  async getLikedSongsWithDetails(userId: string): Promise<Song[]> {
    const trackIds = await this.getLikedSongIds(userId);
    if (trackIds.length === 0) return [];
    return getSongsByIds(trackIds);
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('liked_tracks')
      .select('track_id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async toggleLikedSong(userId: string, trackId: string): Promise<boolean> {
    const liked = await this.isTrackLiked(userId, trackId);

    if (liked) {
      const { error } = await this.supabase
        .from('liked_tracks')
        .delete()
        .eq('user_id', userId)
        .eq('track_id', trackId);

      if (error) throw error;
      return false;
    }

    const { error } = await this.supabase.from('liked_tracks').insert({
      user_id: userId,
      track_id: trackId,
    });

    if (error) throw error;
    return true;
  }
}
