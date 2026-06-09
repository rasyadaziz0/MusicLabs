import { supabase } from './client';
import { UserProfile } from './social';

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  added_at: string;
  added_by: string;
  profile: UserProfile;
}

export async function getPlaylistCollaborators(playlistId: string): Promise<PlaylistCollaborator[]> {
  const { data, error } = await supabase
    .from('playlist_collaborators')
    .select('*, profile:profiles!playlist_collaborators_user_id_fkey(id, username, display_name, bio, avatar_url, created_at)')
    .eq('playlist_id', playlistId)
    .order('added_at', { ascending: true });

  if (error) {
    console.warn("Notice: collaborative playlists query failed (usually means SQL script not run yet):", error?.message || error);
    return [];
  }
  
  return (data ?? []).map(row => ({
    ...row,
    profile: row.profile as unknown as UserProfile
  }));
}

export async function addCollaborator(playlistId: string, userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const addedBy = user.id;

  // Verify ownership
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('user_id')
    .eq('id', playlistId)
    .single();

  if (playlistError || !playlist || playlist.user_id !== addedBy) {
    throw new Error('Only the playlist owner can add collaborators');
  }

  const { error } = await supabase.from('playlist_collaborators').insert({
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

export async function removeCollaborator(playlistId: string, userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify permission: Must be the playlist owner, OR removing themselves
  if (user.id !== userId) {
    const { data: playlist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();
    if (!playlist || playlist.user_id !== user.id) {
      throw new Error('Only the playlist owner can remove other collaborators');
    }
  }

  const { error } = await supabase
    .from('playlist_collaborators')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function isCollaborator(playlistId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('playlist_collaborators')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
