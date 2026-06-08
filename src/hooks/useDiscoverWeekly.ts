'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

interface DiscoverStatus {
  exists: boolean;
  playlistId?: string;
  generatedAt?: string;
  isStale?: boolean;
  listeningProgress?: {
    current: number;
    required: number;
    ready: boolean;
  };
}

async function fetchDiscoverStatus(): Promise<DiscoverStatus> {
  const res = await fetch('/api/ai/discover');
  if (!res.ok) {
    throw new Error('Failed to check Discover Weekly status');
  }
  return res.json();
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
