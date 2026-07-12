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
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
}

export default function DesktopPlayerBar({
  currentTrack, isPlaying, isResolving, isGuestPreview, isRadio, radioMeta,
  togglePlay, nextTrack, prevTrack, currentTime, duration, seek,
  volume, setVolume, isMuted, isVolumeSliderOpen, setIsVolumeSliderOpen,
  setIsGuestGateOpen, isNowPlayingOpen, setIsNowPlayingOpen,
  isShuffled, toggleShuffle, repeatMode, cycleRepeatMode,
  isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen,
  isDevicesOpen, setIsDevicesOpen
}: DesktopPlayerBarProps) {
  const hasTrack = !!currentTrack;

  const isRightDrawerOpen = isLyricsOpen || isQueueOpen || isDevicesOpen;

  return (
    <div
      className={cn(
        "hidden md:flex fixed bottom-6 left-[288px] md:portrait:left-[212px] z-50 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none justify-center",
        isRightDrawerOpen ? "right-[340px] md:max-xl:right-[260px] md:portrait:right-[212px]" : "right-0",
        isNowPlayingOpen && "opacity-0 pointer-events-none"
      )}
    >
      <div className="pointer-events-auto w-max max-w-full md:max-xl:w-full md:max-xl:max-w-[620px] md:portrait:max-w-[520px] px-4 md:portrait:px-2 flex justify-center">
        <GlassBar className="h-[60px] md:max-xl:h-[56px] rounded-full w-full transition-all duration-300">
          <div className="flex items-center justify-between w-full h-full px-6 md:max-xl:px-4 md:portrait:px-2">

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
            isVolumeSliderOpen={isVolumeSliderOpen}
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
            isDevicesOpen={isDevicesOpen}
            setIsDevicesOpen={setIsDevicesOpen}
          />

          </div>
        </GlassBar>
      </div>
    </div>
  );
}
