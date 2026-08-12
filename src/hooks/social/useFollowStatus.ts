'use client';

import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { useQuery } from '@tanstack/react-query';

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
