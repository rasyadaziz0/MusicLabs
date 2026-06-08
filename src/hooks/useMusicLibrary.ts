'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  addTrackToPlaylist,
  getAllPlaylistTracksForUser,
  getLikedSongIds,
  getLikedSongsWithDetails,
  getPlaylistTracks,
  getRecentPlays,
  getUserPlaylists,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  toggleLikedSong,
  togglePinPlaylist,
  deletePlaylist,
} from '@/lib/supabase/music';
import {
  buildLibraryAlbums,
  buildLibraryArtists,
  buildLibrarySongs,
} from '@/lib/library/deriveLibrary';

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

export function useLibraryCollectionData() {
  const { user } = useAuth();

  const likedSongsQuery = useLikedSongs();
  const recentSongsQuery = useQuery({
    queryKey: ['recent-library-songs', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: Boolean(user?.id),
  });
  const playlistSongsQuery = useQuery({
    queryKey: ['library-playlist-songs', user?.id],
    queryFn: () => getAllPlaylistTracksForUser(user!.id),
    enabled: Boolean(user?.id),
  });

  const songs = useMemo(
    () => buildLibrarySongs(likedSongsQuery.data ?? [], recentSongsQuery.data ?? [], playlistSongsQuery.data ?? []),
    [likedSongsQuery.data, recentSongsQuery.data, playlistSongsQuery.data]
  );

  return {
    songs,
    likedSongs: likedSongsQuery.data ?? [],
    recentSongs: recentSongsQuery.data ?? [],
    playlistSongs: playlistSongsQuery.data ?? [],
    isLoading:
      likedSongsQuery.isLoading || recentSongsQuery.isLoading || playlistSongsQuery.isLoading,
  };
}

export function useLibrarySongs() {
  const collection = useLibraryCollectionData();
  return {
    ...collection,
    songs: collection.songs,
  };
}

export function useLibraryArtists() {
  const collection = useLibraryCollectionData();
  const artists = useMemo(() => buildLibraryArtists(collection.songs), [collection.songs]);

  return {
    ...collection,
    artists,
  };
}

export function useLibraryAlbums() {
  const collection = useLibraryCollectionData();
  const albums = useMemo(() => buildLibraryAlbums(collection.songs), [collection.songs]);

  return {
    ...collection,
    albums,
  };
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
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; coverUrl?: string; isPublic?: boolean }) => {
      if (!user?.id || !session?.access_token) throw new Error('Please sign in first.');

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          coverUrl: payload.coverUrl,
          isPublic: payload.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to create playlist');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}

export function useUpdatePlaylist() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: { name: string; description?: string; coverUrl?: string; isPublic?: boolean } }) => {
      if (!user?.id || !session?.access_token) throw new Error('Please sign in first.');

      const response = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          coverUrl: payload.coverUrl,
          isPublic: payload.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to update playlist');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', data.id] });
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

export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackIdsInOrder }: { playlistId: string; trackIdsInOrder: string[] }) =>
      reorderPlaylistTracks(playlistId, trackIdsInOrder),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
      const previousTracks = queryClient.getQueryData<any[]>(['playlist-tracks', variables.playlistId]);
      
      if (previousTracks) {
        const newTracks = variables.trackIdsInOrder
          .map(id => previousTracks.find(t => t.id === id))
          .filter(Boolean);
        queryClient.setQueryData(['playlist-tracks', variables.playlistId], newTracks);
      }
      
      return { previousTracks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTracks) {
        queryClient.setQueryData(['playlist-tracks', variables.playlistId], context.previousTracks);
      }
    },
    onSettled: (_result, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}


export function useTogglePinPlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ playlistId, currentPinStatus }: { playlistId: string, currentPinStatus: boolean }) =>
      togglePinPlaylist(playlistId, currentPinStatus),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}
