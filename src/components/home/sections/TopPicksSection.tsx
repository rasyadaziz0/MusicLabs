import { Song } from '@/types/music';
import { TopPicksCard } from '@/components/home/HomeCards';

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
  if (!trendingSongs || trendingSongs.length === 0) return null;

  return (
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
  );
}
