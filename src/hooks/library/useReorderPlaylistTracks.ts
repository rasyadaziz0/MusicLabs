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


