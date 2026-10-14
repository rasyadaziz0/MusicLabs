'use client';

import { searchPublicPlaylists } from '@/lib/supabase/music';
import { PlaylistSearchResult } from '@/types/models/PlaylistLike';
import { useQuery } from '@tanstack/react-query';

export function useSearchPlaylists(query: string) {
  const cleanQuery = query.trim();

  const { data: playlists = [], isLoading, error } = useQuery<PlaylistSearchResult[]>({
    queryKey: ['search', 'playlists', cleanQuery],
    queryFn: async () => {
      if (cleanQuery.length < 2) return [];
      return searchPublicPlaylists(cleanQuery, 1, 30);
    },
    enabled: cleanQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  return {
    playlists,
    isLoading: isLoading && cleanQuery.length >= 2,
    error,
  };
}
