'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

interface FavoriteSongsSectionProps {
  likedSongs: Song[];
  playTrack: (track: Song, queue: Song[]) => void;
}

export function FavoriteSongsSection({ likedSongs, playTrack }: FavoriteSongsSectionProps) {
  if (likedSongs.length === 0) return null;

  return (
    <div data-animate className="px-5 md:px-8 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-white tracking-tight">Favourite Songs</h2>
        <Link
          href="/library/liked"
          className="text-[13px] text-[#FA243C] font-medium hover:underline flex items-center gap-0.5"
        >
          See All
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        {likedSongs.slice(0, 5).map((song: Song, index: number) => (
          <button
            key={song.id}
            type="button"
            onClick={() => playTrack(song, likedSongs)}
            className={`group w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left ${
              index < Math.min(likedSongs.length, 5) - 1
                ? 'border-b border-white/[0.04]'
                : ''
            }`}
          >
            {/* Artwork */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
              {getBestImageUrl(song.image) ? (
                <Image
                  src={getBestImageUrl(song.image)!}
                  alt={song.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#FA243C]/10" />
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-white truncate">{song.name}</p>
              <p className="text-[12px] text-white/40 truncate">
                {song.artists.primary.map((a) => a.name).join(', ')}
              </p>
            </div>
            {/* Duration */}
            <span className="text-[12px] text-white/30 tabular-nums flex-shrink-0">
              {Math.floor(song.duration / 60)}:
              {(song.duration % 60).toString().padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
