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
import { useLibraryCollectionData } from './useLibraryCollectionData';

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

