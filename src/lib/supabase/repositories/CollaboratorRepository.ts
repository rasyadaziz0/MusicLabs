import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';
import { UserProfile } from '@/types/profile';
import { PROFILE_COLUMNS } from './ProfileRepository';

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  added_at: string;
  added_by: string;
  profile: UserProfile;
}

export class CollaboratorRepository {
  private static instance: CollaboratorRepository;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): CollaboratorRepository {
    if (!CollaboratorRepository.instance) {
      CollaboratorRepository.instance = new CollaboratorRepository();
    }
    return CollaboratorRepository.instance;
  }

  async getPlaylistCollaborators(playlistId: string): Promise<PlaylistCollaborator[]> {
    const { data, error } = await this.supabase
      .from('playlist_collaborators')
      .select(`*, profile:profiles!playlist_collaborators_user_id_fkey(${PROFILE_COLUMNS})`)
      .eq('playlist_id', playlistId)
      .order('added_at', { ascending: true });

    if (error) {
      console.warn("Notice: collaborative playlists query failed:", error?.message || error);
      return [];
    }
    
    return (data ?? []).map(row => ({
      ...row,
      profile: row.profile as unknown as UserProfile
    }));
  }

  async addCollaborator(playlistId: string, userId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const addedBy = user.id;

    // Verify ownership
    const { data: playlist, error: playlistError } = await this.supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (playlistError || !playlist || playlist.user_id !== addedBy) {
      throw new Error('Only the playlist owner can add collaborators');
    }

    const { error } = await this.supabase.from('playlist_collaborators').insert({
      playlist_id: playlistId,
      user_id: userId,
      added_by: addedBy,
    });

    if (error) {
      if (error.code === '23505') return true; // Already a collaborator
      throw error;
    }
    return true;
  }

  async removeCollaborator(playlistId: string, userId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify permission: Must be the playlist owner, OR removing themselves
    if (user.id !== userId) {
      const { data: playlist } = await this.supabase
        .from('playlists')
        .select('user_id')
        .eq('id', playlistId)
        .single();
      if (!playlist || playlist.user_id !== user.id) {
        throw new Error('Only the playlist owner can remove other collaborators');
      }
    }

    const { error } = await this.supabase
      .from('playlist_collaborators')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  async isCollaborator(playlistId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('playlist_collaborators')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }
}
