'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Pause, SkipForward, SkipBack, Volume2, Volume1, MessageSquareQuote, ListMusic, Headphones } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { MobileAirPlayPopup } from '@/components/mobile/player/MobileAirPlayPopup';
import { usePlayer } from '@/context/PlayerContext';
import { IMobilePlayerControlsProps } from './MobilePlayerControls.types';
import { MobilePlayerControlsController } from './MobilePlayerControlsController';

export function MobilePlayerControls(props: IMobilePlayerControlsProps) {
  const {
    duration, currentTime, seek, prevTrack, nextTrack, togglePlay,
    isResolving, isPlaying, volume, setVolume, isLyricsOpen, setIsLyricsOpen, linesLength,
    isShuffled, repeatMode, toggleShuffle, cycleRepeatMode, isQueueOpen, setIsQueueOpen,
    isDevicesOpen, setIsDevicesOpen, activeDevice, connectedDevices, isActivePlayer
  } = props;

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [localQueueOpen, setLocalQueueOpen] = useState(false);
  const playerContext = usePlayer();
  const controller = useMemo(() => new MobilePlayerControlsController(props, playerContext), [props, playerContext]);
  const effectiveQueueOpen = isQueueOpen !== undefined ? isQueueOpen : localQueueOpen;
  const effectiveSetQueueOpen = setIsQueueOpen || setLocalQueueOpen;
  const displayTime = isSeeking ? seekTime : currentTime;
  const progressPercent = controller.getProgressPercent(displayTime);
  const remainingTime = controller.getRemainingTime(displayTime);
  const myDevice = controller.myDevice;

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekTime(currentTime);
  };

  const handleSeekMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekTime(Number(e.target.value));
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const val = Number((e.target as HTMLInputElement).value);
    seek(val);
    setIsSeeking(false);
  };

  return (
    <div className="w-full flex flex-col justify-end am-player-controls pt-2 pb-6 px-7">
      {/* 1. Progress Bar & Lossless Badge */}
      <div className="w-full flex flex-col mb-6">
        <div className="relative w-full h-7 flex items-center group">
          <div className="absolute left-0 right-0 h-1 rounded-full bg-white/20 overflow-hidden pointer-events-none">
            <motion.div
              className="h-full bg-white/90 rounded-full"
              style={{ width: `${progressPercent}%` }}
              transition={isSeeking ? { duration: 0 } : { duration: 0.1, ease: 'linear' }}
            />
          </div>

          <motion.div
            className="absolute h-3 w-3 rounded-full bg-white shadow-md pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
            animate={{ scale: isSeeking ? 1.5 : 1 }}
            transition={{ duration: 0.1 }}
          />

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={displayTime}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekMove}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>

        <div className="flex items-center justify-between mt-[-4px] text-[12px] font-semibold tracking-tight text-white/55 relative">
          <span className="w-12 text-left font-mono">{formatTime(displayTime)}</span>

          {/* Lossless Badge (Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm text-white/90">
            <span className="text-[10px] tracking-wider uppercase font-bold">~ Lossless</span>
          </div>

          <span className="w-12 text-right font-mono">
            {remainingTime < 0 ? '-' : ''}{formatTime(Math.abs(remainingTime))}
          </span>
        </div>
      </div>

      {/* 2. Playback Controls (Huge Centered Apple Music iOS style) */}
      <div className="w-full flex items-center justify-between px-6 mb-8 mt-1">
        <button
          onClick={prevTrack}
          className="text-white active:scale-85 transition-transform p-3 active:opacity-70"
          title="Sebelumnya"
        >
          <SkipBack size={38} fill="currentColor" strokeWidth={0} />
        </button>

        <button
          onClick={togglePlay}
          disabled={isResolving}
          className="w-20 h-20 flex items-center justify-center text-white active:scale-90 transition-transform active:opacity-80"
          title={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isResolving ? (
            <Loader2 size={46} className="animate-spin text-white/80" />
          ) : isPlaying ? (
            <Pause size={56} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={56} fill="currentColor" strokeWidth={0} className="ml-1" />
          )}
        </button>

        <button
          onClick={nextTrack}
          className="text-white active:scale-85 transition-transform p-3 active:opacity-70"
          title="Selanjutnya"
        >
          <SkipForward size={38} fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      {/* 3. Volume Bar */}
      <div className="w-full flex items-center gap-3.5 px-1 mb-8">
        <Volume1 size={18} className="text-white/40 flex-shrink-0" />
        <div className="relative flex-1 h-6 flex items-center">
          <div className="absolute left-0 right-0 h-1 rounded-full bg-white/20 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-white/80 rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>
        <Volume2 size={18} className="text-white/40 flex-shrink-0" />
      </div>

      {/* 4. Bottom Actions (Exact Apple Music iOS Style) */}
      <div className="w-full flex items-center justify-between px-6 pt-2 pb-1">
        {/* Lyrics Toggle Button */}
        <button
          onClick={() => {
            if (linesLength > 0) {
              setIsLyricsOpen(!isLyricsOpen);
              if (!isLyricsOpen) {
                effectiveSetQueueOpen(false);
                setIsDevicesOpen?.(false);
              }
            }
          }}
          disabled={linesLength === 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 outline-none ${isLyricsOpen
            ? 'bg-white/30 backdrop-blur-md text-[#18261e] shadow-md font-bold'
            : 'text-white/60 hover:text-white hover:bg-white/10'
            } ${linesLength === 0 ? 'opacity-30 pointer-events-none' : ''}`}
          title="Lirik"
        >
          <MessageSquareQuote size={21} strokeWidth={isLyricsOpen ? 2.3 : 1.9} />
        </button>

        {/* Center: AirPlay Route Apple Music Style */}
        <button
          onClick={() => {
            setIsDevicesOpen?.(!isDevicesOpen);
            if (!isDevicesOpen) {
              effectiveSetQueueOpen(false);
            }
          }}
          className="flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all outline-none px-4 py-1 rounded-xl hover:bg-white/5"
          title="Perangkat audio"
        >
          <div className={`flex items-center justify-center transition-all ${isDevicesOpen ? 'text-[#1db954] scale-110' : 'text-white/90 group-hover:text-white'
            }`}>
            <Headphones size={20} strokeWidth={2} />
          </div>
        </button>

        {/* Queue Toggle Button */}
        <button
          onClick={() => {
            effectiveSetQueueOpen(!effectiveQueueOpen);
            if (!effectiveQueueOpen) {
              setIsLyricsOpen(false);
              setIsDevicesOpen?.(false);
            }
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 outline-none ${effectiveQueueOpen
            ? 'bg-white/30 backdrop-blur-md text-[#18261e] shadow-md font-bold'
            : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          title="Daftar putar"
        >
          <ListMusic size={21} strokeWidth={effectiveQueueOpen ? 2.3 : 1.9} />
        </button>

        {/* AirPlay Devices Popup */}
        {isDevicesOpen && (
          <div
            onClick={() => setIsDevicesOpen?.(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px]">
              <MobileAirPlayPopup onClose={() => setIsDevicesOpen?.(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
