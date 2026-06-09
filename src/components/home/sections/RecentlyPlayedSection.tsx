import { Song } from '@/types/music';
import { TrackCard } from '@/components/home/HomeCards';
import { User } from '@supabase/supabase-js';

interface RecentlyPlayedSectionProps {
  recentlyPlayedSongs: Song[];
  isRecentLoading: boolean;
  user: User | null;
  playTrack: (song: Song, context: Song[]) => void;
}

export function RecentlyPlayedSection({ recentlyPlayedSongs, isRecentLoading, user, playTrack }: RecentlyPlayedSectionProps) {
  return (
    <section className="px-2">
      <div className="flex items-center gap-1 mb-4">
        <h2 className="text-[20px] font-bold text-white">{user ? 'Recently Played' : 'Trending Now'}</h2>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted ml-1 opacity-70"><path d="m9 18 6-6-6-6" /></svg>
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
  );
}
