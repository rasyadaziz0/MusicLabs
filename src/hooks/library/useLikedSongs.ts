import { useAuth } from '@/context/AuthContext';
import {
    getLikedSongsWithDetails
} from '@/lib/supabase/music';
import { useQuery } from '@tanstack/react-query';
// LOCAL IMPORTS


export function useLikedSongs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liked-songs', user?.id],
    queryFn: () => getLikedSongsWithDetails(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });
}

