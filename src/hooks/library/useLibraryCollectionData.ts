import { MusicApiService } from '@/lib/api/MusicApiService';
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
// LOCAL IMPORTS
import { useLikedSongs } from './useLikedSongs';


export function useLibraryCollectionData() {
  const { user } = useAuth();

  const likedSongsQuery = useLikedSongs();
  const recentSongsQuery = useQuery({
    queryKey: ['recent-library-songs', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });
  const playlistSongsQuery = useQuery({
    queryKey: ['library-playlist-songs', user?.id],
    queryFn: () => getAllPlaylistTracksForUser(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
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

