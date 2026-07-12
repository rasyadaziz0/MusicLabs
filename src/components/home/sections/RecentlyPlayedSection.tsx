import { Song } from '@/types/music';
import { TrackCard } from '@/components/home/HomeCards';
import { User } from '@supabase/supabase-js';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { ScrollArrows } from '@/components/ui/ScrollArrows';

interface RecentlyPlayedSectionProps {
  recentlyPlayedSongs: Song[];
  isRecentLoading: boolean;
  user: User | null;
  playTrack: (song: Song, context: Song[]) => void;
}

export function RecentlyPlayedSection({ recentlyPlayedSongs, isRecentLoading, user, playTrack }: RecentlyPlayedSectionProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll();

  return (
    <section className="px-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-white">{user ? 'Recently Played' : 'Trending Now'}</h2>
      </div>
      <div className="relative group/section">
        <ScrollArrows 
          canScrollLeft={canScrollLeft} 
          canScrollRight={canScrollRight} 
          onScrollLeft={() => scroll('left')} 
          onScrollRight={() => scroll('right')} 
        />
        <div ref={scrollRef} className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:-ml-[296px] md:pl-[296px] md:-mr-[40px] md:pr-[40px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                priority={index < 4}
              />
            ))
          ) : (
            <p className="text-sm text-muted">No recently played songs.</p>
          )}
        </div>
      </div>
    </section>
  );
}
