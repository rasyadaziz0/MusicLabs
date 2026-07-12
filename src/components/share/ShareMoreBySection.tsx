'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, MoreHorizontal } from 'lucide-react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { buildTrackPath } from '@/lib/utils/slugify';
import { usePlayer } from '@/context/PlayerContext';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';

interface ShareMoreBySectionProps {
  title: string;
  tracks: Song[];
  artistId?: string;
}

export function ShareMoreBySection({ title, tracks, artistId }: ShareMoreBySectionProps) {
  const { playTrack } = usePlayer();
  const router = useRouter();

  if (!tracks || tracks.length === 0) return null;

  return (
    <HorizontalScrollSection
      title={title}
      onSeeAll={artistId ? () => router.push(`/artist/${artistId}`) : undefined}
    >
      {tracks.map((track, idx) => {
        const coverUrl = getBestImageUrl(track.image);
        const artistNames = track.artists?.primary?.map((a) => a.name).join(', ') || '';
        const isSingle = track.album?.name?.toLowerCase() === 'single' || !track.album?.name || track.album?.name === track.name;
        const subtitle = isSingle ? 'Single' : (track.album?.name || artistNames);
        const trackUrl = buildTrackPath(track.artists?.primary?.[0]?.name || 'Artist', track.name, track.id);

        return (
          <Link
            key={`${track.id}-${idx}`}
            href={trackUrl}
            className="group flex-shrink-0 w-[160px] md:w-[180px] text-left cursor-pointer block"
          >
            <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={track.name}
                  fill
                  sizes="180px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-2xl font-bold">
                  {track.name.charAt(0)}
                </div>
              )}

              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

              {/* Hover Actions exactly matching TrackCard across app */}
              <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  aria-label={`Play ${track.name}`}
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playTrack(track, tracks);
                  }}
                >
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </button>
                <button
                  aria-label="More options"
                  className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug group-hover:text-[#FA243C] transition-colors">
              {track.name}
            </p>
            <p className="text-muted text-[13px] line-clamp-1 mt-0.5 leading-normal">
              {subtitle}
            </p>
          </Link>
        );
      })}
    </HorizontalScrollSection>
  );
}
