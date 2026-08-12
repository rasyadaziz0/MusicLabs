import { useAuth } from '@/context/AuthContext';
import {
    togglePinPlaylist
} from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useTogglePinPlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ playlistId, currentPinStatus }: { playlistId: string, currentPinStatus: boolean }) =>
      togglePinPlaylist(playlistId, currentPinStatus),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}

