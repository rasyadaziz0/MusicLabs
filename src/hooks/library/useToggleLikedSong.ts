import { useAuth } from '@/context/AuthContext';
import {
    toggleLikedSong
} from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// LOCAL IMPORTS

export function useToggleLikedSong() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => {
      if (!user?.id) throw new Error('Please sign in first.');
      return toggleLikedSong(user.id, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-song-ids', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['liked-songs', user?.id] });
    },
  });
}

