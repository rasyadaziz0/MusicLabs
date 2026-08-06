'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type FollowCounts, type UserProfile } from '@/types/profile';

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
