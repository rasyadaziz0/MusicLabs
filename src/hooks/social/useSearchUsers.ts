'use client';

import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { type UserProfile } from '@/types/profile';
import { useQuery } from '@tanstack/react-query';

export function useSearchUsers(query: string) {
  return useQuery<UserProfile[]>({
    queryKey: ['search-users', query],
    queryFn: () => ProfileRepository.getInstance().searchUsers(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
