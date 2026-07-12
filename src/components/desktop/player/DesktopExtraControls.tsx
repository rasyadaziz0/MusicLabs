import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, MessageSquare, ListMusic, MonitorSpeaker } from 'lucide-react';
import QueuePopup from '@/components/player/QueuePopup';
import { usePlayer } from '@/context/PlayerContext';

export interface DesktopExtraControlsProps {
  currentTrack: any;
  hasTrack: boolean;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  isVolumeSliderOpen: boolean;
  setIsVolumeSliderOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
}

export default function DesktopExtraControls({
  currentTrack, hasTrack, volume, setVolume, isMuted,
  isVolumeSliderOpen, setIsVolumeSliderOpen,
  isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen,
  isDevicesOpen, setIsDevicesOpen
}: DesktopExtraControlsProps) {
  const { connectedDevices, isActivePlayer } = (usePlayer() as any);

  return (
    <div className="flex items-center gap-[18px] md:max-xl:gap-[10px] flex-shrink-0">
      {/* Icons container that fades out when volume slider opens */}
      <div className={cn(
        "flex items-center gap-[18px] md:max-xl:gap-[10px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:portrait:hidden",
        isVolumeSliderOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
      )}>
        <button
          onClick={() => {
            if (!hasTrack) return;
            setIsLyricsOpen(!isLyricsOpen);
            if (!isLyricsOpen) {
              setIsQueueOpen(false);
              setIsDevicesOpen?.(false);
            }
          }}
          className={cn(
            "transition-colors cursor-pointer",
            hasTrack ? (isLyricsOpen ? "text-[#ff3b30]" : "text-white/70 hover:text-white") : "text-white/20 pointer-events-none"
          )}
          title="Lirik"
        >
          <MessageSquare size={18} strokeWidth={2.5} />
        </button>
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => {
              if (!hasTrack) return;
              setIsQueueOpen(!isQueueOpen);
              if (!isQueueOpen) {
                setIsLyricsOpen(false);
                setIsDevicesOpen?.(false);
              }
            }}
            className={cn(
              "transition-colors cursor-pointer",
              hasTrack ? (isQueueOpen ? "text-[#ff3b30]" : "text-white/70 hover:text-white") : "text-white/20 pointer-events-none"
            )}
            title="Daftar putar"
          >
            <ListMusic size={18} strokeWidth={2.5} />
          </button>
          <QueuePopup isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
        </div>

        {/* Device Picker Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => {
              setIsDevicesOpen?.(!isDevicesOpen);
              if (!isDevicesOpen) {
                setIsLyricsOpen(false);
                setIsQueueOpen(false);
              }
            }}
            className={cn(
              "relative transition-colors cursor-pointer",
              isDevicesOpen ? "text-[#ff3b30]" : !isActivePlayer ? "text-[#1db954]" : "text-white/70 hover:text-white"
            )}
            title="Hubungkan ke perangkat lain"
          >
            <MonitorSpeaker size={18} strokeWidth={2.5} />
            {connectedDevices?.length > 1 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#1db954] ring-2 ring-[#121216] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Volume */}
      <div 
        className="relative flex items-center justify-end h-[32px] w-[18px]"
        onMouseLeave={() => setIsVolumeSliderOpen(false)}
      >
        <div 
          className={cn(
            "absolute right-0 flex items-center h-[32px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20",
            isVolumeSliderOpen ? "w-[120px]" : "w-[18px]"
          )}
        >
          {/* Slider Area */}
          <div 
            className="flex items-center justify-end overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: isVolumeSliderOpen ? '102px' : '0px' }}
          >
            <div 
              className={cn(
                "w-[102px] pr-3 transition-opacity duration-200",
                isVolumeSliderOpen ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="w-full h-[4px] bg-white/20 rounded-full relative flex items-center group/vol">
                <input type="range" aria-label="Volume" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:scale-y-150 transition-transform" />
                <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none group-hover/vol:bg-white" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Icon */}
          <button 
            onClick={() => setIsVolumeSliderOpen(true)}
            className={cn(
              "transition-colors flex-shrink-0 flex items-center justify-center w-[18px] h-full cursor-pointer",
              isVolumeSliderOpen ? "text-white" : "text-white/70 hover:text-white"
            )}
            title="Volume"
          >
            {isMuted || volume === 0 ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
