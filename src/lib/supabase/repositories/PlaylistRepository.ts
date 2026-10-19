import { PlaylistRecord, PlaylistTrackRow } from '@/types/models/Playlist';
import { PlaylistSearchResult } from '@/types/models/PlaylistLike';
import { Song } from '@/types/music';
import { IPlaylistRepository } from '@/types/repositories/IPlaylistRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { DiscoverWeeklyOperations } from './playlist/DiscoverWeeklyOperations';
import { PlaylistQueryOperations } from './playlist/PlaylistQueryOperations';
import { PlaylistTrackOperations } from './playlist/PlaylistTrackOperations';

// Re-export modular sub-operation classes
export { DiscoverWeeklyOperations, PlaylistQueryOperations, PlaylistTrackOperations };

/**
 * PlaylistRepository
 * Facade repository implementing IPlaylistRepository, coordinating modular operations
 * for CRUD, querying, track management, and AI Discover Weekly generation.
 */
export class PlaylistRepository implements IPlaylistRepository {
  private trackOps: PlaylistTrackOperations;
  private queryOps: PlaylistQueryOperations;
  private discoverOps: DiscoverWeeklyOperations;

  constructor(private supabase: SupabaseClient) {
    this.trackOps = new PlaylistTrackOperations(supabase);
    this.queryOps = new PlaylistQueryOperations(supabase);
    this.discoverOps = new DiscoverWeeklyOperations(supabase);
  }

  // ─── Query & Discovery Operations ───

  public async getUserPlaylists(userId: string): Promise<PlaylistRecord[]> {
    return this.queryOps.getUserPlaylists(userId);
  }

  public async getPublicPlaylists(userId: string): Promise<PlaylistRecord[]> {
    return this.queryOps.getPublicPlaylists(userId);
  }

  public async searchPublicPlaylists(
    query: string,
    page = 1,
    limit = 20
  ): Promise<PlaylistSearchResult[]> {
    return this.queryOps.searchPublicPlaylists(query, page, limit);
  }

  // ─── Core Playlist CRUD Operations ───

  public async getPlaylistById(playlistId: string): Promise<PlaylistRecord> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at')
      .eq('id', playlistId)
      .single();

    if (error) throw error;
    return data as PlaylistRecord;
  }

  public async createPlaylist(input: {
    userId: string;
    name: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    isDiscoverWeekly?: boolean;
  }): Promise<PlaylistRecord> {
    const payload = {
      user_id: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      cover_url: input.coverUrl?.trim() || null,
      is_public: input.isPublic ?? false,
      is_discover_weekly: input.isDiscoverWeekly ?? false,
    };

    const { data, error } = await this.supabase
      .from('playlists')
      .insert(payload)
      .select('id, user_id, name, description, cover_url, is_public, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as PlaylistRecord;
  }

  public async updatePlaylist(playlistId: string, updates: Partial<PlaylistRecord>): Promise<void> {
    const { error } = await this.supabase
      .from('playlists')
      .update(updates)
      .eq('id', playlistId);

    if (error) throw error;
  }

  public async togglePinPlaylist(playlistId: string, currentPinStatus: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('playlists')
      .update({ is_pinned: !currentPinStatus })
      .eq('id', playlistId);

    if (error) throw error;
    return !currentPinStatus;
  }

  public async toggleVisibility(playlistId: string, currentPublicStatus: boolean): Promise<boolean> {
    const newStatus = !currentPublicStatus;
    const { error } = await this.supabase
      .from('playlists')
      .update({ is_public: newStatus, updated_at: new Date().toISOString() })
      .eq('id', playlistId);

    if (error) throw error;
    return newStatus;
  }

  public async deletePlaylist(playlistId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
    return true;
  }

  // ─── Playlist Track Operations ───

  public async getPlaylistTrackIds(playlistId: string): Promise<PlaylistTrackRow[]> {
    return this.trackOps.getTrackIds(playlistId);
  }

  public async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    return this.trackOps.getTracks(playlistId);
  }

  public async getAllPlaylistTracksForUser(userId: string): Promise<Song[]> {
    const playlists = await this.getUserPlaylists(userId);
    if (playlists.length === 0) return [];
    return this.trackOps.getAllTracksForPlaylistIds(playlists.map((p) => p.id));
  }

  public async addTrackToPlaylist(
    playlistId: string,
    trackId: string
  ): Promise<'SUCCESS' | 'ALREADY_EXISTS'> {
    return this.trackOps.addTrack(playlistId, trackId);
  }

  public async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    return this.trackOps.removeTrack(playlistId, trackId);
  }

  public async reorderPlaylistTracks(playlistId: string, trackIdsInOrder: string[]): Promise<void> {
    return this.trackOps.reorderTracks(playlistId, trackIdsInOrder);
  }

  // ─── Discover Weekly Operations ───

  public async getOrCreateDiscoverWeeklyPlaylist(
    userId: string
  ): Promise<{ playlist: PlaylistRecord; created: boolean }> {
    return this.discoverOps.getOrCreate(userId);
  }

  public async updateDiscoverWeeklyTracks(
    playlistId: string,
    trackIds: string[]
  ): Promise<void> {
    return this.discoverOps.updateTracks(playlistId, trackIds);
  }
}
