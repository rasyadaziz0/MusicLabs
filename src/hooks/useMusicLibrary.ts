'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  addTrackToPlaylist,
  createPlaylist,
  getLikedSongIds,
  getLikedSongsWithDetails,
  getPlaylistTracks,
  getUserPlaylists,
  removeTrackFromPlaylist,
  toggleLikedSong,
} from '@/lib/supabase/music';

export function useLibraryPlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-playlists', user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useLikedSongsIndex() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['liked-song-ids', user?.id],
    queryFn: () => getLikedSongIds(user!.id),
    enabled: Boolean(user?.id),
  });

  const likedSet = useMemo(() => new Set(query.data ?? []), [query.data]);

  return {
    ...query,
    likedTrackIds: query.data ?? [],
    likedSet,
  };
}

export function useLikedSongs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liked-songs', user?.id],
    queryFn: () => getLikedSongsWithDetails(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: () => getPlaylistTracks(playlistId!),
    enabled: Boolean(playlistId),
  });
}

export function useToggleLikedSong() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => {
      if (!user?.id) throw new Error('Please sign in first.');
      return toggleLikedSong(user.id, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-song-ids', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['liked-songs', user?.id] });
    },
  });
}

export function useCreatePlaylist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string; coverUrl?: string }) => {
      if (!user?.id) throw new Error('Please sign in first.');
      return createPlaylist({
        userId: user.id,
        name: payload.name,
        description: payload.description,
        coverUrl: payload.coverUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      addTrackToPlaylist(playlistId, trackId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      removeTrackFromPlaylist(playlistId, trackId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}
