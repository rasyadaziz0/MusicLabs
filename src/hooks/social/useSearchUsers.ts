'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type FollowCounts, type UserProfile } from '@/types/profile';

export function useSearchUsers(query: string) {
  return useQuery<UserProfile[]>({
    queryKey: ['search-users', query],
    queryFn: () => ProfileRepository.getInstance().searchUsers(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
