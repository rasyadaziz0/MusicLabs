'use client';
import { GuestBanner } from '@/components/home/HomeCards';
import { HomeHeader } from '@/components/home/sections/HomeHeader';
import { RecentlyPlayedSection } from '@/components/home/sections/RecentlyPlayedSection';
import { TopPicksSection } from '@/components/home/sections/TopPicksSection';
import { useDiscoverWeekly } from '@/hooks/useDiscoverWeekly';
import { useHomeViewModel } from '@/hooks/useHomeViewModel';
import gsap from 'gsap';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

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
    isHomeError,
    homeError,
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

  if (isHomeError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Gagal Terhubung ke Server</h2>
        <p className="text-white/60 max-w-md">
          {homeError instanceof Error ? homeError.message : 'Koneksi ke backend gagal. Server mungkin sedang offline atau tidak dapat dijangkau.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-medium text-sm"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

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
