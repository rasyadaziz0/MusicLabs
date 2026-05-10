'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { resolveToYoutubeId } from '@/lib/youtube';
import { useAuth } from './AuthContext';
import { recordRecentPlay } from '@/lib/supabase/music';

interface RadioMeta {
  title: string;   // e.g. "Artist - Song Title"
  station: string; // Station name
}

interface PlayerContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean; // True if playing Deezer 30s preview
  isGuestPreview: boolean; // True if preview because user is not logged in
  isRadio: boolean; // True if currently playing a radio stream
  radioMeta: RadioMeta | null; // Live "now playing" metadata from radio
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  playTrack: (track: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Song) => void;
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
  const [isGuestPreview, setIsGuestPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isRadio, setIsRadio] = useState(false);
  const [radioMeta, setRadioMeta] = useState<RadioMeta | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const nextTrackRef = useRef<() => void>(() => { });
  const repeatModeRef = useRef(repeatMode);
  const isShuffledRef = useRef(isShuffled);
  const lastRecordedTrackRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);

  const toggleShuffle = useCallback(() => setIsShuffled(prev => !prev), []);
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  }, []);

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
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const radioMetaIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedYTRef = useRef(false);
  const currentTrackRef = useRef<Song | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const fallbackAttemptedTrackRef = useRef<string | null>(null);

  // Mobile detection — route playback through HTML5 Audio instead of YT IFrame
  const isMobileRef = useRef(false);
  useEffect(() => {
    isMobileRef.current = typeof window !== 'undefined' && (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
    );
  }, []);

  // Active audio engine tracking: determines which engine togglePlay/seek/timer uses
  const activeEngineRef = useRef<'youtube' | 'html5' | 'radio' | 'none'>('none');

  const getFallbackCacheKey = useCallback((trackId: string) => `fallback_yt_${trackId}`, []);

  const abortPendingResolve = useCallback(() => {
    if (resolveAbortRef.current) {
      resolveAbortRef.current.abort();
      resolveAbortRef.current = null;
    }
  }, []);

  /** Stop any active radio stream playback & metadata polling */
  const stopRadio = useCallback(() => {
    if (radioAudioRef.current) {
      radioAudioRef.current.onplay = null;
      radioAudioRef.current.onpause = null;
      radioAudioRef.current.onerror = null;
      radioAudioRef.current.pause();
      radioAudioRef.current.removeAttribute('src');
      radioAudioRef.current.load();
      radioAudioRef.current = null;
    }
    if (radioMetaIntervalRef.current) {
      clearInterval(radioMetaIntervalRef.current);
      radioMetaIntervalRef.current = null;
    }
    setIsRadio(false);
    setRadioMeta(null);
  }, []);

  const playPreviewFallback = useCallback((track?: Song) => {
    const fallbackTrack = track ?? currentTrackRef.current;
    if (!fallbackTrack?.preview || !previewAudioRef.current) return;

    setIsPreview(true);
    setIsResolving(false);
    activeEngineRef.current = 'html5';
    stopRadio();

    // Stop YouTube
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      ytPlayerRef.current.stopVideo();
    }

    const audio = previewAudioRef.current;
    audio.src = fallbackTrack.preview;
    audio.play().catch(console.error);
  }, [stopRadio]);

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
              if (event.data === 0) {
                // Song ended — handle repeat-one by replaying
                if (repeatModeRef.current === 'one' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                  ytPlayerRef.current.seekTo(0, true);
                  ytPlayerRef.current.playVideo();
                } else {
                  nextTrackRef.current(); // Auto-next (shuffle/repeat-all handled in nextTrack)
                }
              }
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
        const audioDuration = previewAudioRef.current.duration;
        if (audioDuration && isFinite(audioDuration)) {
          setDuration(audioDuration);
        }
      }
    }, 50);

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

  /** Start playing a radio stream using plain HTML5 Audio + Icecast metadata polling */
  const playRadioStream = useCallback((track: Song) => {
    const streamUrl = track.radioStreamUrl;
    if (!streamUrl) return;

    // Stop other engines
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      ytPlayerRef.current.stopVideo();
    }
    stopRadio();

    setIsRadio(true);
    activeEngineRef.current = 'radio';
    setIsPreview(false);
    setIsGuestPreview(false);
    setIsResolving(false);
    setRadioMeta({
      title: 'Connecting...',
      station: track.name,
    });

    // Create a fresh audio element for this radio stream
    const audio = new Audio();
    audio.volume = volume;
    audio.src = streamUrl;
    radioAudioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = (e) => {
      console.error('Radio stream error:', streamUrl);
      if (audio.error) {
        console.error('Error code:', audio.error.code, 'Message:', audio.error.message);
      }

      // If the resolved URL failed and we have an alternate URL (homepage or raw url), 
      // sometimes trying that might work if it redirects to a valid stream
      if (streamUrl !== track.url && track.url) {
        console.log('Trying fallback URL:', track.url);
        audio.src = track.url;
        audio.play().catch(console.error);
      }
    };

    audio.play().catch(console.error);

    // Attempt to poll Icecast metadata via our API proxy
    const pollMetadata = async () => {
      try {
        const res = await fetch(`/api/radio/metadata?url=${encodeURIComponent(streamUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title && currentTrackRef.current?.id === track.id) {
            setRadioMeta({
              title: data.title,
              station: track.name,
            });
          }
        }
      } catch {
        // Silently fail — metadata is best-effort
      }
    };

    // Poll immediately then every 15s
    pollMetadata();
    radioMetaIntervalRef.current = setInterval(pollMetadata, 15000);
  }, [volume, stopRadio]);

  const playTrack = useCallback(async (track: Song, newQueue?: Song[]) => {
    abortPendingResolve();

    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex((s) => s.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    }

    setCurrentTrack(track);
    currentTrackRef.current = track;
    setIsPreview(false);
    setIsGuestPreview(false);
    setCurrentTime(0);
    fallbackAttemptedTrackRef.current = null;

    // ─── Radio stream ───
    if (track.isRadio && track.radioStreamUrl) {
      playRadioStream(track);
      return;
    }

    // Stop radio if switching away
    stopRadio();

    // Guest mode: skip YouTube, force 30s Deezer preview
    if (!user) {
      setIsResolving(false);
      setIsGuestPreview(true);
      playPreviewFallback(track);
      return;
    }

    setIsResolving(true);

    // Stop existing engines
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
    }

    // ─── Mobile: use HTML5 Audio with direct stream ───
    // YouTube IFrame embed is unreliable on mobile (error 101/150 blocks).
    // HTML5 Audio also enables background playback via Media Session API.
    if (isMobileRef.current) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        ytPlayerRef.current.stopVideo();
      }

      try {
        const artistName = track.artists.primary[0]?.name || '';
        const cachedFallback = localStorage.getItem(getFallbackCacheKey(track.id));

        let videoId: string | null = cachedFallback;
        if (!videoId) {
          const controller = new AbortController();
          resolveAbortRef.current = controller;
          videoId = await resolveToYoutubeId(track.name, artistName, track.id, {
            signal: controller.signal,
          });
        }

        if (currentTrackRef.current?.id !== track.id) return;

        if (videoId && previewAudioRef.current) {
          // Fetch direct audio URL from our proxy API
          const audioRes = await fetch(`/api/audio/${videoId}`);
          if (!audioRes.ok) throw new Error(`Audio stream API returned ${audioRes.status}`);
          const audioData = await audioRes.json();
          if (!audioData.url) throw new Error('No audio URL in response');

          if (currentTrackRef.current?.id !== track.id) return;

          activeEngineRef.current = 'html5';
          setIsPreview(false);
          previewAudioRef.current.src = audioData.url;
          previewAudioRef.current.play().catch(console.error);
          setIsResolving(false);
        } else {
          console.warn('Mobile: no video ID resolved, falling back to preview');
          playPreviewFallback(track);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Mobile playback failed:', err);
        playPreviewFallback(track);
      } finally {
        if (resolveAbortRef.current?.signal.aborted || currentTrackRef.current?.id === track.id) {
          resolveAbortRef.current = null;
        }
      }
      return;
    }

    // ─── Desktop: YouTube IFrame embed ───
    try {
      const artistName = track.artists.primary[0]?.name || '';
      const cachedFallback = localStorage.getItem(getFallbackCacheKey(track.id));
      if (cachedFallback && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        activeEngineRef.current = 'youtube';
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
        activeEngineRef.current = 'youtube';
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
  }, [user, abortPendingResolve, getFallbackCacheKey, playPreviewFallback, playRadioStream, stopRadio]);

  const togglePlay = useCallback(() => {
    const engine = activeEngineRef.current;
    if (engine === 'radio' && radioAudioRef.current) {
      if (isPlaying) radioAudioRef.current.pause();
      else radioAudioRef.current.play().catch(console.error);
    } else if (engine === 'html5' && previewAudioRef.current) {
      if (isPlaying) previewAudioRef.current.pause();
      else previewAudioRef.current.play().catch(console.error);
    } else if (engine === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) ytPlayerRef.current.pauseVideo();
      else ytPlayerRef.current.playVideo();
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    abortPendingResolve();
    if (queue.length === 0 || queueIndex === -1) return;

    // Repeat one: replay current track
    if (repeatModeRef.current === 'one') {
      const engine = activeEngineRef.current;
      if (engine === 'html5' && previewAudioRef.current) {
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.play().catch(console.error);
      }
      // YT repeat-one is handled in onStateChange
      return;
    }

    let nextIdx: number;
    if (isShuffledRef.current) {
      // Pick a random index that isn't the current one
      if (queue.length <= 1) {
        nextIdx = 0;
      } else {
        do {
          nextIdx = Math.floor(Math.random() * queue.length);
        } while (nextIdx === queueIndex);
      }
    } else {
      nextIdx = queueIndex + 1;
    }

    if (nextIdx >= queue.length) {
      if (repeatModeRef.current === 'all') {
        // Loop back to start
        nextIdx = 0;
      } else {
        // Stop playback
        setIsPlaying(false);
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
          ytPlayerRef.current.stopVideo();
        }
        return;
      }
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
    const engine = activeEngineRef.current;
    if (engine === 'radio') return;
    if (engine === 'html5' && previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
    } else if (engine === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(time, true);
    }
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (previewAudioRef.current) previewAudioRef.current.volume = v;
    if (radioAudioRef.current) radioAudioRef.current.volume = v;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(v * 100);
    }
  }, []);

  const addToQueue = useCallback((track: Song) => {
    setQueue(prev => {
      // Don't add duplicate adjacent tracks, but allow duplicates generally
      if (prev.length > 0 && prev[prev.length - 1].id === track.id) return prev;
      return [...prev, track];
    });
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
      isGuestPreview,
      isRadio,
      radioMeta,
      currentTime,
      duration,
      volume,
      queue,
      queueIndex,
      isShuffled,
      repeatMode,
      toggleShuffle,
      cycleRepeatMode,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      addToQueue
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
