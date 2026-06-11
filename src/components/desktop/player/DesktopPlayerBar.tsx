'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import DesktopPlaybackControls from './DesktopPlaybackControls';
import DesktopTrackInfo from './DesktopTrackInfo';
import DesktopExtraControls from './DesktopExtraControls';
import { GlassBar } from '@/components/ui/LiquidGlass';

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
      style={{ marginRight: isLyricsOpen || isQueueOpen ? '340px' : '0' }}
    >
      <GlassBar className="h-[60px] rounded-full">
        <div className="flex items-center w-full h-full px-6">

        <DesktopPlaybackControls
          hasTrack={hasTrack}
          isPlaying={isPlaying}
          isResolving={isResolving}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          togglePlay={togglePlay}
          nextTrack={nextTrack}
          prevTrack={prevTrack}
          toggleShuffle={toggleShuffle}
          cycleRepeatMode={cycleRepeatMode}
        />

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

        <DesktopTrackInfo
          currentTrack={currentTrack}
          hasTrack={hasTrack}
          isRadio={isRadio}
          radioMeta={radioMeta}
          isResolving={isResolving}
          currentTime={currentTime}
          duration={duration}
          seek={seek}
          setIsNowPlayingOpen={setIsNowPlayingOpen}
        />

        <DesktopExtraControls
          currentTrack={currentTrack}
          hasTrack={hasTrack}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          isVolumeSliderOpen={isVolumeSliderOpen}
          setIsVolumeSliderOpen={setIsVolumeSliderOpen}
          isQueueOpen={isQueueOpen}
          setIsQueueOpen={setIsQueueOpen}
          isLyricsOpen={isLyricsOpen}
          setIsLyricsOpen={setIsLyricsOpen}
        />

        </div>
      </GlassBar>
    </div>
  );
}
