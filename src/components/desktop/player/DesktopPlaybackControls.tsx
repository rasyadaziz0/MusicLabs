import React from 'react';
import { StyleHelper } from '@/lib/utils/StyleHelper';
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Loader2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { DesktopPlaybackControlsProps } from '@/types/components/desktop/player/DesktopPlaybackControlsProps';
export default function DesktopPlaybackControls({
  hasTrack, isPlaying, isResolving, isShuffled, repeatMode,
  togglePlay, nextTrack, prevTrack, toggleShuffle, cycleRepeatMode
}: DesktopPlaybackControlsProps) {
  const { isAutoplayEnabled, toggleAutoplay } = usePlayer();

  return (
    <div className="flex items-center gap-[8px] md:max-xl:gap-[4px] flex-shrink-0">
      <button
        onClick={() => hasTrack && toggleShuffle()}
        aria-label="Toggle shuffle"
        className={StyleHelper.cn("transition-colors", hasTrack ? (isShuffled ? "text-[#ff3b30]" : "text-white/90 hover:text-white") : "text-white/15 cursor-default")}
      >
        <Shuffle size={18} strokeWidth={2.5} />
      </button>
      <button onClick={hasTrack ? prevTrack : undefined} aria-label="Previous track" className={StyleHelper.cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
        <SkipBack size={24} fill="currentColor" strokeWidth={0} />
      </button>
      <button
        onClick={hasTrack ? togglePlay : undefined}
        disabled={!hasTrack || isResolving ? true : undefined}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={StyleHelper.cn(
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
      <button onClick={hasTrack ? nextTrack : undefined} aria-label="Next track" className={StyleHelper.cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
        <SkipForward size={24} fill="currentColor" strokeWidth={0} />
      </button>
      <button
        onClick={() => {
          if (!hasTrack) return;
          cycleRepeatMode();
        }}
        aria-label="Toggle repeat"
        className={StyleHelper.cn("transition-colors", hasTrack ? (repeatMode !== 'none' ? "text-[#ff3b30]" : "text-white/90 hover:text-white") : "text-white/15 cursor-default")}
      >
        <Repeat size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
