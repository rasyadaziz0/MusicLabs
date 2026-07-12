'use client';

import { Play, Pause } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { Song } from '@/types/music';

interface TrackPlayButtonProps {
  /** Serialized Song JSON passed from server component */
  trackJson: string;
}

/**
 * Client-side Play button for the SSR track detail page.
 * Receives the Song object as a JSON string from the server component
 * to avoid passing non-serializable props across the boundary.
 */
export default function TrackPlayButton({ trackJson }: TrackPlayButtonProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const track: Song = JSON.parse(trackJson);

  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
      <button
        onClick={() => {
          if (isCurrentTrack) {
            togglePlay();
          } else {
            playTrack(track);
          }
        }}
        aria-label={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
        className="flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-[#FA243C] hover:bg-[#ff3a50] text-white font-semibold text-sm shadow-lg shadow-[#FA243C]/30 hover:shadow-[#FA243C]/50 transition-all hover:scale-105 active:scale-95"
      >
        {isCurrentTrack && isPlaying ? (
          <>
            <Pause size={18} fill="white" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play size={18} fill="white" />
            <span>Play</span>
          </>
        )}
      </button>
    </div>
  );
}
