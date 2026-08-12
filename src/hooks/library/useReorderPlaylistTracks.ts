import {
    reorderPlaylistTracks
} from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackIdsInOrder }: { playlistId: string; trackIdsInOrder: string[] }) =>
      reorderPlaylistTracks(playlistId, trackIdsInOrder),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
      const previousTracks = queryClient.getQueryData<any[]>(['playlist-tracks', variables.playlistId]);
      
      if (previousTracks) {
        const newTracks = variables.trackIdsInOrder
          .map(id => previousTracks.find(t => t.id === id))
          .filter(Boolean);
        queryClient.setQueryData(['playlist-tracks', variables.playlistId], newTracks);
      }
      
      return { previousTracks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTracks) {
        queryClient.setQueryData(['playlist-tracks', variables.playlistId], context.previousTracks);
      }
    },
    onSettled: (_result, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}


