import { SupabaseClient } from '@supabase/supabase-js';
import { Song } from '@/types/music';
import { getSongsByIds } from '@/lib/api/musicApi';

export interface PlaylistRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_pinned?: boolean;
  is_public?: boolean;
  is_discover_weekly?: boolean;
  discover_generated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlaylistTrackRow {
  playlist_id: string;
  track_id: string;
  position: number;
}

export class PlaylistRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUserPlaylists(userId: string): Promise<PlaylistRecord[]> {
    const { data: ownedData, error: ownedError } = await this.supabase
      .from('playlists')
      .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at, is_discover_weekly')
      .eq('user_id', userId);

    if (ownedError) throw ownedError;

    const { data: collabData, error: collabError } = await this.supabase
      .from('playlist_collaborators')
      .select('playlists(id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at, is_discover_weekly)')
      .eq('user_id', userId);

    if (collabError) {
      console.warn("Notice: collaborative playlists query failed (usually means SQL script not run yet):", collabError?.message || collabError);
    }

    const collabPlaylists = (collabData ?? [])
      .map(row => row.playlists as unknown as PlaylistRecord)
      .filter(Boolean);

    // Filter out Discover Weekly playlists from regular library views
    const filteredOwnedData = (ownedData ?? []).filter(p => !p.is_discover_weekly);
    const filteredCollabData = collabPlaylists.filter(p => !p.is_discover_weekly);

    const allPlaylists = [...filteredOwnedData, ...filteredCollabData];
    const uniquePlaylists = Array.from(new Map(allPlaylists.map(p => [p.id, p])).values());

    return uniquePlaylists.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  async getPlaylistById(playlistId: string): Promise<PlaylistRecord> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at')
      .eq('id', playlistId)
      .single();

    if (error) throw error;
    return data as PlaylistRecord;
  }

  async createPlaylist(input: {
    userId: string;
    name: string;
    description?: string;
    coverUrl?: string;
  }): Promise<PlaylistRecord> {
    const payload = {
      user_id: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      cover_url: input.coverUrl?.trim() || null,
    };

    const { data, error } = await this.supabase
      .from('playlists')
      .insert(payload)
      .select('id, user_id, name, description, cover_url, is_public, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as PlaylistRecord;
  }

  async togglePinPlaylist(playlistId: string, currentPinStatus: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('playlists')
      .update({ is_pinned: !currentPinStatus })
      .eq('id', playlistId);

    if (error) throw error;
    return !currentPinStatus;
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
    return true;
  }

  async getPlaylistTrackIds(playlistId: string): Promise<PlaylistTrackRow[]> {
    const { data, error } = await this.supabase
      .from('playlist_tracks')
      .select('playlist_id, track_id, position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PlaylistTrackRow[];
  }

  async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    const rows = await this.getPlaylistTrackIds(playlistId);
    const trackIds = rows.map((row) => row.track_id);
    if (trackIds.length === 0) return [];
    return getSongsByIds(trackIds);
  }

  async getAllPlaylistTracksForUser(userId: string): Promise<Song[]> {
    const playlists = await this.getUserPlaylists(userId);
    if (playlists.length === 0) return [];

    const trackLists = await Promise.all(
      playlists.map((playlist) => this.getPlaylistTracks(playlist.id))
    );

    return trackLists.flat();
  }

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<boolean> {
    const { data: existingRow, error: existingError } = await this.supabase
      .from('playlist_tracks')
      .select('playlist_id')
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return false;

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
    return true;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { error } = await this.supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;
  }

  async reorderPlaylistTracks(playlistId: string, trackIdsInOrder: string[]): Promise<void> {
    const promises = trackIdsInOrder.map((trackId, index) =>
      this.supabase
        .from('playlist_tracks')
        .update({ position: index })
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
    );
    await Promise.all(promises);
  }

  async getOrCreateDiscoverWeeklyPlaylist(
    userId: string,
  ): Promise<{ playlist: PlaylistRecord; created: boolean }> {
    const { data: existing, error: findError } = await this.supabase
      .from('playlists')
      .select('id, user_id, name, description, cover_url, is_pinned, is_public, is_discover_weekly, discover_generated_at, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_discover_weekly', true)
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return { playlist: existing as PlaylistRecord, created: false };

    const { data: newPl, error: createError } = await this.supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name: 'Discover Weekly',
        description: 'Your personal mix of fresh music, updated every week with AI ✨',
        is_public: false,
        is_discover_weekly: true,
        discover_generated_at: new Date().toISOString(),
      })
      .select('id, user_id, name, description, cover_url, is_pinned, is_public, is_discover_weekly, discover_generated_at, created_at, updated_at')
      .single();

    if (createError) throw createError;
    return { playlist: newPl as PlaylistRecord, created: true };
  }

  async updateDiscoverWeeklyTracks(
    playlistId: string,
    trackIds: string[],
  ): Promise<void> {
    const { error: delError } = await this.supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId);

    if (delError) throw delError;

    if (trackIds.length === 0) return;

    const rows = trackIds.map((trackId, index) => ({
      playlist_id: playlistId,
      track_id: trackId,
      position: index,
    }));

    const { error: insError } = await this.supabase
      .from('playlist_tracks')
      .insert(rows);

    if (insError) throw insError;

    const { error: updateError } = await this.supabase
      .from('playlists')
      .update({ discover_generated_at: new Date().toISOString() })
      .eq('id', playlistId);

    if (updateError) console.error('Failed to update discover_generated_at:', updateError);
  }
}
