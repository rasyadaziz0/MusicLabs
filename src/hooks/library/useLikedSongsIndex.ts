import { useAuth } from '@/context/AuthContext';
import {
    getLikedSongIds
} from '@/lib/supabase/music';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
// LOCAL IMPORTS

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

