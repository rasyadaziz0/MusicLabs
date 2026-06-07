'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TopSongRow } from '@/components/ui/TopSongRow';
import { Song } from '@/types/music';

interface ArtistTopSongsProps {
  topTracks: Song[];
  isTracksLoading: boolean;
  currentTrackId?: string;
  isPlaying: boolean;
  playTrack: (song: Song, list: Song[]) => void;
}

export function ArtistTopSongs({
  topTracks,
  isTracksLoading,
  currentTrackId,
  isPlaying,
  playTrack,
}: ArtistTopSongsProps) {
  const [showAllSongs, setShowAllSongs] = useState(false);

  // Top songs to display (Apple Music shows ~6 by default, expand to more)
  const visibleTopSongs = showAllSongs ? topTracks : topTracks.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-[17px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group"
          onClick={() => setShowAllSongs(!showAllSongs)}
        >
          Top Songs
          <ChevronRight
            size={16}
            className="text-white/40 ml-1 group-hover:text-[#FA243C] transition-colors"
          />
        </h2>
      </div>

      {isTracksLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-6 h-4 bg-white/5 rounded" />
              <div className="w-11 h-11 bg-white/5 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : topTracks.length === 0 ? (
        <p className="text-white/30 py-4 text-[13px]">No top songs available.</p>
      ) : (
        <>
          {/* 2-column grid for wider screens, 1-column on mobile */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4">
            {visibleTopSongs.map((song, idx) => (
              <TopSongRow
                key={song.id}
                song={song}
                index={idx + 1}
                onPlay={() => playTrack(song, topTracks)}
                isCurrentlyPlaying={currentTrackId === song.id && isPlaying}
              />
            ))}
          </div>

          {topTracks.length > 6 && (
            <button
              onClick={() => setShowAllSongs(!showAllSongs)}
              className="mt-3 text-[13px] font-medium text-[#FA243C] hover:text-[#ff5070] transition-colors px-3"
            >
              {showAllSongs ? 'Show Less' : `See All ${topTracks.length} Songs`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
