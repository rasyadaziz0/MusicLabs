'use client';

import { useAuth } from '@/context/AuthContext';
import { togglePlaylistVisibility } from '@/lib/supabase/music';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';

export function useTogglePlaylistVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      currentPublicStatus,
    }: {
      playlistId: string;
      currentPublicStatus: boolean;
    }) => {
      return togglePlaylistVisibility(playlistId, currentPublicStatus);
    },
    onSuccess: (newStatus, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['library-playlists', user.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['search', 'playlists'] });
      toast.success(newStatus ? 'Playlist is now public' : 'Playlist is now private');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update playlist visibility');
    },
  });
}
