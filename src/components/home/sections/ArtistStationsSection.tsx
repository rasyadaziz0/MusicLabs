'use client';

import { ArtistStationCard } from '@/components/home/ArtistStationCard';
import { ScrollArrows } from '@/components/ui/ScrollArrows';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useFollowedArtistStations } from '@/hooks/useFollowedArtistStations';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { Radio } from 'lucide-react';

export function ArtistStationsSection() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: stations = [], isLoading } = useFollowedArtistStations(10);
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll();

  // Rule AUTH-02: User must be authenticated
  if (!user) return null;

  // Rule STA-03: If not loading and no stations from followed artists, do NOT render section
  if (!isLoading && stations.length === 0) return null;

  return (
    <section className="px-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-[#FA243C]/20 flex items-center justify-center text-[#FA243C]">
            <Radio size={15} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FA243C]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">
                {t('home.artist_stations_title')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FA243C]/20 border border-[#FA243C]/30 text-[#FA243C]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FA243C] animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-white/50">
              {t('home.artist_stations_desc')}
            </p>
          </div>
        </div>
      </div>

      <div className="relative group/section">
        <ScrollArrows
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => scroll('left')}
          onScrollRight={() => scroll('right')}
        />

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 md:gap-5 pb-4 scrollbar-hide -mx-4 px-4 md:-ml-[296px] md:pl-[296px] md:-mr-[40px] md:pr-[40px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            // Skeleton state
            [...Array(5)].map((_, i) => (
              <div
                key={`station-loading-${i}`}
                className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[180px] space-y-2.5 animate-pulse"
              >
                <div className="aspect-square rounded-[14px] bg-white/5" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))
          ) : (
            stations.map((station) => (
              <ArtistStationCard
                key={`station-${station.artist.id}`}
                station={station}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
