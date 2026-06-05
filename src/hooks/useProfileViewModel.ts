'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists, useLikedSongs } from '@/hooks/useMusicLibrary';
import { getRecentPlays, getListeningStats } from '@/lib/supabase/music';
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isLoading = isPlaylistsLoading || isLikedLoading || isRecentLoading;

  const stats = {
    playlistCount: playlists.length,
    likedCount: likedSongs.length,
    listenedCount: listeningStats?.totalPlays ?? 0,
  };

  return {
    user,
    playlists,
    likedSongs,
    recentlyPlayed,
    stats,
    isLoading,
    handleSignOut,
  };
}
