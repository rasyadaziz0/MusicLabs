'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Song } from '@/types/music';
import { getBestAudioUrl, getBestImageUrl } from '@/lib/api/musicApi';

interface PlayerContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  playTrack: (track: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startPlayback = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      // Prevent browser-level unhandled promise rejections when source is unsupported.
      setIsPlaying(false);
      console.error('Audio playback failed:', error);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => nextTrack();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artists.primary.map(a => a.name).join(', '),
        album: currentTrack.album.name,
        artwork: [
          { src: getBestImageUrl(currentTrack.image), sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [currentTrack]);

  const playTrack = (track: Song, newQueue?: Song[]) => {
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(s => s.id === track.id);
      setQueueIndex(index);
    } else if (queue.length === 0) {
      setQueue([track]);
      setQueueIndex(0);
    }

    setCurrentTrack(track);
    if (audioRef.current) {
      const url = getBestAudioUrl(track);
      if (!url) {
        setIsPlaying(false);
        console.error('No playable audio URL found for track:', track.id);
        return;
      }
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load(); // Paksa browser baca ulang sumber audio baru
      void startPlayback();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void startPlayback();
    }
  };

  const nextTrack = () => {
    if (queue.length === 0 || queueIndex === -1) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (queue.length === 0 || queueIndex === -1) return;
    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIndex);
    playTrack(queue[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (v: number) => {
    if (audioRef.current) {
      audioRef.current.volume = v;
      setVolumeState(v);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      queue,
      queueIndex,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      setVolume
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
