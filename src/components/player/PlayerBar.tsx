'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime, cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Mic2, 
  ListMusic, 
  Maximize2,
  Loader2 
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import NowPlaying from './NowPlaying';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';

export default function PlayerBar() {
  const { 
    currentTrack, 
    isPlaying, 
    isResolving,
    isPreview,
    togglePlay, 
    nextTrack, 
    prevTrack, 
    currentTime, 
    duration, 
    seek, 
    volume, 
    setVolume 
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  if (!currentTrack) return null;

  return (
    <>
      <NowPlaying 
        isOpen={isNowPlayingOpen} 
        onClose={() => setIsNowPlayingOpen(false)} 
      />
      {!isNowPlayingOpen && (
        <div 
          className="md:hidden fixed bottom-[104px] left-4 right-4 h-[60px] bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-3 gap-3 z-40 cursor-pointer"
          onClick={() => setIsNowPlayingOpen(true)}
        >
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
            {getBestImageUrl(currentTrack.image) ? (
              <Image
                src={getBestImageUrl(currentTrack.image)!}
                alt={currentTrack.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
            <p className="text-[9px] text-white/60 font-medium uppercase tracking-wider mb-0.5">
              iPhone → System Capture
            </p>
            <p className="text-[15px] font-bold truncate text-white leading-tight">
              {currentTrack.name}
            </p>
          </div>
          <div className="flex items-center gap-4 pl-2 text-white pr-2">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={isResolving}
              className="hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isResolving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              className="hover:scale-105 transition-transform"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Player Bar */}
      <div
        className={cn(
          "hidden md:flex h-24 glass border-t border-white/5 px-4 items-center justify-between gap-4 relative z-50",
          isNowPlayingOpen && "md:hidden"
        )}
      >
        {/* Track Info */}
        <div 
          className="flex items-center gap-3 w-1/4 min-w-[200px] cursor-pointer group"
          onClick={() => setIsNowPlayingOpen(true)}
        >
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            {getBestImageUrl(currentTrack.image) ? (
              <Image
                src={getBestImageUrl(currentTrack.image)!}
                alt={currentTrack.name}
                fill
                sizes="56px"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 size={16} />
            </div>
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate hover:underline flex items-center gap-2">
              {currentTrack.name}
              {isPreview && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/10 text-muted uppercase tracking-wider border border-white/5 flex-shrink-0">
                  Preview 30s
                </span>
              )}
            </h4>
            <p className="text-xs text-muted truncate hover:underline">
              {currentTrack.artists.primary.map(a => a.name).join(', ')}
            </p>
          </div>
          <div
            className="hidden items-center gap-2 xl:flex"
            onClick={(event) => event.stopPropagation()}
          >
            <TrackLikeButton track={currentTrack} />
            <AddToPlaylistButton track={currentTrack} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[600px]">
          <div className="flex items-center gap-6">
            <button className="text-muted hover:text-white transition-colors">
              <Shuffle size={18} />
            </button>
            <button 
              onClick={prevTrack}
              className="text-white hover:scale-110 transition-transform"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              disabled={isResolving}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50"
            >
              {isResolving ? (
                <Loader2 size={20} className="animate-spin text-black" />
              ) : isPlaying ? (
                <Pause size={20} fill="black" />
              ) : (
                <Play size={20} fill="black" className="ml-1" />
              )}
            </button>
            <button 
              onClick={nextTrack}
              className="text-white hover:scale-110 transition-transform"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button className="text-muted hover:text-white transition-colors">
              <Repeat size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] text-muted w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute h-full bg-primary rounded-full group-hover:bg-primary/80 transition-colors"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              <div 
                className="absolute w-3 h-3 bg-white rounded-full -top-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <span className="text-[10px] text-muted w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
          <button 
            onClick={() => setIsNowPlayingOpen(true)}
            className="text-muted hover:text-white transition-colors"
          >
            <Mic2 size={18} />
          </button>
          <button className="text-muted hover:text-white transition-colors">
            <ListMusic size={18} />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <button onClick={toggleMute} className="text-muted hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full relative">
               <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
          <button 
            onClick={() => setIsNowPlayingOpen(true)}
            className="text-muted hover:text-white transition-colors"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
