'use client';
import { Song } from '@/types/music';

import { TrackCard } from '@/components/home/HomeCards';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';

export interface FavoriteSongsSectionProps {
  likedSongs: Song[];
  playTrack: (track: Song, queue: Song[], index?: number | string) => void;
}
 // Or import from the correct place
export function FavoriteSongsSection({ likedSongs, playTrack }: FavoriteSongsSectionProps) {
  if (likedSongs.length === 0) return null;

  return (
    <div data-animate className="mt-10">
      <HorizontalScrollSection title="Favourite Songs" onSeeAll={() => { window.location.href = '/library/liked' }}>
        {likedSongs.slice(0, 10).map((song, index) => (
          <TrackCard
            key={song.id}
            song={song}
            onPlay={() => playTrack(song, likedSongs, index)}
          />
        ))}
      </HorizontalScrollSection>
    </div>
  );
}
