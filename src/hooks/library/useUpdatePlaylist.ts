import { useAuth } from '@/context/AuthContext';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useUpdatePlaylist() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: { name: string; description?: string; coverUrl?: string; isPublic?: boolean } }) => {
      if (!user?.id || !session?.access_token) throw new Error('Please sign in first.');

      return await MusicApiService.apiFetchInternal<any>(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          coverUrl: payload.coverUrl,
          isPublic: payload.isPublic,
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', data.id] });
      queryClient.invalidateQueries({ queryKey: ['library-playlists', user?.id] });
    },
  });
}

