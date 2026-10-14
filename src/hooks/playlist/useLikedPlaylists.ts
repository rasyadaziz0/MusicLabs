'use client';

import { useAuth } from '@/context/AuthContext';
import { getLikedPlaylists } from '@/lib/supabase/music';
import { PlaylistRecord } from '@/types/models/Playlist';
import { useQuery } from '@tanstack/react-query';

export function useLikedPlaylists() {
  const { user } = useAuth();

  const { data: playlists = [], isLoading, error } = useQuery<PlaylistRecord[]>({
    queryKey: ['playlist', 'likedByUser', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getLikedPlaylists(user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
  });

  return {
    playlists,
    isLoading: isLoading && Boolean(user?.id),
    error,
    isEmpty: !isLoading && playlists.length === 0,
  };
}
