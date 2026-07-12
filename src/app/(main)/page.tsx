'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useHomeViewModel } from '@/hooks/useHomeViewModel';
import { GuestBanner } from '@/components/home/HomeCards';
import { useDiscoverWeekly } from '@/hooks/useDiscoverWeekly';
import { HomeHeader } from '@/components/home/sections/HomeHeader';
import { TopPicksSection } from '@/components/home/sections/TopPicksSection';
import { RecentlyPlayedSection } from '@/components/home/sections/RecentlyPlayedSection';
import dynamic from 'next/dynamic';

const MobileStationsSection = dynamic(() => import('@/components/home/sections/MobileStationsSection').then(mod => mod.MobileStationsSection), { ssr: false });
const SocialFeedSection = dynamic(() => import('@/components/home/sections/SocialFeedSection').then(mod => mod.SocialFeedSection), { ssr: false });
const MoodsSection = dynamic(() => import('@/components/home/sections/MoodsSection').then(mod => mod.MoodsSection), { ssr: false });

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playlistId: discoverPlaylistId } = useDiscoverWeekly();

  const {
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
    recentlyPlayedSongs,
    moodSongs,
    socialFeed,
    playTrack,
  } = useHomeViewModel();

  useEffect(() => {
    if (!isHomeLoading && containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('section'),
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );
    }
  }, [isHomeLoading]);

  if (isHomeLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-64 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-10 pb-12 pt-2">
      <HomeHeader
        user={user}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        handleSignOut={handleSignOut}
      />

      <TopPicksSection
        trendingSongs={trendingSongs}
        playTrack={playTrack}
      />

      <RecentlyPlayedSection
        recentlyPlayedSongs={recentlyPlayedSongs}
        isRecentLoading={isRecentLoading}
        user={user}
        playTrack={playTrack}
      />

      <MobileStationsSection
        user={user}
        discoverPlaylistId={discoverPlaylistId}
      />

      {/* Guest Sign-In Banner */}
      {!user && <GuestBanner />}

      <SocialFeedSection
        user={user}
        socialFeed={socialFeed}
        isSocialFeedLoading={isSocialFeedLoading}
        playTrack={playTrack}
      />

      <MoodsSection
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        moodSongs={moodSongs}
        isMoodSongsLoading={isMoodSongsLoading}
        playTrack={playTrack}
      />
    </div>
  );
}
