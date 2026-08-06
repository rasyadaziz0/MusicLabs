'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type FollowCounts, type UserProfile } from '@/types/profile';

export function useFollowingList(userId: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ['following-list', userId],
    queryFn: () => SocialRepository.getInstance().getFollowing(userId!),
    enabled: Boolean(userId),
  });
}

// ── Toggle follow / unfollow ─────────────────────────────────
