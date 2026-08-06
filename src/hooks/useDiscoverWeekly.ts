'use client';

import { MusicApiService } from '@/lib/api/MusicApiService';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { DiscoverStatus } from '@/types/hooks/discover';



async function fetchDiscoverStatus(): Promise<DiscoverStatus> {
  return MusicApiService.apiFetchInternal<DiscoverStatus>('/api/ai/discover');
}

export function useDiscoverWeekly() {
  const { user } = useAuth();

  // Status query — check if Discover Weekly exists and is fresh
  const statusQuery = useQuery({
    queryKey: ['discover-weekly-status', user?.id],
    queryFn: fetchDiscoverStatus,
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const status = statusQuery.data;
  const hasPlaylist = status?.exists ?? false;
  const isStale = status?.isStale ?? false;
  const playlistId = status?.playlistId;
  const generatedAt = status?.generatedAt;

  return {
    status,
    isLoading: statusQuery.isLoading,
    hasPlaylist,
    isStale,
    playlistId,
    generatedAt,
    listeningProgress: status?.listeningProgress,
    refetch: statusQuery.refetch,
  };
}
