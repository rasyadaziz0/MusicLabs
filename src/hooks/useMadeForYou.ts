'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDiscoverWeekly } from '@/hooks/useDiscoverWeekly';
import { useLikedSongs } from '@/hooks/useMusicLibrary';
import {
  getMostPlayedSongs,
  getOlderTopSongs,
  getRecentPlays,
  getSongsPlayedBetweenHours,
} from '@/lib/supabase/music';
import { MoodService } from '@/services/mood/MoodService';
import { buildPersonalizedSections } from '@/lib/personalization/buildMixes';

export function useMadeForYou() {
  const { user } = useAuth();
  const discoverWeekly = useDiscoverWeekly();
  const likedSongsQuery = useLikedSongs();

  const recentSongsQuery = useQuery({
    queryKey: ['made-for-you-recent', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: Boolean(user?.id),
  });

  const onRepeatQuery = useQuery({
    queryKey: ['made-for-you-on-repeat', user?.id],
    queryFn: () => getMostPlayedSongs(user!.id, 12),
    enabled: Boolean(user?.id),
  });

  const missedHitsQuery = useQuery({
    queryKey: ['made-for-you-missed-hits', user?.id],
    queryFn: () => getOlderTopSongs(user!.id, { recentDays: 14, lookbackDays: 90, limit: 12 }),
    enabled: Boolean(user?.id),
  });

  const lateNightQuery = useQuery({
    queryKey: ['made-for-you-late-night', user?.id],
    queryFn: () => getSongsPlayedBetweenHours(user!.id, 22, 5, 12),
    enabled: Boolean(user?.id),
  });

  const focusMixQuery = useQuery({
    queryKey: ['made-for-you-focus-mix'],
    queryFn: () => MoodService.fetchMoodSongs('fokus'),
    staleTime: 1000 * 60 * 10,
  });

  const sections = buildPersonalizedSections({
    onRepeat: onRepeatQuery.data ?? [],
    fromYourLikes: likedSongsQuery.data?.slice(0, 12) ?? [],
    missedHits: missedHitsQuery.data ?? [],
    lateNightMix: (lateNightQuery.data?.length ?? 0) > 0
      ? lateNightQuery.data ?? []
      : recentSongsQuery.data?.slice(0, 12) ?? [],
    focusMix: focusMixQuery.data?.slice(0, 12) ?? [],
  });

  return {
    sections,
    discoverWeekly,
    isLoading:
      likedSongsQuery.isLoading ||
      recentSongsQuery.isLoading ||
      onRepeatQuery.isLoading ||
      missedHitsQuery.isLoading ||
      lateNightQuery.isLoading ||
      focusMixQuery.isLoading,
    hasPersonalData:
      Boolean(user) &&
      ((likedSongsQuery.data?.length ?? 0) > 0 || (recentSongsQuery.data?.length ?? 0) > 0),
  };
}
