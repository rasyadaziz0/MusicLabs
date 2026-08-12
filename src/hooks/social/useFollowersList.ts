'use client';

import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { type UserProfile } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';

export function useFollowersList(userId: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ['followers-list', userId],
    queryFn: () => SocialRepository.getInstance().getFollowers(userId!),
    enabled: Boolean(userId),
  });
}

// ── Get following list ───────────────────────────────────────
