'use client';

import { cn } from '@/lib/utils';
import {
  Play, Pause, SkipForward, SkipBack, Repeat, Shuffle,
  Volume2, VolumeX, MessageSquare, ListMusic, MoreHorizontal,
  Loader2, Radio as RadioIcon
} from 'lucide-react';
import Image from 'next/image';
import { getBestImageUrl } from '@/lib/api/musicApi';
import QueuePopup from '@/components/player/QueuePopup';

export interface DesktopPlayerBarProps {
  currentTrack: any;
  isPlaying: boolean;
  isResolving: boolean;
  isGuestPreview: boolean;
  isRadio: boolean;
  radioMeta: any;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  currentTime: number;
  duration: number;
  seek: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  isVolumeSliderOpen: boolean;
  setIsVolumeSliderOpen: (open: boolean) => void;
  setIsGuestGateOpen: (open: boolean) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  repeatMode: 'none' | 'all' | 'one';
  cycleRepeatMode: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
}

export default function DesktopPlayerBar({
  currentTrack, isPlaying, isResolving, isGuestPreview, isRadio, radioMeta,
  togglePlay, nextTrack, prevTrack, currentTime, duration, seek,
  volume, setVolume, isMuted, isVolumeSliderOpen, setIsVolumeSliderOpen,
  setIsGuestGateOpen, isNowPlayingOpen, setIsNowPlayingOpen,
  isShuffled, toggleShuffle, repeatMode, cycleRepeatMode,
  isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen
}: DesktopPlayerBarProps) {
  const hasTrack = !!currentTrack;

  return (
    <div
      className={cn(
        "hidden md:flex relative z-50 transition-all duration-300",
        isNowPlayingOpen && "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center h-[60px] bg-white/[0.08] backdrop-blur-[40px] backdrop-saturate-[200%] border border-white/10 rounded-full px-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">

        {/* LEFT — Playback Controls */}
        <div className="flex items-center gap-[18px]">
          <button
            onClick={() => hasTrack && toggleShuffle()}
            className={cn("transition-colors", hasTrack ? (isShuffled ? "text-[#ff3b30]" : "text-white/60 hover:text-white") : "text-white/15 cursor-default")}
          >
            <Shuffle size={18} strokeWidth={2.5} />
          </button>
          <button onClick={hasTrack ? prevTrack : undefined} className={cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
            <SkipBack size={22} fill="currentColor" strokeWidth={0} />
          </button>
          <button onClick={hasTrack ? togglePlay : undefined} disabled={hasTrack ? isResolving : true} className={cn("transition-colors disabled:opacity-50", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
            {isResolving ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={28} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={28} fill="currentColor" strokeWidth={0} className="ml-1" />
            )}
          </button>
          <button onClick={hasTrack ? nextTrack : undefined} className={cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 cursor-default")}>
            <SkipForward size={22} fill="currentColor" strokeWidth={0} />
          </button>
          <button
            onClick={() => {
              if (!hasTrack) return;
              cycleRepeatMode();
            }}
            className={cn("transition-colors", hasTrack ? (repeatMode !== 'none' ? "text-[#ff3b30]" : "text-white/60 hover:text-white") : "text-white/15 cursor-default")}
          >
            <Repeat size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Guest Preview CTA */}
        {isGuestPreview && hasTrack && (
          <div className="flex items-center mx-4">
            <button
              onClick={() => setIsGuestGateOpen(true)}
              className="px-2.5 py-1 rounded-md bg-[#FA243C]/10 text-[#FA243C] text-[10px] font-bold uppercase tracking-wider hover:bg-[#FA243C]/20 transition-colors"
            >
              Preview
            </button>
          </div>
        )}

        {/* CENTER — Track Info */}
        <div className="flex flex-col mx-8 w-[340px] justify-center cursor-pointer group" onClick={() => !isRadio && setIsNowPlayingOpen(true)}>
          {hasTrack ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="relative w-[34px] h-[34px] rounded-[4px] overflow-hidden flex-shrink-0 shadow-sm border border-white/5">
                  {isRadio ? (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#FA243C]/10 flex items-center justify-center">
                      <RadioIcon size={16} className="text-[#FA243C]" />
                    </div>
                  ) : getBestImageUrl(currentTrack.image) ? (
                    <Image src={getBestImageUrl(currentTrack.image)!} alt={currentTrack.name} fill sizes="34px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  {isRadio ? (
                    <>
                      <span className="text-[13px] font-bold text-white truncate leading-tight">
                        {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                          ? radioMeta.title
                          : currentTrack.name}
                      </span>
                      <span className="text-[11px] text-[#FA243C]/70 truncate leading-[14px] flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FA243C]" /></span>
                        {radioMeta?.station || currentTrack.name} • Live
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-bold text-white truncate leading-tight">
                        {currentTrack.name}
                      </span>
                      <span className="text-[11px] text-white/70 truncate leading-[14px]">
                        {currentTrack.artists?.primary?.map((a: any) => a.name).join(', ')} {currentTrack.album?.name ? `— ${currentTrack.album.name}` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Progress Bar — hidden for radio (infinite stream) */}
              {!isRadio ? (
                <div className="w-full h-[2px] bg-white/[0.15] relative mt-[2px] group/progress rounded-full">
                  <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(e) => seek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:h-3 hover:-top-[5px]" />
                  <div className="absolute h-full bg-white rounded-full transition-colors group-hover/progress:bg-white" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                </div>
              ) : (
                <div className="w-full h-[2px] bg-[#FA243C]/20 mt-[2px] rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-[#FA243C]/40 rounded-full animate-pulse" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-[2px] bg-white/[0.1] mt-8 rounded-full" />
          )}
        </div>

        {/* RIGHT — Extra Controls */}
        <div className="flex items-center gap-[18px]">
          <button className={cn("transition-colors", hasTrack ? "text-white hover:text-white/80" : "text-white/15 pointer-events-none")}>
            <MoreHorizontal size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => {
              if (!hasTrack) return;
              setIsLyricsOpen(!isLyricsOpen);
              if (!isLyricsOpen) setIsQueueOpen(false);
            }}
            className={cn("transition-colors", hasTrack ? (isLyricsOpen ? "text-[#ff3b30]" : "text-white hover:text-white/80") : "text-white/15 pointer-events-none")}
          >
            <MessageSquare size={18} strokeWidth={2.5} />
          </button>
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => {
                if (!hasTrack) return;
                setIsQueueOpen(!isQueueOpen);
                if (!isQueueOpen) setIsLyricsOpen(false);
              }}
              className={cn("transition-colors", hasTrack ? (isQueueOpen ? "text-[#ff3b30]" : "text-white hover:text-white/80") : "text-white/15 pointer-events-none")}
            >
              <ListMusic size={18} strokeWidth={2.5} />
            </button>
            <QueuePopup isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            {isVolumeSliderOpen && (
              <div className="w-[60px] h-[3px] bg-white/[0.15] rounded-full relative animate-in fade-in slide-in-from-right-2">
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:h-4 hover:-top-1.5" />
                <div className="absolute h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
              </div>
            )}
            <button onClick={() => setIsVolumeSliderOpen(!isVolumeSliderOpen)} className={cn("transition-colors flex-shrink-0", isVolumeSliderOpen ? "text-white" : "text-white/60 hover:text-white")}>
              {isMuted || volume === 0 ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
