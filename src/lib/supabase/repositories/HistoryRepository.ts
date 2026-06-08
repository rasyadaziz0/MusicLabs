import { SupabaseClient } from '@supabase/supabase-js';
import { Song } from '@/types/music';
import { getSongsByIds } from '@/lib/api/musicApi';

export interface WeeklyTrackPlay {
  track_id: string;
  play_count: number;
  played_at: string;
}

export class HistoryRepository {
  constructor(private supabase: SupabaseClient) {}

  async recordRecentPlay(userId: string, trackId: string): Promise<void> {
    const { data: existing } = await this.supabase
      .from('listening_history')
      .select('id, play_count')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existing) {
      const { error } = await this.supabase
        .from('listening_history')
        .update({
          played_at: new Date().toISOString(),
          play_count: (existing.play_count ?? 1) + 1,
        })
        .eq('id', existing.id);
      if (error) console.error('Failed to update recent play:', error);
    } else {
      const { error } = await this.supabase.from('listening_history').insert({
        user_id: userId,
        track_id: trackId,
        play_count: 1,
      });
      if (error) console.error('Failed to record recent play:', error);
    }
  }

  async getRecentPlays(userId: string): Promise<Song[]> {
    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const rawIds = (data ?? []).map((row) => row.track_id);
    const uniqueIds = Array.from(new Set(rawIds)).slice(0, 15);

    if (uniqueIds.length === 0) return [];
    return getSongsByIds(uniqueIds);
  }

  async getListeningStats(userId: string): Promise<{ totalPlays: number }> {
    const { count, error } = await this.supabase
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return { totalPlays: count ?? 0 };
  }

  async getMonthlyTopTracks(
    userId: string,
    year: number,
    month: number, // 0-indexed (0 = January)
  ): Promise<{ topTracks: { track_id: string; play_count: number }[]; totals: { total_plays: number; unique_tracks: number } }> {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 1).toISOString();

    const [topTracksResult, totalsResult] = await Promise.all([
      this.supabase.rpc('get_monthly_top_tracks', {
        p_user_id: userId,
        p_start_date: start,
        p_end_date: end,
      }),
      this.supabase.rpc('get_monthly_totals', {
        p_user_id: userId,
        p_start_date: start,
        p_end_date: end,
      }),
    ]);

    if (topTracksResult.error) throw topTracksResult.error;
    if (totalsResult.error) throw totalsResult.error;

    return {
      topTracks: (topTracksResult.data ?? []) as { track_id: string; play_count: number }[],
      totals: (totalsResult.data?.[0] ?? { total_plays: 0, unique_tracks: 0 }) as { total_plays: number; unique_tracks: number },
    };
  }

  async getWeeklyListeningHistory(
    userId: string,
    days = 7,
  ): Promise<WeeklyTrackPlay[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id, play_count, played_at')
      .eq('user_id', userId)
      .gte('played_at', since.toISOString())
      .order('play_count', { ascending: false });

    if (error) throw error;
    return (data ?? []) as WeeklyTrackPlay[];
  }

  async getAllRecentTrackIds(userId: string, days = 30): Promise<Set<string>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id')
      .eq('user_id', userId)
      .gte('played_at', since.toISOString());

    if (error) throw error;
    return new Set((data ?? []).map((r) => r.track_id));
  }

  async getMostPlayedSongs(userId: string, limit = 20): Promise<Song[]> {
    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id, play_count, played_at')
      .eq('user_id', userId)
      .order('play_count', { ascending: false })
      .order('played_at', { ascending: false })
      .limit(limit * 3);

    if (error) throw error;

    const uniqueIds = Array.from(new Set((data ?? []).map((row) => row.track_id))).slice(0, limit);
    if (uniqueIds.length === 0) return [];
    return getSongsByIds(uniqueIds);
  }

  async getOlderTopSongs(
    userId: string,
    options?: { recentDays?: number; lookbackDays?: number; limit?: number }
  ): Promise<Song[]> {
    const recentDays = options?.recentDays ?? 14;
    const lookbackDays = options?.lookbackDays ?? 90;
    const limit = options?.limit ?? 20;

    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - recentDays);

    const olderSince = new Date();
    olderSince.setDate(olderSince.getDate() - lookbackDays);

    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id, play_count, played_at')
      .eq('user_id', userId)
      .gte('played_at', olderSince.toISOString())
      .lt('played_at', recentSince.toISOString())
      .order('play_count', { ascending: false })
      .order('played_at', { ascending: false })
      .limit(limit * 4);

    if (error) throw error;

    const recentIds = await this.getAllRecentTrackIds(userId, recentDays);
    const olderIds = Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.track_id)
          .filter((trackId) => !recentIds.has(trackId))
      )
    ).slice(0, limit);

    if (olderIds.length === 0) return [];
    return getSongsByIds(olderIds);
  }

  async getSongsPlayedBetweenHours(
    userId: string,
    startHour: number,
    endHour: number,
    limit = 20
  ): Promise<Song[]> {
    const { data, error } = await this.supabase
      .from('listening_history')
      .select('track_id, played_at')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit * 8);

    if (error) throw error;

    const ids = Array.from(
      new Set(
        (data ?? [])
          .filter((row) => {
            const hour = new Date(row.played_at).getHours();
            return startHour <= endHour
              ? hour >= startHour && hour < endHour
              : hour >= startHour || hour < endHour;
          })
          .map((row) => row.track_id)
      )
    ).slice(0, limit);

    if (ids.length === 0) return [];
    return getSongsByIds(ids);
  }
}
