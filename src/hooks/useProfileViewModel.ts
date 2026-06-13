'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists, useLikedSongs } from '@/hooks/useMusicLibrary';
import { getRecentPlays, getListeningStats } from '@/lib/supabase/music';
import { getSongsByIds } from '@/lib/api/musicApi';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { useFollowCounts } from '@/hooks/useFollow';
import { UserProfile } from '@/types/profile';
import { useRouter } from 'next/navigation';

export function useProfileViewModel() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();
  const { data: likedSongs = [], isLoading: isLikedLoading } = useLikedSongs();

  const { data: recentlyPlayed = [], isLoading: isRecentLoading } = useQuery({
    queryKey: ['recentPlays', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: !!user?.id,
  });

  const { data: listeningStats } = useQuery({
    queryKey: ['listeningStats', user?.id],
    queryFn: () => getListeningStats(user!.id),
    enabled: !!user?.id,
  });

  const { data: followCounts } = useFollowCounts(user?.id ?? null);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => ProfileRepository.getInstance().getProfile(user!.id),
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isLoading = isPlaylistsLoading || isLikedLoading || isRecentLoading;

  const stats = {
    playlistCount: playlists.length,
    likedCount: likedSongs.length,
    listenedCount: listeningStats?.totalPlays ?? 0,
    followerCount: followCounts?.followers ?? 0,
    followingCount: followCounts?.following ?? 0,
  };

  return {
    user,
    profile,
    playlists,
    likedSongs,
    recentlyPlayed,
    stats,
    isLoading,
    handleSignOut,
  };
}
