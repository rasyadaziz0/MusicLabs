import { PlaylistRecord } from '@/types/models/Playlist';
import { PlaylistSearchResult } from '@/types/models/PlaylistLike';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * PlaylistQueryOperations
 * Handles multi-source playlist querying, user library aggregation, and search queries.
 */
export class PlaylistQueryOperations {
  constructor(private supabase: SupabaseClient) {}

  public async getUserPlaylists(userId: string): Promise<PlaylistRecord[]> {
    const { data: ownedData, error: ownedError } = await this.supabase
      .from('playlists')
      .select(
        'id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at, is_discover_weekly'
      )
      .eq('user_id', userId);

    if (ownedError) throw ownedError;

    const { data: collabData, error: collabError } = await this.supabase
      .from('playlist_collaborators')
      .select(
        'playlists(id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at, is_discover_weekly)'
      )
      .eq('user_id', userId);

    if (collabError) {
      console.warn(
        'Notice: collaborative playlists query failed (usually means SQL script not run yet):',
        collabError?.message || collabError
      );
    }

    const collabPlaylists = (collabData ?? [])
      .map((row) => row.playlists as unknown as PlaylistRecord)
      .filter(Boolean);

    // Fetch liked playlists
    let likedPlaylists: PlaylistRecord[] = [];
    try {
      const { data: likedData, error: likedError } = await this.supabase
        .from('playlist_likes')
        .select(
          'playlists:playlist_id(id, user_id, name, description, cover_url, is_pinned, is_public, created_at, updated_at, is_discover_weekly)'
        )
        .eq('user_id', userId);

      if (!likedError && likedData) {
        likedPlaylists = (likedData as any[])
          .map((row) => row.playlists as unknown as PlaylistRecord)
          .filter(Boolean)
          .map((p) => ({ ...p, is_liked: true }));
      }
    } catch {
      // Ignore if playlist_likes table not migrated yet
    }

    // Filter out Discover Weekly playlists from regular library views
    const filteredOwnedData = (ownedData ?? []).filter((p) => !p.is_discover_weekly);
    const filteredCollabData = collabPlaylists.filter((p) => !p.is_discover_weekly);
    const filteredLikedData = likedPlaylists.filter((p) => !p.is_discover_weekly);

    const allPlaylists = [...filteredOwnedData, ...filteredCollabData, ...filteredLikedData];
    const uniquePlaylists = Array.from(new Map(allPlaylists.map((p) => [p.id, p])).values());

    return uniquePlaylists.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  public async getPublicPlaylists(userId: string): Promise<PlaylistRecord[]> {
    const { data, error } = await this.supabase
      .from('playlists')
      .select('id, user_id, name, description, cover_url, is_public, created_at')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PlaylistRecord[];
  }

  public async searchPublicPlaylists(
    query: string,
    page = 1,
    limit = 20
  ): Promise<PlaylistSearchResult[]> {
    const cleanQuery = query.replace(/[,()%*\\]/g, ' ').trim();
    if (!cleanQuery) return [];

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error } = await this.supabase
        .from('playlists')
        .select(`
          id, user_id, name, description, cover_url, is_public, created_at, updated_at,
          profiles:user_id (username, display_name, avatar_url),
          playlist_tracks (id)
        `)
        .eq('is_public', true)
        .or('is_discover_weekly.is.null,is_discover_weekly.eq.false')
        .ilike('name', `%${cleanQuery}%`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.warn('Search public playlists error:', error.message);
        return [];
      }

      return (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        cover_url: row.cover_url,
        is_public: row.is_public,
        like_count: row.like_count ?? 0,
        track_count: Array.isArray(row.playlist_tracks) ? row.playlist_tracks.length : 0,
        owner_name: row.profiles?.display_name || row.profiles?.username || 'Unknown',
        owner_avatar: row.profiles?.avatar_url || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (err) {
      console.warn('searchPublicPlaylists caught error:', err);
      return [];
    }
  }
}
