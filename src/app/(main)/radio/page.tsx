'use client';

import { useEffect, useRef } from 'react';
import { Search, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

import { useRadioController, CATEGORIES } from './useRadioController';
import { NowPlayingRadioBanner, RadioStationCard, RadioSkeletonGrid, RadioEmptyState } from '@/components/radio/RadioCards';

export default function RadioPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying,
    isResolving,
    togglePlay,
    isRadio,
    radioMeta,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    isLoading,
    isSearching,
    filteredStations,
    handlePlayStation,
    isStationPlaying,
  } = useRadioController();

  // GSAP entrance animation
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.radio-card'),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }
  }, [isLoading, activeCategory, searchQuery]);

  return (
    <div ref={containerRef} className="pb-12 pt-2 space-y-8">
      {/* Header */}
      <header className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA243C] to-[#FF6275] flex items-center justify-center">
            <Radio size={22} className="text-white" />
          </div>
          <h1 className="text-[34px] font-bold tracking-tight text-white">Radio</h1>
        </div>
        <p className="text-[15px] text-white/50 mb-4">
          Live radio stations from Indonesia and around the world
        </p>
        <div className="h-[1px] w-full bg-white/10" />
      </header>

      {/* Now Playing Radio Banner */}
      {isRadio && currentTrack && (
        <NowPlayingRadioBanner
          currentTrack={currentTrack}
          radioMeta={radioMeta}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
        />
      )}

      {/* Search */}
      <section className="px-2">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search radio stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#FA243C]/40 focus:bg-white/[0.08] transition-colors"
          />
        </div>
      </section>

      {/* Category Pills */}
      <section className="px-2">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border',
                activeCategory === cat.key
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white/20 hover:bg-white/10'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Station Grid */}
      <section className="px-2">
        {(isLoading || isSearching) && <RadioSkeletonGrid />}

        {!isLoading && !isSearching && filteredStations.length === 0 && (
          <RadioEmptyState searchQuery={searchQuery} />
        )}

        {!isLoading && !isSearching && filteredStations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStations.map((station: any) => (
              <RadioStationCard
                key={station.stationuuid}
                station={station}
                isPlaying={isStationPlaying(station)}
                isResolving={isResolving}
                isAudioPlaying={isPlaying}
                onPlay={() => handlePlayStation(station)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
