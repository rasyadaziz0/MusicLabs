import { useAuth } from '@/context/AuthContext';
import {
    getUserPlaylists
} from '@/lib/supabase/music';
import { useQuery } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useLibraryPlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-playlists', user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });
}

