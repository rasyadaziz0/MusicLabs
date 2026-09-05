import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { MusicApiService } from '@/lib/api/MusicApiService';
import * as MoodService from '@/lib/services/mood';
import { getRecentPlays } from '@/lib/supabase/music';
import { SocialRepository } from '@/lib/supabase/repositories/SocialRepository';
import { MoodKey } from '@/types/config/moods';
import { Song } from '@/types/music';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useHomeViewModel() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { playTrack } = usePlayer();
  const [selectedMood, setSelectedMood] = useState<MoodKey>('fokus');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const { data: homeData, isLoading: isHomeLoading, isError: isHomeError, error: homeError } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => MusicApiService.getHomeFeed(),
    retry: 1, // don't retry too many times if backend is dead
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const { data: dbRecentPlays, isLoading: isRecentLoading } = useQuery({
    queryKey: ['recentPlays', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const { data: socialFeed, isLoading: isSocialFeedLoading } = useQuery({
    queryKey: ['socialFeed', user?.id],
    queryFn: () => SocialRepository.getInstance().getSocialFeed(),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: moodSongsData, isLoading: isMoodSongsLoading } = useQuery<Song[]>({
    queryKey: ['homeMoodSongs', 'v2', selectedMood],
    queryFn: () => MoodService.fetchMoodSongs(selectedMood),
    staleTime: 1000 * 60 * 10,
  });

  const getSongWindow = (songs: Song[], start: number, limit = 10) => {
    if (!songs.length) return [];
    const count = Math.min(limit, songs.length);
    return Array.from({ length: count }, (_, i) => songs[(start + i) % songs.length]);
  };

  const trendingSongs = homeData?.trending?.songs || [];
  const newReleaseAlbums = homeData?.albums || [];
  
  const recentlyPlayedSongs = user && dbRecentPlays && dbRecentPlays.length > 0 
    ? dbRecentPlays.slice(0, 30)
    : getSongWindow(trendingSongs, 2, Math.max(20, trendingSongs.length));
    
  const moodSongsRaw: Song[] = moodSongsData ?? [];
  const moodSongs: Song[] = moodSongsRaw.length > 0
    ? Array.from({ length: Math.max(20, moodSongsRaw.length) }, (_, i) => moodSongsRaw[i % moodSongsRaw.length]).slice(0, 30)
    : [];

  return {
    user,
    handleSignOut,
    isProfileOpen,
    setIsProfileOpen,
    selectedMood,
    setSelectedMood,
    isHomeLoading,
    isHomeError,
    homeError,
    isRecentLoading,
    isMoodSongsLoading,
    isSocialFeedLoading,
    trendingSongs,
    newReleaseAlbums,
    recentlyPlayedSongs,
    moodSongs,
    socialFeed,
    playTrack,
  };
}

