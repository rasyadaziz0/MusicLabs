'use client';

import { getBestImageUrl } from '@/lib/api/musicApi';
import Image from 'next/image';
import Link from 'next/link';
import { Song } from '@/types/music';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LogOut, Sparkles, Play, RefreshCw, Loader2 } from 'lucide-react';
import { MOOD_PLAYLISTS } from '@/config/moods';
import { useHomeViewModel } from '@/hooks/useHomeViewModel';
import { TopPicksCard, TrackCard, SocialActivityCard, GuestBanner } from '@/components/home/HomeCards';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // AcadMusic style solid gradients
  const topPicksGradients = [
    'linear-gradient(135deg, #FA243C, #FF6275)',
    'linear-gradient(135deg, #E6D02A, #C8B625)',
    'linear-gradient(135deg, #162E93, #2F2FE4)',
    'linear-gradient(135deg, #8A2BE2, #B026FF)',
    'linear-gradient(135deg, #10B981, #34D399)',
  ];

  return (
    <div ref={containerRef} className="space-y-10 pb-12 pt-2">
      {/* Header */}
      <div className="px-2">
        <header className="flex items-center justify-between">
          <h1 className="text-[34px] font-bold tracking-tight text-white mb-2">Home</h1>
          {user && (
            <div className="relative z-50 md:hidden mb-2">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full overflow-hidden bg-white/10 relative border border-white/10"
              >
                {user.user_metadata?.avatar_url ? (
                  <Image src={user.user_metadata.avatar_url.trim().replace(/^`+|`+$/g, '')} alt="User" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FA243C]" />
                )}
              </button>
              
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 top-11 w-48 bg-[#2c2c2e] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden py-1">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <p className="text-[13px] font-semibold text-white/90 truncate">{user.user_metadata?.name || 'User'}</p>
                      <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>
        <div className="h-[1px] w-full bg-white/10 mt-2" />
      </div>

      {/* Top Picks Section */}
      <section className="px-2">
        <h2 className="text-[20px] font-bold text-white mb-4">Top Picks for You</h2>

        <div className="flex overflow-x-auto gap-4 md:gap-5 pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {trendingSongs.slice(0, 8).map((song: Song, index: number) => {
            const bgGradient = topPicksGradients[index % topPicksGradients.length];
            return (
              <TopPicksCard
                key={song.id}
                song={song}
                index={index}
                gradient={bgGradient}
                onPlay={() => playTrack(song, trendingSongs)}
              />
            );
          })}
        </div>
      </section>

      <section className="px-2">
        <div className="flex items-center gap-1 mb-4">
          <h2 className="text-[20px] font-bold text-white">{user ? 'Recently Played' : 'Trending Now'}</h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted ml-1 opacity-70"><path d="m9 18 6-6-6-6"/></svg>
        </div>
        <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {isRecentLoading && user ? (
            [...Array(6)].map((_, i) => (
              <div
                key={`recent-loading-${i}`}
                className="flex-shrink-0 w-[160px] md:w-[180px] aspect-square rounded-[12px] bg-white/5 animate-pulse"
              />
            ))
          ) : recentlyPlayedSongs.length > 0 ? (
            recentlyPlayedSongs.map((song: Song, index: number) => (
              <TrackCard
                key={`${song.id}-recent-${index}`}
                song={song}
                onPlay={() => playTrack(song, recentlyPlayedSongs)}
              />
            ))
          ) : (
            <p className="text-sm text-muted">No recently played songs.</p>
          )}
        </div>
      </section>

      {/* Mobile-only Discover Weekly Playlist Card */}
      {user && (
        <section className="px-2 pt-4 md:hidden">
          <div className="flex items-center gap-1 mb-4">
            <h2 className="text-[20px] font-bold text-white">Made For You</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-4 px-4">
            <Link href="/made-for-you" className="group flex-shrink-0 w-[160px] text-left">
              <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-gradient-to-br from-[#FA243C] to-[#2F2FE4] border border-white/10 flex flex-col items-center justify-center p-4 shadow-lg">
                <Sparkles size={36} className="text-white opacity-90 mb-2" />
                <span className="text-white font-bold text-[18px] leading-tight text-center tracking-tight">Discover<br/>Weekly</span>
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">Discover Weekly</p>
              <p className="text-muted text-[13px] line-clamp-1 mt-0.5">Lagu baru tiap minggu</p>
            </Link>
          </div>
        </section>
      )}

      {/* Guest Sign-In Banner */}
      {!user && <GuestBanner />}

      {/* Social Feed Section */}
      {user && (
        <section className="px-2 pt-4">
          <div className="flex items-center gap-1 mb-4">
            <h2 className="text-[20px] font-bold text-white">Activity Feed</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {isSocialFeedLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={`social-loading-${i}`}
                  className="flex-shrink-0 w-[240px] md:w-[280px] h-[80px] rounded-[12px] bg-white/5 animate-pulse"
                />
              ))
            ) : socialFeed && socialFeed.length > 0 ? (
              socialFeed.map((item: any, index: number) => (
                <SocialActivityCard
                  key={`${item.id}-social-${index}`}
                  item={item}
                  onPlay={() => playTrack(item.track, socialFeed.map((f: any) => f.track))}
                />
              ))
            ) : (
              <p className="text-sm text-muted">No recent activity from people you follow.</p>
            )}
          </div>
        </section>
      )}

      {/* Restyled Mood / Browse Section */}
      <section className="px-2 pt-4">
        <h2 className="text-[20px] font-bold text-white mb-4">Moods & Activities</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {MOOD_PLAYLISTS.map((mood) => {
            const isActive = mood.key === selectedMood;
            return (
              <button
                key={mood.key}
                type="button"
                onClick={() => setSelectedMood(mood.key)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                  }`}
              >
                {mood.label}
              </button>
            );
          })}
        </div>
        <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {isMoodSongsLoading && (
            [...Array(6)].map((_, i) => (
              <div
                key={`mood-loading-${i}`}
                className="flex-shrink-0 w-[160px] md:w-[180px] aspect-square rounded-[12px] bg-white/5 animate-pulse"
              />
            ))
          )}
          {!isMoodSongsLoading && moodSongs.map((song: Song, index: number) => (
            <TrackCard
              key={`${song.id}-mood-${selectedMood}-${index}`}
              song={song}
              onPlay={() => playTrack(song, moodSongs)}
            />
          ))}
          {!isMoodSongsLoading && moodSongs.length === 0 && (
            <p className="text-sm text-muted">No songs available for this mood.</p>
          )}
        </div>
      </section>

    </div>
  );
}

