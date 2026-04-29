'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { resolveToYoutubeId } from '@/lib/youtube';
import { useAuth } from './AuthContext';
import { recordRecentPlay } from '@/lib/supabase/music';

interface PlayerContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean; // True if playing Deezer 30s preview
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

type YouTubePlayerEvent = {
  data: number;
};

type YouTubePlayer = {
  getDuration: () => number;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  loadVideoById: (videoId: string) => void;
  stopVideo: () => void;
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player?: new (
        elementId: string,
        options: {
          height: string;
          width: string;
          videoId: string;
          playerVars: Record<string, number>;
          events: {
            onStateChange: (event: YouTubePlayerEvent) => void;
            onError: (event: YouTubePlayerEvent) => void;
          };
        }
      ) => YouTubePlayer;
    };
  }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const nextTrackRef = useRef<() => void>(() => { });
  const lastRecordedTrackRef = useRef<string | null>(null);

  // Record playback history
  useEffect(() => {
    if (user && currentTrack && lastRecordedTrackRef.current !== currentTrack.id) {
      lastRecordedTrackRef.current = currentTrack.id;
      recordRecentPlay(user.id, currentTrack.id).catch(console.error);
    }
  }, [user, currentTrack]);

  // Engines
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedYTRef = useRef(false);
  const currentTrackRef = useRef<Song | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const fallbackAttemptedTrackRef = useRef<string | null>(null);

  const getFallbackCacheKey = useCallback((trackId: string) => `fallback_yt_${trackId}`, []);

  const abortPendingResolve = useCallback(() => {
    if (resolveAbortRef.current) {
      resolveAbortRef.current.abort();
      resolveAbortRef.current = null;
    }
  }, []);

  const playPreviewFallback = useCallback((track?: Song) => {
    const fallbackTrack = track ?? currentTrackRef.current;
    if (!fallbackTrack?.preview || !previewAudioRef.current) return;

    setIsPreview(true);
    setIsResolving(false);

    // Stop YouTube
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      ytPlayerRef.current.stopVideo();
    }

    const audio = previewAudioRef.current;
    audio.src = fallbackTrack.preview;
    audio.play().catch(console.error);
  }, []);

  // Initialize YouTube API
  useEffect(() => {
    let prevReady: (() => void) | undefined;

    const initializeYTPlayer = () => {
      if (hasInitializedYTRef.current || ytPlayerRef.current || !window.YT?.Player) return;
      hasInitializedYTRef.current = true;
      ytPlayerRef.current = new window.YT.Player('youtube-player-container', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: YouTubePlayerEvent) => {
            // YT.PlayerState.PLAYING = 1
            if (event.data === 1) {
              setIsPlaying(true);
              if (ytPlayerRef.current) {
                setDuration(ytPlayerRef.current.getDuration());
              }
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
              if (event.data === 0) nextTrackRef.current(); // Auto-next
            }
          },
          onError: (event: YouTubePlayerEvent) => {
            const blockedEmbedCode = event?.data;
            const activeTrack = currentTrackRef.current;

            if (
              activeTrack &&
              (blockedEmbedCode === 101 || blockedEmbedCode === 150) &&
              fallbackAttemptedTrackRef.current !== activeTrack.id
            ) {
              fallbackAttemptedTrackRef.current = activeTrack.id;
              setIsResolving(true);
              void (async () => {
                abortPendingResolve();
                const controller = new AbortController();
                resolveAbortRef.current = controller;

                try {
                  const artistName = activeTrack.artists.primary[0]?.name || '';
                  const response = await fetch(
                    `/api/audio/resolve?title=${encodeURIComponent(activeTrack.name)}&artist=${encodeURIComponent(artistName)}&trackId=${encodeURIComponent(activeTrack.id)}&fallback=1`,
                    { signal: controller.signal }
                  );

                  if (!response.ok) {
                    throw new Error(`Fallback resolve failed with status ${response.status}`);
                  }

                  const data = await response.json();
                  const fallbackVideoId = data?.videoId as string | undefined;

                  if (!fallbackVideoId || currentTrackRef.current?.id !== activeTrack.id) {
                    return;
                  }

                  localStorage.setItem(getFallbackCacheKey(activeTrack.id), fallbackVideoId);
                  if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
                    ytPlayerRef.current.loadVideoById(fallbackVideoId);
                  }
                  setIsResolving(false);
                } catch (error) {
                  if (error instanceof DOMException && error.name === 'AbortError') return;
                  console.error('Fallback resolve on embed block failed:', error);
                  playPreviewFallback(activeTrack);
                } finally {
                  if (resolveAbortRef.current === controller) {
                    resolveAbortRef.current = null;
                  }
                }
              })();
              return;
            }

            console.error('Player Error. Falling back to preview.', blockedEmbedCode);
            playPreviewFallback(activeTrack ?? undefined);
          }
        },
      });
    };

    if (window.YT?.Player) {
      initializeYTPlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') prevReady();
        initializeYTPlayer();
      };
    };

    previewAudioRef.current = new Audio();
    previewAudioRef.current.volume = volume;

    const audio = previewAudioRef.current;
    const handleEnded = () => nextTrackRef.current();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Progress Timer
    timerRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) { // Playing
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
        }
      }
      if (previewAudioRef.current && !previewAudioRef.current.paused) {
        setCurrentTime(previewAudioRef.current.currentTime);
        setDuration(previewAudioRef.current.duration || 30);
      }
    }, 150);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
      abortPendingResolve();

      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
      }
      ytPlayerRef.current = null;
      hasInitializedYTRef.current = false;

      if (window.onYouTubeIframeAPIReady && prevReady) {
        window.onYouTubeIframeAPIReady = prevReady;
      }
    };
  }, [abortPendingResolve, getFallbackCacheKey, playPreviewFallback]);

  const playTrack = useCallback(async (track: Song, newQueue?: Song[]) => {
    abortPendingResolve();

    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex((s) => s.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    }

    setCurrentTrack(track);
    currentTrackRef.current = track;
    setIsResolving(true);
    setIsPreview(false);
    setCurrentTime(0);
    fallbackAttemptedTrackRef.current = null;

    // Stop existing engines
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
    }

    try {
      const artistName = track.artists.primary[0]?.name || '';
      const cachedFallback = localStorage.getItem(getFallbackCacheKey(track.id));
      if (cachedFallback && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(cachedFallback);
        setIsResolving(false);
        return;
      }

      const controller = new AbortController();
      resolveAbortRef.current = controller;
      const videoId = await resolveToYoutubeId(track.name, artistName, track.id, {
        signal: controller.signal,
      });

      if (currentTrackRef.current?.id !== track.id) {
        return;
      }

      if (videoId && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(videoId);
        setIsResolving(false);
      } else {
        console.warn('Cloud Music sedang eror');
        playPreviewFallback(track);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Playback setup failed:', err);
      playPreviewFallback(track);
    } finally {
      if (resolveAbortRef.current?.signal.aborted || currentTrackRef.current?.id === track.id) {
        resolveAbortRef.current = null;
      }
    }
  }, [abortPendingResolve, getFallbackCacheKey, playPreviewFallback]);

  const togglePlay = useCallback(() => {
    if (isPreview && previewAudioRef.current) {
      if (isPlaying) previewAudioRef.current.pause();
      else previewAudioRef.current.play();
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) ytPlayerRef.current.pauseVideo();
      else ytPlayerRef.current.playVideo();
    }
  }, [isPlaying, isPreview]);

  const nextTrack = useCallback(() => {
    abortPendingResolve();
    if (queue.length === 0 || queueIndex === -1) return;
    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      setIsPlaying(false);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        ytPlayerRef.current.stopVideo();
      }
      return;
    }
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx]);
  }, [abortPendingResolve, queue, queueIndex, playTrack]);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const prevTrack = useCallback(() => {
    abortPendingResolve();
    if (queue.length === 0 || queueIndex === -1) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx]);
  }, [abortPendingResolve, queue, queueIndex, playTrack]);

  const seek = useCallback((time: number) => {
    if (isPreview && previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(time, true);
    }
    setCurrentTime(time);
  }, [isPreview]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (previewAudioRef.current) previewAudioRef.current.volume = v;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(v * 100);
    }
  }, []);

  // Sync Media Session
  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artists.primary.map(a => a.name).join(', '),
        album: currentTrack.album.name,
        artwork: [{ src: getBestImageUrl(currentTrack.image) ?? '', sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    }
  }, [currentTrack, togglePlay, nextTrack, prevTrack]);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      isResolving,
      isPreview,
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
  if (!context) throw new Error('Player must be used within a PlayerProvider');
  return context;
};
