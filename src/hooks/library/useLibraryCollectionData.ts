import { useAuth } from '@/context/AuthContext';
import {
    buildLibrarySongs
} from '@/lib/library/deriveLibrary';
import {
    getAllPlaylistTracksForUser,
    getRecentPlays
} from '@/lib/supabase/music';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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

