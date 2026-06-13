'use client';

import React from 'react';
import { Song } from '@/types/music';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';
import { TrackCard } from '@/components/home/HomeCards'; // Or import from the correct place

interface FavoriteSongsSectionProps {
  likedSongs: Song[];
  playTrack: (track: Song, queue: Song[]) => void;
}

export function FavoriteSongsSection({ likedSongs, playTrack }: FavoriteSongsSectionProps) {
  if (likedSongs.length === 0) return null;

  return (
    <div data-animate className="mt-10">
      <HorizontalScrollSection title="Favourite Songs" onSeeAll={() => { window.location.href = '/library/liked' }}>
        {likedSongs.slice(0, 10).map((song) => (
          <TrackCard
            key={song.id}
            song={song}
            onPlay={() => playTrack(song, likedSongs)}
          />
        ))}
      </HorizontalScrollSection>
    </div>
  );
}
