import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Loader2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export interface DesktopPlaybackControlsProps {
  hasTrack: boolean;
  isPlaying: boolean;
  isResolving: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

export default function DesktopPlaybackControls({
  hasTrack, isPlaying, isResolving, isShuffled, repeatMode,
  togglePlay, nextTrack, prevTrack, toggleShuffle, cycleRepeatMode
}: DesktopPlaybackControlsProps) {
  const { isAutoplayEnabled, toggleAutoplay } = usePlayer();

  return (
    <div className="flex items-center gap-[8px]">
      <button
        onClick={() => hasTrack && toggleShuffle()}
        className={cn("transition-colors", hasTrack ? (isShuffled ? "text-[#ff3b30]" : "text-white/90 hover:text-white") : "text-white/15 cursor-default")}
      >
        <Shuffle size={18} strokeWidth={2.5} />
      </button>
      <button onClick={hasTrack ? prevTrack : undefined} className={cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
        <SkipBack size={24} fill="currentColor" strokeWidth={0} />
      </button>
      <button
        onClick={hasTrack ? togglePlay : undefined}
        disabled={!hasTrack || isResolving ? true : undefined}
        className={cn(
          "flex items-center justify-center transition-all disabled:opacity-50",
          hasTrack ? "w-9 h-9 rounded-full bg-white text-black hover:scale-105 active:scale-95" : "w-9 h-9 rounded-full bg-white/10 text-white/30 cursor-default"
        )}
      >
        {isResolving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={18} fill="currentColor" strokeWidth={0} />
        ) : (
          <Play size={18} fill="currentColor" strokeWidth={0} className="ml-1" />
        )}
      </button>
      <button onClick={hasTrack ? nextTrack : undefined} className={cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
        <SkipForward size={24} fill="currentColor" strokeWidth={0} />
      </button>
      <button
        onClick={() => {
          if (!hasTrack) return;
          cycleRepeatMode();
        }}
        className={cn("transition-colors", hasTrack ? (repeatMode !== 'none' ? "text-[#ff3b30]" : "text-white/90 hover:text-white") : "text-white/15 cursor-default")}
      >
        <Repeat size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
