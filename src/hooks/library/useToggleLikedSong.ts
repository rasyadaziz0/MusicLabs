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

