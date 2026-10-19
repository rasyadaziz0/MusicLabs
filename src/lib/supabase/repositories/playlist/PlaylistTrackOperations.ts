import { MusicApiService } from '@/lib/api/MusicApiService';
import { PlaylistTrackRow } from '@/types/models/Playlist';
import { Song } from '@/types/music';
import { SupabaseClient } from '@supabase/supabase-js';

export class PlaylistTrackOperations {
  constructor(private supabase: SupabaseClient) { }

  public async getTrackIds(playlistId: string): Promise<PlaylistTrackRow[]> {
    const { data, error } = await this.supabase
      .from('playlist_tracks')
      .select('id, playlist_id, track_id, position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PlaylistTrackRow[];
  }

  public async getTracks(playlistId: string): Promise<Song[]> {
    const rows = await this.getTrackIds(playlistId);
    if (rows.length === 0) return [];

    const trackIds = rows.map((row) => row.track_id);
    const songs = await MusicApiService.getSongsByIds(trackIds);

    // Attach the unique playlist_track id and map back to maintain order & duplicates
    return rows
      .map((row) => {
        const song = songs.find(
          (s) =>
            s.id === row.track_id ||
            s.id === row.track_id.replace(/^itunes-/, '') ||
            `itunes-${s.id}` === row.track_id
        );
        if (!song) return null;
        return { ...song, uniqueId: row.id };
      })
      .filter(Boolean) as Song[];
  }

  public async getAllTracksForPlaylistIds(playlistIds: string[]): Promise<Song[]> {
    if (playlistIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('playlist_tracks')
      .select('id, playlist_id, track_id, position')
      .in('playlist_id', playlistIds)
      .order('position', { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as PlaylistTrackRow[];
    if (rows.length === 0) return [];

    const uniqueTrackIds = [...new Set(rows.map((row) => row.track_id))];
    const songs = await MusicApiService.getSongsByIds(uniqueTrackIds);

    return rows
      .map((row) => {
        const song = songs.find(
          (s) =>
            s.id === row.track_id ||
            s.id === row.track_id.replace(/^itunes-/, '') ||
            `itunes-${s.id}` === row.track_id
        );
        if (!song) return null;
        return { ...song, uniqueId: row.id };
      })
      .filter(Boolean) as Song[];
  }

  public async addTrack(
    playlistId: string,
    trackId: string
  ): Promise<'SUCCESS' | 'ALREADY_EXISTS'> {
    const { data: existingRow, error: existingError } = await this.supabase
      .from('playlist_tracks')
      .select('playlist_id')
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return 'ALREADY_EXISTS';

    const { data: lastRow, error: positionError } = await this.supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (positionError) throw positionError;

    const { error } = await this.supabase.from('playlist_tracks').insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: (lastRow?.position ?? -1) + 1,
    });

    if (error) throw error;
    return 'SUCCESS';
  }

  public async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const { error } = await this.supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;
  }

  public async reorderTracks(playlistId: string, trackIdsInOrder: string[]): Promise<void> {
    const promises = trackIdsInOrder.map((trackId, index) =>
      this.supabase
        .from('playlist_tracks')
        .update({ position: index })
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
    );
    await Promise.all(promises);
  }
}
