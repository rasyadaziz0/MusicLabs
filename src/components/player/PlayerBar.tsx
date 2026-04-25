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
  Maximize2 
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import NowPlaying from './NowPlaying';

export default function PlayerBar() {
  const { 
    currentTrack, 
    isPlaying, 
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
      <div className="h-24 glass border-t border-white/5 px-4 flex items-center justify-between gap-4">
        {/* Track Info */}
        <div 
          className="flex items-center gap-4 w-1/4 min-w-[200px] cursor-pointer group"
          onClick={() => setIsNowPlayingOpen(true)}
        >
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <Image
              src={getBestImageUrl(currentTrack.image)}
              alt={currentTrack.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 size={16} />
            </div>
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate hover:underline">
              {currentTrack.name}
            </h4>
            <p className="text-xs text-muted truncate hover:underline">
              {currentTrack.artists.primary.map(a => a.name).join(', ')}
            </p>
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
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
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
