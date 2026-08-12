'use client';

import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { type FollowCounts } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';

export function useFollowCounts(userId: string | null) {
  return useQuery<FollowCounts>({
    queryKey: ['follow-counts', userId],
    queryFn: () => SocialRepository.getInstance().getFollowCounts(userId!),
    enabled: Boolean(userId),
  });
}

// ── Get followers list ───────────────────────────────────────
