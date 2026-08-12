'use client';

import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { type UserProfile } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';

export function useFollowingList(userId: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ['following-list', userId],
    queryFn: () => SocialRepository.getInstance().getFollowing(userId!),
    enabled: Boolean(userId),
  });
}

// ── Toggle follow / unfollow ─────────────────────────────────
