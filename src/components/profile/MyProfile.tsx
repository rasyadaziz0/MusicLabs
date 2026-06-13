'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { getRecentPlays } from '@/lib/supabase/music';
import { getSongsByIds } from '@/lib/api/musicApi';
import { useLibraryPlaylists, useLikedSongs } from '@/hooks/useMusicLibrary';
import { useFollowCounts } from '@/hooks/useFollow';
import { UserProfile } from '@/types/profile';
import FollowListModal from '@/components/social/FollowListModal';
import type { PlaylistRecord } from '@/lib/supabase/music';
import type { Song } from '@/types/music';

// Imported Sections
import { ProfileHero } from './sections/ProfileHero';
import { RecentlyPlayedSection } from './sections/RecentlyPlayedSection';
import { PlaylistsSection } from './sections/PlaylistsSection';
import { FavoriteSongsSection } from './sections/FavoriteSongsSection';
import { AccountSettingsSection } from './sections/AccountSettingsSection';

export interface MyProfileInitialData {
  userId: string;
  profile: UserProfile;
  playlists: PlaylistRecord[];
  likedSongIds: string[];
  recentTrackIds: string[];
  stats: {
    playlistCount: number;
    likedCount: number;
    listenedCount: number;
    followerCount: number;
    followingCount: number;
  };
}

interface MyProfileProps {
  initialData: MyProfileInitialData;
}

export default function MyProfile({ initialData }: MyProfileProps) {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { playTrack } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');

  // Use React Query with initialData to keep data fresh after mutations
  const { data: profile } = useQuery({
    queryKey: ['userProfile', initialData.userId],
    queryFn: () => ProfileRepository.getInstance().getProfile(initialData.userId),
    initialData: initialData.profile,
  });

  const { data: playlists = initialData.playlists } = useLibraryPlaylists();
  const { data: likedSongs = [] } = useLikedSongs();

  const { data: recentlyPlayed = [] } = useQuery<Song[]>({
    queryKey: ['recentPlays', initialData.userId],
    queryFn: () => getRecentPlays(initialData.userId),
    initialData: undefined, // Will resolve on client
  });

  // Resolve liked songs to full Song objects on client
  const { data: likedSongsFull = [] } = useQuery<Song[]>({
    queryKey: ['likedSongsFull', initialData.likedSongIds],
    queryFn: () => getSongsByIds(initialData.likedSongIds),
    enabled: initialData.likedSongIds.length > 0,
  });

  const { data: followCounts } = useFollowCounts(initialData.userId);

  const stats = {
    playlistCount: playlists.length,
    likedCount: likedSongs.length || initialData.stats.likedCount,
    listenedCount: initialData.stats.listenedCount,
    followerCount: followCounts?.followers ?? initialData.stats.followerCount,
    followingCount: followCounts?.following ?? initialData.stats.followingCount,
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // GSAP entrance animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('[data-animate]'),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }
  }, []);

  // Redirect if not logged in (shouldn't happen with SSR, but safety net)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  return (
    <div ref={containerRef} className="pb-32 pt-2 max-w-[1400px] mx-auto">
      <ProfileHero
        user={user}
        profile={profile ?? initialData.profile}
        stats={stats}
        handleSignOut={handleSignOut}
        setFollowModalOpen={setFollowModalOpen}
        setFollowModalTab={setFollowModalTab}
      />

      {/* Divider */}
      <div className="px-5 md:px-8">
        <div className="h-px w-full bg-white/[0.06]" />
      </div>

      <RecentlyPlayedSection
        recentlyPlayed={recentlyPlayed}
        playTrack={playTrack}
      />

      <PlaylistsSection playlists={playlists} />

      <FavoriteSongsSection
        likedSongs={likedSongsFull.length > 0 ? likedSongsFull : likedSongs}
        playTrack={playTrack}
      />

      <AccountSettingsSection handleSignOut={handleSignOut} />

      {/* Follow List Modal */}
      <FollowListModal
        userId={user.id}
        initialTab={followModalTab}
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        followerCount={stats.followerCount}
        followingCount={stats.followingCount}
      />
    </div>
  );
}
