'use client';

import { useQuery } from '@tanstack/react-query';
import { searchRadioStations, searchRadioByName, radioStationToSong } from '@/lib/api/radioApi';
import { RadioStation } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
// Using native <img> for radio logos since favicons come from unpredictable external domains
import { useState, useEffect, useRef } from 'react';
import { Search, Radio, Signal, Globe, Wifi, Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

const CATEGORIES = [
  { key: 'all', label: 'All Stations' },
  { key: 'pop', label: 'Pop' },
  { key: 'rock', label: 'Rock' },
  { key: 'jazz', label: 'Jazz' },
  { key: 'islamic', label: 'Islamic' },
  { key: 'news', label: 'News' },
  { key: 'dangdut', label: 'Dangdut' },
  { key: 'classical', label: 'Classical' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

export default function RadioPage() {
  const { currentTrack, isPlaying, isResolving, playTrack, togglePlay, isRadio, radioMeta } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Indonesian stations
  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['radioStations', 'Indonesia'],
    queryFn: () => searchRadioStations('Indonesia', 100),
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Search query — searches globally
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['radioSearch', searchQuery],
    queryFn: () => searchRadioByName(searchQuery, 30),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

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

  const handlePlayStation = (station: RadioStation) => {
    const song = radioStationToSong(station);
    // Check if this station is already playing
    if (currentTrack?.id === song.id && isRadio) {
      togglePlay();
    } else {
      playTrack(song);
    }
  };

  const filteredStations = (() => {
    const list = searchQuery.length >= 2 ? searchResults : stations;
    if (activeCategory === 'all') return list;
    return list.filter((s) => {
      const tags = s.tags.toLowerCase();
      const name = s.name.toLowerCase();
      return tags.includes(activeCategory) || name.includes(activeCategory);
    });
  })();

  const isStationPlaying = (station: RadioStation) => {
    return currentTrack?.id === `radio_${station.stationuuid}` && isRadio;
  };

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
        <section className="px-2">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FA243C]/15 via-[#FA243C]/5 to-transparent border border-[#FA243C]/20 p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA243C]/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 relative z-10">
              {/* Animated signal icon */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#FA243C]/20 flex items-center justify-center flex-shrink-0">
                {currentTrack.image?.[0]?.url ? (
                  <img
                    src={currentTrack.image[0].url}
                    alt={currentTrack.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Signal size={24} className="text-[#FA243C] animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#FA243C] uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FA243C]" />
                  </span>
                  Now Playing
                </p>
                <p className="text-[16px] font-bold text-white truncate leading-snug">
                  {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                    ? radioMeta.title
                    : currentTrack.name}
                </p>
                <p className="text-[13px] text-white/50 truncate">
                  {radioMeta?.station || currentTrack.name}
                  {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                    ? ` • ${radioMeta.title}`
                    : ''}
                </p>
              </div>
              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause size={20} fill="white" className="text-white" />
                ) : (
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </section>
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
        {(isLoading || isSearching) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-[80px] rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && !isSearching && filteredStations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe size={48} className="text-white/10 mb-4" />
            <p className="text-white/40 text-[15px]">
              {searchQuery ? 'No stations found for your search' : 'No stations available in this category'}
            </p>
          </div>
        )}

        {!isLoading && !isSearching && filteredStations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStations.map((station) => {
              const playing = isStationPlaying(station);
              return (
                <button
                  key={station.stationuuid}
                  onClick={() => handlePlayStation(station)}
                  className={cn(
                    'radio-card group relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    playing
                      ? 'bg-[#FA243C]/10 border-[#FA243C]/30 ring-1 ring-[#FA243C]/20'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                  )}
                >
                  {/* Station Logo */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt={station.name}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                        onError={(e) => {
                          // Hide broken favicons
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    {/* Fallback icon always rendered behind the image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Radio size={20} className="text-white/20" />
                    </div>

                    {/* Play overlay */}
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                      playing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {playing && isResolving ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                      ) : playing && isPlaying ? (
                        <Pause size={20} className="text-white" fill="white" />
                      ) : (
                        <Play size={18} className="text-white ml-0.5" fill="white" />
                      )}
                    </div>
                  </div>

                  {/* Station Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[14px] font-semibold truncate leading-snug",
                      playing ? "text-[#FA243C]" : "text-white"
                    )}>
                      {station.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {station.bitrate > 0 && (
                        <span className="text-[11px] text-white/30 font-medium">
                          {station.bitrate} kbps
                        </span>
                      )}
                      {station.codec && (
                        <span className="text-[11px] text-white/30 font-medium uppercase">
                          {station.codec}
                        </span>
                      )}
                      {station.tags && (
                        <span className="text-[11px] text-white/20 truncate max-w-[120px]">
                          {station.tags.split(',').slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                    {/* Show now-playing for active station */}
                    {playing && radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio' && (
                      <p className="text-[11px] text-[#FA243C]/70 mt-1 truncate flex items-center gap-1.5">
                        <Wifi size={10} className="animate-pulse flex-shrink-0" />
                        {radioMeta.title}
                      </p>
                    )}
                  </div>

                  {/* Live indicator for playing station */}
                  {playing && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FA243C]" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
