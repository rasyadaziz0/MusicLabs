import { PlaylistRecord } from '@/types/models/Playlist';
import { SupabaseClient } from '@supabase/supabase-js';

export class DiscoverWeeklyOperations {
  constructor(private supabase: SupabaseClient) { }

  public async getOrCreate(
    userId: string
  ): Promise<{ playlist: PlaylistRecord; created: boolean }> {
    const { data: existing, error: findError } = await this.supabase
      .from('playlists')
      .select(
        'id, user_id, name, description, cover_url, is_pinned, is_public, is_discover_weekly, discover_generated_at, created_at, updated_at'
      )
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
      .select(
        'id, user_id, name, description, cover_url, is_pinned, is_public, is_discover_weekly, discover_generated_at, created_at, updated_at'
      )
      .single();

    if (createError) throw createError;
    return { playlist: newPl as PlaylistRecord, created: true };
  }

  public async updateTracks(playlistId: string, trackIds: string[]): Promise<void> {
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

    const { error: insError } = await this.supabase.from('playlist_tracks').insert(rows);

    if (insError) throw insError;

    const { error: updateError } = await this.supabase
      .from('playlists')
      .update({ discover_generated_at: new Date().toISOString() })
      .eq('id', playlistId);

    if (updateError) {
      console.error('Failed to update discover_generated_at:', updateError);
    }
  }
}
