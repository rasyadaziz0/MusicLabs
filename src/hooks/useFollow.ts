'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type FollowCounts, type UserProfile } from '@/types/profile';

// ── Check if current user follows target ─────────────────────
export function useFollowStatus(targetUserId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      return SocialRepository.getInstance().isFollowing(user.id, targetUserId);
    },
    enabled: Boolean(user?.id && targetUserId && user.id !== targetUserId),
  });
}

// ── Get follower + following counts ──────────────────────────
export function useFollowCounts(userId: string | null) {
  return useQuery<FollowCounts>({
    queryKey: ['follow-counts', userId],
    queryFn: () => SocialRepository.getInstance().getFollowCounts(userId!),
    enabled: Boolean(userId),
  });
}

// ── Get followers list ───────────────────────────────────────
export function useFollowersList(userId: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ['followers-list', userId],
    queryFn: () => SocialRepository.getInstance().getFollowers(userId!),
    enabled: Boolean(userId),
  });
}

// ── Get following list ───────────────────────────────────────
export function useFollowingList(userId: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ['following-list', userId],
    queryFn: () => SocialRepository.getInstance().getFollowing(userId!),
    enabled: Boolean(userId),
  });
}

// ── Toggle follow / unfollow ─────────────────────────────────
export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      currentlyFollowing,
    }: {
      targetUserId: string;
      currentlyFollowing: boolean;
    }) => {
      if (currentlyFollowing) {
        await SocialRepository.getInstance().unfollowUser(targetUserId);
        return false; // now NOT following
      } else {
        await SocialRepository.getInstance().followUser(targetUserId);
        return true; // now following
      }
    },
    onSuccess: (_isNowFollowing, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers-list', variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-list', user?.id] });
    },
  });
}

// ── Search users ─────────────────────────────────────────────
export function useSearchUsers(query: string) {
  return useQuery<UserProfile[]>({
    queryKey: ['search-users', query],
    queryFn: () => ProfileRepository.getInstance().searchUsers(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
