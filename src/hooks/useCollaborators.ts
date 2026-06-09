import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistCollaborators, addCollaborator, removeCollaborator } from '@/lib/supabase/collaborators';

export function usePlaylistCollaborators(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-collaborators', playlistId],
    queryFn: () => playlistId ? getPlaylistCollaborators(playlistId) : [],
    enabled: Boolean(playlistId),
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, userId }: { playlistId: string; userId: string; addedBy?: string }) => 
      addCollaborator(playlistId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-collaborators', variables.playlistId] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, userId }: { playlistId: string; userId: string }) => 
      removeCollaborator(playlistId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-collaborators', variables.playlistId] });
    },
  });
}
