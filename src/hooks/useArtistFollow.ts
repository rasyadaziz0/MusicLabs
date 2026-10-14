'use client';

import { useAuth } from '@/context/AuthContext';
import { ArtistFollowRepository } from '@/lib/supabase/repositories/ArtistFollowRepository';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';

interface UseArtistFollowParams {
  artistId: string;
  artistName: string;
  artistImageUrl?: string | null;
}

export function useArtistFollow({
  artistId,
  artistName,
  artistImageUrl,
}: UseArtistFollowParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const repo = ArtistFollowRepository.getInstance();

  // 1. Follow state query
  const { data: isFollowing = false, isLoading: isStatusLoading } = useQuery({
    queryKey: ['artist-follow', user?.id, artistId],
    queryFn: async () => {
      if (!user || !artistId) return false;
      return repo.isFollowing(artistId);
    },
    enabled: Boolean(user && artistId),
    staleTime: 30 * 1000, // 30s
    gcTime: 10 * 60 * 1000,
  });

  // 2. Follower count query
  const { data: followerCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['artist-follower-count', artistId],
    queryFn: async () => {
      if (!artistId) return 0;
      return repo.getFollowerCount(artistId);
    },
    enabled: Boolean(artistId),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000,
  });

  // 3. Follow mutation with optimistic updates
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Silakan login terlebih dahulu untuk mengikuti artis.');
      return repo.followArtist(artistId, {
        name: artistName,
        imageUrl: artistImageUrl,
      });
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['artist-follow', user?.id, artistId] });
      await queryClient.cancelQueries({ queryKey: ['artist-follower-count', artistId] });

      const prevStatus = queryClient.getQueryData(['artist-follow', user?.id, artistId]);
      const prevCount = queryClient.getQueryData<number>(['artist-follower-count', artistId]) ?? 0;

      // Optimistically update
      queryClient.setQueryData(['artist-follow', user?.id, artistId], true);
      queryClient.setQueryData(['artist-follower-count', artistId], prevCount + 1);

      return { prevStatus, prevCount };
    },
    onError: (err: any, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['artist-follow', user?.id, artistId], context.prevStatus);
        queryClient.setQueryData(['artist-follower-count', artistId], context.prevCount);
      }
      toast.error(err?.message || 'Gagal mengikuti artis');
    },
    onSuccess: () => {
      toast.success(`Mengikuti ${artistName}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-follow', user?.id, artistId] });
      queryClient.invalidateQueries({ queryKey: ['artist-follower-count', artistId] });
      queryClient.invalidateQueries({ queryKey: ['followed-artists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followed-artist-stations', user?.id] });
    },
  });

  // 4. Unfollow mutation with optimistic updates
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Silakan login terlebih dahulu.');
      return repo.unfollowArtist(artistId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['artist-follow', user?.id, artistId] });
      await queryClient.cancelQueries({ queryKey: ['artist-follower-count', artistId] });

      const prevStatus = queryClient.getQueryData(['artist-follow', user?.id, artistId]);
      const prevCount = queryClient.getQueryData<number>(['artist-follower-count', artistId]) ?? 0;

      queryClient.setQueryData(['artist-follow', user?.id, artistId], false);
      queryClient.setQueryData(['artist-follower-count', artistId], Math.max(0, prevCount - 1));

      return { prevStatus, prevCount };
    },
    onError: (err: any, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['artist-follow', user?.id, artistId], context.prevStatus);
        queryClient.setQueryData(['artist-follower-count', artistId], context.prevCount);
      }
      toast.error(err?.message || 'Gagal berhenti mengikuti artis');
    },
    onSuccess: () => {
      toast.info(`Berhenti mengikuti ${artistName}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-follow', user?.id, artistId] });
      queryClient.invalidateQueries({ queryKey: ['artist-follower-count', artistId] });
      queryClient.invalidateQueries({ queryKey: ['followed-artists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followed-artist-stations', user?.id] });
    },
  });

  const toggleFollow = () => {
    if (!user) {
      toast.error('Silakan login untuk mengikuti artis');
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    followerCount,
    isLoading: isStatusLoading || isCountLoading,
    isMutating: followMutation.isPending || unfollowMutation.isPending,
    follow: () => followMutation.mutate(),
    unfollow: () => unfollowMutation.mutate(),
    toggleFollow,
  };
}
