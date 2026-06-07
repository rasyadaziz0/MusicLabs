'use client';

import Image from 'next/image';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

interface RecentlyPlayedSectionProps {
  recentlyPlayed: Song[];
  playTrack: (track: Song, queue: Song[]) => void;
}

export function RecentlyPlayedSection({ recentlyPlayed, playTrack }: RecentlyPlayedSectionProps) {
  if (recentlyPlayed.length === 0) return null;

  return (
    <div data-animate className="px-5 md:px-8">
      <HorizontalScrollSection title="Recently Played">
        {recentlyPlayed.map((song: Song, index: number) => (
          <button
            key={`${song.id}-recent-${index}`}
            type="button"
            className="group flex-shrink-0 w-[150px] md:w-[170px] text-left"
            onClick={() => playTrack(song, recentlyPlayed)}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-white/5 border border-white/5 shadow-sm">
              {getBestImageUrl(song.image) && (
                <Image
                  src={getBestImageUrl(song.image)!}
                  alt={song.name}
                  fill
                  sizes="170px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
            <p className="text-white font-medium text-[13px] line-clamp-1 leading-snug">
              {song.name}
            </p>
            <p className="text-white/40 text-[12px] line-clamp-1 mt-0.5">
              {song.artists.primary.map((a) => a.name).join(', ')}
            </p>
          </button>
        ))}
      </HorizontalScrollSection>
    </div>
  );
}
