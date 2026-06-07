'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getPublicPlaylists, type UserProfile } from '@/lib/supabase/social';
import { PlaylistRecord } from '@/lib/supabase/music';
import { useFollowCounts, useFollowStatus } from './useFollow';

export function useUserProfile(userId: string | null) {
  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: Boolean(userId),
  });

  const playlistsQuery = useQuery<PlaylistRecord[]>({
    queryKey: ['user-public-playlists', userId],
    queryFn: () => getPublicPlaylists(userId!) as Promise<PlaylistRecord[]>,
    enabled: Boolean(userId),
  });

  const followCounts = useFollowCounts(userId);
  const followStatus = useFollowStatus(userId);

  const isLoading =
    profileQuery.isLoading || playlistsQuery.isLoading || followCounts.isLoading;

  return {
    profile: profileQuery.data ?? null,
    publicPlaylists: playlistsQuery.data ?? [],
    followerCount: followCounts.data?.followers ?? 0,
    followingCount: followCounts.data?.following ?? 0,
    isFollowing: followStatus.data ?? false,
    isFollowStatusLoading: followStatus.isLoading,
    isLoading,
  };
}
