import { useAuth } from '@/context/AuthContext';
import {
    deletePlaylist
} from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}
