import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollaboratorRepository } from '@/lib/supabase/repositories/CollaboratorRepository';

export function usePlaylistCollaborators(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-collaborators', playlistId],
    queryFn: () => playlistId ? CollaboratorRepository.getInstance().getPlaylistCollaborators(playlistId) : [],
    enabled: Boolean(playlistId),
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, userId }: { playlistId: string; userId: string; addedBy?: string }) => 
      CollaboratorRepository.getInstance().addCollaborator(playlistId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-collaborators', variables.playlistId] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, userId }: { playlistId: string; userId: string }) => 
      CollaboratorRepository.getInstance().removeCollaborator(playlistId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-collaborators', variables.playlistId] });
    },
  });
}
