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

export function useLikedSongsIndex() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['liked-song-ids', user?.id],
    queryFn: () => getLikedSongIds(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const likedSet = useMemo(() => new Set(query.data ?? []), [query.data]);

  return {
    ...query,
    likedTrackIds: query.data ?? [],
    likedSet,
  };
}

