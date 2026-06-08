import { useQuery } from '@tanstack/react-query';
import { getHomeFeed } from '@/lib/api/musicApi';
import { getRecentPlays } from '@/lib/supabase/music';
import { getSocialFeed } from '@/lib/supabase/social';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { MoodKey } from '@/config/moods';
import { MoodService } from '@/services/mood/MoodService';
import { usePlayer } from '@/context/PlayerContext';
import { Song } from '@/types/music';
import { useRouter } from 'next/navigation';

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

  const { data: homeData, isLoading: isHomeLoading } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => getHomeFeed(),
  });

  const { data: dbRecentPlays, isLoading: isRecentLoading } = useQuery({
    queryKey: ['recentPlays', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: !!user?.id,
  });

  const { data: socialFeed, isLoading: isSocialFeedLoading } = useQuery({
    queryKey: ['socialFeed', user?.id],
    queryFn: () => getSocialFeed(user!.id),
    enabled: !!user?.id,
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
    ? dbRecentPlays 
    : getSongWindow(trendingSongs, 2, 12);
    
  const moodSongs: Song[] = moodSongsData?.slice(0, 12) ?? [];

  return {
    user,
    handleSignOut,
    isProfileOpen,
    setIsProfileOpen,
    selectedMood,
    setSelectedMood,
    isHomeLoading,
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
