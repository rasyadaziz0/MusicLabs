import { Song } from '@/types/music';
import { getSongsByIds } from '@/lib/api/musicApi';
import { supabase } from './client';

export interface PlaylistRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_pinned?: boolean;
  is_public?: boolean;
  created_at?: string;
}

interface PlaylistTrackRow {
  playlist_id: string;
  track_id: string;
  position: number;
}

interface LikedSongRow {
  track_id: string;
  liked_at?: string;
}

export async function getUserPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PlaylistRecord[];
}

export async function getPlaylistById(playlistId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, description, cover_url, is_pinned, is_public, created_at')
    .eq('id', playlistId)
    .single();

  if (error) throw error;
  return data as PlaylistRecord;
}

export async function createPlaylist(input: {
  userId: string;
  name: string;
  description?: string;
  coverUrl?: string;
}) {
  const payload = {
    user_id: input.userId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    cover_url: input.coverUrl?.trim() || null,
  };

  const { data, error } = await supabase
    .from('playlists')
    .insert(payload)
    .select('id, user_id, name, description, cover_url, is_public, created_at')
    .single();

  if (error) throw error;
  return data as PlaylistRecord;
}

export async function togglePinPlaylist(playlistId: string, currentPinStatus: boolean) {
  const { error } = await supabase
    .from('playlists')
    .update({ is_pinned: !currentPinStatus })
    .eq('id', playlistId);

  if (error) throw error;
  return !currentPinStatus;
}

export async function deletePlaylist(playlistId: string) {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw error;
  return true;
}

export async function getPlaylistTrackIds(playlistId: string) {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('playlist_id, track_id, position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PlaylistTrackRow[];
}

export async function getPlaylistTracks(playlistId: string): Promise<Song[]> {
  const rows = await getPlaylistTrackIds(playlistId);
  const trackIds = rows.map((row) => row.track_id);
  if (trackIds.length === 0) return [];
  return getSongsByIds(trackIds);
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  const { data: existingRow, error: existingError } = await supabase
    .from('playlist_tracks')
    .select('playlist_id')
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingRow) return false;

  const { data: lastRow, error: positionError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) throw positionError;

  const { error } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    position: (lastRow?.position ?? -1) + 1,
  });

  if (error) throw error;
  return true;
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) throw error;
}

export async function getLikedSongs(userId: string) {
  const { data, error } = await supabase
    .from('liked_tracks')
    .select('track_id, liked_at')
    .eq('user_id', userId)
    .order('liked_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LikedSongRow[];
}

export async function getLikedSongIds(userId: string) {
  const rows = await getLikedSongs(userId);
  return rows.map((row) => row.track_id);
}

export async function getLikedSongsWithDetails(userId: string): Promise<Song[]> {
  const trackIds = await getLikedSongIds(userId);
  if (trackIds.length === 0) return [];
  return getSongsByIds(trackIds);
}

export async function isTrackLiked(userId: string, trackId: string) {
  const { data, error } = await supabase
    .from('liked_tracks')
    .select('track_id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function toggleLikedSong(userId: string, trackId: string) {
  const liked = await isTrackLiked(userId, trackId);

  if (liked) {
    const { error } = await supabase
      .from('liked_tracks')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);

    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('liked_tracks').insert({
    user_id: userId,
    track_id: trackId,
  });

  if (error) throw error;
  return true;
}

export async function recordRecentPlay(userId: string, trackId: string) {
  const { error } = await supabase.from('listening_history').insert({
    user_id: userId,
    track_id: trackId,
  });

  if (error) {
    console.error('Failed to record recent play:', error);
  }
}

export async function getRecentPlays(userId: string): Promise<Song[]> {
  const { data, error } = await supabase
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
