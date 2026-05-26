'use client';

import { getBestImageUrl } from '@/lib/api/musicApi';
import Image from 'next/image';
import { Song } from '@/types/music';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LogOut } from 'lucide-react';
import { MOOD_PLAYLISTS } from '@/config/moods';
import { useHomeViewModel } from '@/hooks/useHomeViewModel';

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
    trendingSongs,
    recentlyPlayedSongs,
    moodSongs,
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
              <div
                key={song.id}
                className="group relative flex-shrink-0 w-[260px] md:w-[310px] aspect-[4/5] rounded-[16px] overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
                onClick={() => playTrack(song, trendingSongs)}
                style={{ background: bgGradient }}
              >
                {/* Subtle AcadMusic Logo in top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80">
                  <span className="text-[12px] font-bold text-white tracking-tight">AcadMusic</span>
                </div>

                {/* Optional centered image collage effect for variety */}
                {index % 2 === 1 && getBestImageUrl(song.image) && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-black/10">
                    <Image
                      src={getBestImageUrl(song.image)!}
                      alt={song.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 p-5 w-full bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white/90 text-[11px] font-semibold mb-1 uppercase tracking-widest">
                    {index % 2 === 0 ? 'Made for You' : 'New Release'}
                  </p>
                  <h3 className="text-2xl md:text-[28px] font-bold text-white mb-1 line-clamp-2 leading-tight">
                    {index % 2 === 0 ? 'New Music' : song.name}
                  </h3>
                  <p className="text-[14px] text-white/80 line-clamp-2 leading-snug">
                    {index % 2 === 0 
                      ? `${song.artists.primary.map(a => a.name).join(', ')} and more`
                      : `${song.artists.primary.map(a => a.name).join(', ')}`
                    }
                  </p>
                </div>
              </div>
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
              <button
                key={`${song.id}-recent-${index}`}
                type="button"
                className="group flex-shrink-0 w-[160px] md:w-[180px] text-left"
                onClick={() => playTrack(song, recentlyPlayedSongs)}
              >
                <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
                  {getBestImageUrl(song.image) && (
                    <Image
                      src={getBestImageUrl(song.image)!}
                      alt={song.name}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  )}
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">{song.name}</p>
                <p className="text-muted text-[13px] line-clamp-1 mt-0.5">
                  {song.artists.primary.map(a => a.name).join(', ')}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">No recently played songs.</p>
          )}
        </div>
      </section>

      {/* Guest Sign-In Banner */}
      {!user && (
        <section className="px-2">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FA243C]/20 via-[#FA243C]/10 to-transparent border border-[#FA243C]/20 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-white mb-1">Get the full experience</h3>
              <p className="text-[13px] text-white/50">Sign in to save songs, create playlists, and listen to full tracks.</p>
            </div>
            <a
              href="/login"
              className="flex-shrink-0 ml-4 px-5 py-2 rounded-full bg-[#FA243C] text-white text-[13px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
            >
              Sign In
            </a>
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
            <button
              key={`${song.id}-mood-${selectedMood}-${index}`}
              type="button"
              className="group flex-shrink-0 w-[160px] md:w-[180px] text-left"
              onClick={() => playTrack(song, moodSongs)}
            >
              <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
                {getBestImageUrl(song.image) && (
                  <Image
                    src={getBestImageUrl(song.image)!}
                    alt={song.name}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">{song.name}</p>
              <p className="text-muted text-[13px] line-clamp-1 mt-0.5">
                {song.artists.primary.map(a => a.name).join(', ')}
              </p>
            </button>
          ))}
          {!isMoodSongsLoading && moodSongs.length === 0 && (
            <p className="text-sm text-muted">No songs available for this mood.</p>
          )}
        </div>
      </section>

    </div>
  );
}
