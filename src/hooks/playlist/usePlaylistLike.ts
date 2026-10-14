'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getPlaylistLikeCount, isPlaylistLiked, togglePlaylistLike } from '@/lib/supabase/music';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';
import { useEffect } from 'react';

export function usePlaylistLike(playlistId: string | null | undefined, isOwner: boolean = false) {
  const { user, signInWithGoogle } = useAuth();
  const queryClient = useQueryClient();

  const { data: isLiked = false, isLoading: isStatusLoading } = useQuery({
    queryKey: ['playlist', 'isLiked', playlistId, user?.id],
    queryFn: async () => {
      if (!playlistId || !user?.id || isOwner) return false;
      return isPlaylistLiked(user.id, playlistId);
    },
    enabled: Boolean(playlistId && user?.id && !isOwner),
    staleTime: 60 * 1000,
  });

  const { data: likeCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['playlist', 'likes', playlistId],
    queryFn: async () => {
      if (!playlistId) return 0;
      return getPlaylistLikeCount(playlistId);
    },
    enabled: Boolean(playlistId),
    staleTime: 30 * 1000,
  });

  // Realtime subscription for live like count updates
  useEffect(() => {
    if (!playlistId) return;

    const channel = supabase
      .channel(`playlist_likes_channel_${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_likes',
          filter: `playlist_id=eq.${playlistId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['playlist', 'likes', playlistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playlistId, queryClient]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        signInWithGoogle?.();
        throw new Error('Please sign in to like playlists');
      }
      if (!playlistId) throw new Error('No playlist ID provided');
      return togglePlaylistLike(user.id, playlistId);
    },
    onMutate: async () => {
      if (!user || !playlistId) return;

      // Cancel ongoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['playlist', 'isLiked', playlistId, user.id] });
      await queryClient.cancelQueries({ queryKey: ['playlist', 'likes', playlistId] });

      const prevLiked = queryClient.getQueryData<boolean>(['playlist', 'isLiked', playlistId, user.id]) ?? false;
      const prevCount = queryClient.getQueryData<number>(['playlist', 'likes', playlistId]) ?? 0;

      const nextLiked = !prevLiked;
      const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

      queryClient.setQueryData(['playlist', 'isLiked', playlistId, user.id], nextLiked);
      queryClient.setQueryData(['playlist', 'likes', playlistId], nextCount);

      return { prevLiked, prevCount };
    },
    onError: (err: any, _, context) => {
      if (context) {
        queryClient.setQueryData(['playlist', 'isLiked', playlistId, user?.id], context.prevLiked);
        queryClient.setQueryData(['playlist', 'likes', playlistId], context.prevCount);
      }
      toast.error(err?.message || 'Failed to update like status');
    },
    onSettled: () => {
      if (playlistId && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['playlist', 'isLiked', playlistId, user.id] });
        queryClient.invalidateQueries({ queryKey: ['playlist', 'likes', playlistId] });
        queryClient.invalidateQueries({ queryKey: ['library-playlists', user.id] });
        queryClient.invalidateQueries({ queryKey: ['playlist', 'likedByUser', user.id] });
      }
    },
  });

  return {
    isLiked,
    likeCount,
    isLoading: isStatusLoading || isCountLoading,
    isMutating: mutation.isPending,
    toggleLike: () => mutation.mutate(),
  };
}
