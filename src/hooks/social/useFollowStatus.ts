'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type FollowCounts, type UserProfile } from '@/types/profile';

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
