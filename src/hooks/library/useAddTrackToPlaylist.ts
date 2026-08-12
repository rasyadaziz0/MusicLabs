import {
    addTrackToPlaylist
} from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      addTrackToPlaylist(playlistId, trackId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}

