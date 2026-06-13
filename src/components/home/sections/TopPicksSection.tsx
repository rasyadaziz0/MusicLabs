import { Song } from '@/types/music';
import { TopPicksCard } from '@/components/home/HomeCards';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { ScrollArrows } from '@/components/ui/ScrollArrows';

interface TopPicksSectionProps {
  trendingSongs: Song[];
  playTrack: (song: Song, context: Song[]) => void;
}

const topPicksGradients = [
  'linear-gradient(135deg, #FA243C, #FF6275)',
  'linear-gradient(135deg, #E6D02A, #C8B625)',
  'linear-gradient(135deg, #162E93, #2F2FE4)',
  'linear-gradient(135deg, #8A2BE2, #B026FF)',
  'linear-gradient(135deg, #10B981, #34D399)',
];

export function TopPicksSection({ trendingSongs, playTrack }: TopPicksSectionProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll();

  if (!trendingSongs || trendingSongs.length === 0) return null;

  return (
    <section className="px-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-white">Top Picks for You</h2>
      </div>
      <div className="relative group/section">
        <ScrollArrows 
          canScrollLeft={canScrollLeft} 
          canScrollRight={canScrollRight} 
          onScrollLeft={() => scroll('left')} 
          onScrollRight={() => scroll('right')} 
        />
      <div ref={scrollRef} className="flex overflow-x-auto gap-4 md:gap-5 pb-6 scrollbar-hide -mx-4 px-4 md:-ml-[296px] md:pl-[296px] md:-mr-[40px] md:pr-[40px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {Array.from({ length: Math.max(20, trendingSongs.length) }, (_, i) => trendingSongs[i % trendingSongs.length])
          .slice(0, 30)
          .map((song: Song, index: number) => {
          const bgGradient = topPicksGradients[index % topPicksGradients.length];
          return (
            <TopPicksCard
              key={`${song.id}-toppicks-${index}`}
              song={song}
              index={index}
              gradient={bgGradient}
              onPlay={() => playTrack(song, trendingSongs)}
            />
          );
        })}
      </div>
      </div>
    </section>
  );
}
