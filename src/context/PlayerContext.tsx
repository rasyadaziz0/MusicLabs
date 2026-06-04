'use client';

import { createContext, useContext, useEffect, useRef, useReducer, useCallback } from 'react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { resolveToYoutubeId } from '@/lib/youtube';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { recordRecentPlay } from '@/lib/supabase/music';

import { YouTubeEngine } from '@/lib/player/engines/YouTubeEngine';
import { Html5Engine } from '@/lib/player/engines/Html5Engine';
import { RadioEngine, RadioMeta } from '@/lib/player/engines/RadioEngine';
import { QueueManager } from '@/lib/player/QueueManager';
import { AudioRouter } from '@/lib/player/AudioRouter';
import { registerTimeGetter } from '@/hooks/useHighPrecisionTime';

interface PlayerContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean;
  isGuestPreview: boolean;
  isRadio: boolean;
  radioMeta: RadioMeta | null;
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
  shufflePlay: (tracks: Song[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

type PlayerState = {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean;
  isGuestPreview: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isRadio: boolean;
  radioMeta: RadioMeta | null;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
};

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  isResolving: false,
  isPreview: false,
  isGuestPreview: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  queueIndex: -1,
  isRadio: false,
  radioMeta: null,
  isShuffled: false,
  repeatMode: 'none',
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useReducer(
    (prev: PlayerState, next: Partial<PlayerState>) => ({ ...prev, ...next }),
    initialState
  );

  const {
    currentTrack, isPlaying, isResolving, isPreview, isGuestPreview,
    currentTime, duration, volume, queue, queueIndex,
    isRadio, radioMeta, isShuffled, repeatMode
  } = state;

  const refs = useRef({
    nextTrack: () => {},
    repeatMode: state.repeatMode,
    isShuffled: state.isShuffled,
    lastRecordedTrack: null as string | null,
    user: user,
    currentTrack: null as Song | null,
    resolveAbort: null as AbortController | null,
    fallbackAttemptedTrack: null as string | null,
    timer: null as NodeJS.Timeout | null,
    router: null as AudioRouter | null,
    queueMgr: null as QueueManager | null,
    isMobile: false,
  });

  useEffect(() => {
    refs.current.isMobile = typeof window !== 'undefined' && (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
    );
  }, []);

  useEffect(() => { refs.current.repeatMode = repeatMode; }, [repeatMode]);
  useEffect(() => { refs.current.isShuffled = isShuffled; }, [isShuffled]);
  useEffect(() => { refs.current.user = user; }, [user]);

  useEffect(() => {
    if (user && currentTrack && refs.current.lastRecordedTrack !== currentTrack.id) {
      refs.current.lastRecordedTrack = currentTrack.id;
      recordRecentPlay(user.id, currentTrack.id).catch(console.error);
    }
  }, [user, currentTrack]);

  const getFallbackCacheKey = useCallback((trackId: string) => `fallback_yt_${trackId}`, []);

  const abortPendingResolve = useCallback(() => {
    if (refs.current.resolveAbort) {
      refs.current.resolveAbort.abort();
      refs.current.resolveAbort = null;
    }
  }, []);

  const stopRadio = useCallback(() => {
    refs.current.router?.radio.stop();
    setState({ isRadio: false, radioMeta: null });
  }, []);

  const playPreviewFallback = useCallback(async (track?: Song) => {
    const router = refs.current.router;
    if (!router) return;
    const fallbackTrack = track ?? refs.current.currentTrack;
    if (!fallbackTrack) return;

    let previewUrl = fallbackTrack.preview;

    // If there's no preview URL cached on the track, fetch one from iTunes
    if (!previewUrl) {
      try {
        const artistName = fallbackTrack.artists.primary[0]?.name || '';
        const res = await fetch(
          `/api/preview?title=${encodeURIComponent(fallbackTrack.name)}&artist=${encodeURIComponent(artistName)}`
        );
        if (res.ok) {
          const data = await res.json();
          previewUrl = data.previewUrl || null;
        }
      } catch (err) {
        console.error('Failed to fetch preview URL:', err);
      }
    }

    if (!previewUrl) {
      console.warn('No preview URL available for', fallbackTrack.name);
      setState({ isResolving: false });
      return;
    }

    // Cache it on the track so subsequent plays don't re-fetch
    fallbackTrack.preview = previewUrl;

    // Verify the track is still the active one after the async fetch
    if (refs.current.currentTrack && refs.current.currentTrack.id !== fallbackTrack.id) return;

    setState({ isPreview: true, isResolving: false });
    router.setActive('html5');
    stopRadio();

    router.youtube.stop();
    router.html5.playSrc(previewUrl);
  }, [stopRadio]);

  useEffect(() => {
    const ytEngine = new YouTubeEngine({
      onPlay: () => setState({ isPlaying: true }),
      onPause: () => setState({ isPlaying: false }),
      onDuration: (d) => setState({ duration: d }),
      onEnded: () => {
        if (refs.current.repeatMode === 'one') {
          ytEngine.seekTo(0, true);
          ytEngine.play();
        } else {
          refs.current.nextTrack();
        }
      },
      onError: (blockedEmbedCode) => {
        const activeTrack = refs.current.currentTrack;

        if (
          activeTrack &&
          (blockedEmbedCode === 101 || blockedEmbedCode === 150) &&
          refs.current.fallbackAttemptedTrack !== activeTrack.id
        ) {
          refs.current.fallbackAttemptedTrack = activeTrack.id;
          setState({ isResolving: true });
          void (async () => {
            abortPendingResolve();
            const controller = new AbortController();
            refs.current.resolveAbort = controller;

            try {
              const artistName = activeTrack.artists.primary[0]?.name || '';
              const { data: { session } } = await supabase.auth.getSession();
              const headers: Record<string, string> = {};
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }

              const response = await fetch(
                `/api/audio/resolve?title=${encodeURIComponent(activeTrack.name)}&artist=${encodeURIComponent(artistName)}&trackId=${encodeURIComponent(activeTrack.id)}&fallback=1`,
                { signal: controller.signal, headers }
              );

              if (!response.ok) {
                throw new Error(`Fallback resolve failed with status ${response.status}`);
              }

              const data = await response.json();
              const fallbackVideoId = data?.videoId as string | undefined;

              if (!fallbackVideoId || refs.current.currentTrack?.id !== activeTrack.id) {
                return;
              }

              localStorage.setItem(getFallbackCacheKey(activeTrack.id), fallbackVideoId);
              ytEngine.loadVideo(fallbackVideoId);
              setState({ isResolving: false });
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') return;
              console.error('Fallback resolve on embed block failed:', error);
              playPreviewFallback(activeTrack);
            } finally {
              if (refs.current.resolveAbort === controller) {
                refs.current.resolveAbort = null;
              }
            }
          })();
          return;
        }

        console.error('Player Error. Falling back to preview.', blockedEmbedCode);
        playPreviewFallback(activeTrack ?? undefined);
      },
    });

    const html5Engine = new Html5Engine({
      onPlay: () => setState({ isPlaying: true }),
      onPause: () => setState({ isPlaying: false }),
      onEnded: () => refs.current.nextTrack(),
    });

    const radioEngine = new RadioEngine({
      onPlay: () => setState({ isPlaying: true }),
      onPause: () => setState({ isPlaying: false }),
      onMetaUpdate: (meta) => setState({ radioMeta: meta }),
      onError: (msg) => {
        setState({
          isPlaying: false,
          radioMeta: { title: msg, station: refs.current.currentTrack?.name || 'Error' }
        });
      },
    });

    const router = new AudioRouter(ytEngine, html5Engine, radioEngine);
    refs.current.router = router;

    ytEngine.initialize();
    html5Engine.initialize(1);

    // Register high-precision time getter for karaoke rendering (~60fps rAF)
    registerTimeGetter(() => {
      const engine = router.activeEngine;
      if (engine === 'html5') return html5Engine.getCurrentTime();
      if (engine === 'youtube') return ytEngine.getCurrentTime();
      return 0;
    });

    refs.current.timer = setInterval(() => {
      const progress = router.pollProgress();
      const nextState: Partial<PlayerState> = {};
      if (progress.currentTime !== undefined) nextState.currentTime = progress.currentTime;
      if (progress.duration !== undefined) nextState.duration = progress.duration;
      if (Object.keys(nextState).length > 0) setState(nextState);
    }, 50);

    return () => {
      if (refs.current.timer) clearInterval(refs.current.timer);
      abortPendingResolve();
      router.destroy();
      refs.current.router = null;
    };
  }, [abortPendingResolve, getFallbackCacheKey, playPreviewFallback]);

  useEffect(() => {
    refs.current.queueMgr = new QueueManager({
      onStateChange: (queueState) => {
        setState({
          queue: queueState.queue,
          queueIndex: queueState.queueIndex,
          isShuffled: queueState.isShuffled,
          repeatMode: queueState.repeatMode,
        });
      },
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    refs.current.queueMgr?.toggleShuffle();
  }, []);

  const cycleRepeatMode = useCallback(() => {
    refs.current.queueMgr?.cycleRepeatMode();
  }, []);

  const playRadioStream = useCallback((track: Song) => {
    const router = refs.current.router;
    if (!router || !track.radioStreamUrl) return;

    router.html5.stop();
    router.youtube.stop();
    stopRadio();

    setState({ isRadio: true, isPreview: false, isGuestPreview: false, isResolving: false });
    router.setActive('radio');

    router.radio.play(
      track,
      state.volume,
      () => refs.current.currentTrack?.id ?? null,
    );
  }, [state.volume, stopRadio]);

  const playTrack = useCallback(async (track: Song, newQueue?: Song[]) => {
    const router = refs.current.router;
    if (!router) return;

    abortPendingResolve();

    if (newQueue) {
      refs.current.queueMgr?.setQueue(newQueue, track.id);
    }

    setState({
      currentTrack: track,
      isPreview: false,
      isGuestPreview: false,
      currentTime: 0,
    });
    refs.current.currentTrack = track;
    refs.current.fallbackAttemptedTrack = null;

    if (track.isRadio && track.radioStreamUrl) {
      playRadioStream(track);
      return;
    }

    stopRadio();

    if (!refs.current.user) {
      setState({ isResolving: true, isGuestPreview: true });
      playPreviewFallback(track);
      return;
    }

    setState({ isResolving: true });

    router.html5.stop();

    if (refs.current.isMobile) {
      router.youtube.stop();

      try {
        const artistName = track.artists.primary[0]?.name || '';
        const cachedFallback = localStorage.getItem(getFallbackCacheKey(track.id));

        let videoId: string | null = cachedFallback;
        if (!videoId) {
          const controller = new AbortController();
          refs.current.resolveAbort = controller;
          videoId = await resolveToYoutubeId(track.name, artistName, track.id, {
            signal: controller.signal,
          });
        }

        if (refs.current.currentTrack?.id !== track.id) return;

        if (videoId) {
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const audioRes = await fetch(`/api/audio/${videoId}`, { headers });
          if (!audioRes.ok) throw new Error(`Audio stream API returned ${audioRes.status}`);
          const audioData = await audioRes.json();
          if (!audioData.url) throw new Error('No audio URL in response');

          if (refs.current.currentTrack?.id !== track.id) return;

          router.setActive('html5');
          setState({ isPreview: false, isResolving: false });
          router.html5.playSrc(audioData.url);
        } else {
          console.warn('Mobile: no video ID resolved, falling back to preview');
          playPreviewFallback(track);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Mobile HTML5 playback failed, falling back to YouTube IFrame:', err);

        try {
          const artistName = track.artists.primary[0]?.name || '';
          let fallbackVideoId: string | null = localStorage.getItem(getFallbackCacheKey(track.id));

          if (!fallbackVideoId) {
            const controller = new AbortController();
            refs.current.resolveAbort = controller;
            fallbackVideoId = await resolveToYoutubeId(track.name, artistName, track.id, {
              signal: controller.signal,
            });
          }

          if (refs.current.currentTrack?.id !== track.id) return;

          if (fallbackVideoId && router.youtube.isReady()) {
            router.setActive('youtube');
            router.youtube.loadVideo(fallbackVideoId);
            setState({ isResolving: false });
          } else {
            playPreviewFallback(track);
          }
        } catch (fallbackErr) {
          if (fallbackErr instanceof DOMException && fallbackErr.name === 'AbortError') return;
          console.error('Mobile IFrame fallback failed:', fallbackErr);
          playPreviewFallback(track);
        }
      } finally {
        if (refs.current.resolveAbort?.signal.aborted || refs.current.currentTrack?.id === track.id) {
          refs.current.resolveAbort = null;
        }
      }
      return;
    }

    try {
      const artistName = track.artists.primary[0]?.name || '';
      const cachedFallback = localStorage.getItem(getFallbackCacheKey(track.id));
      if (cachedFallback && router.youtube.isReady()) {
        router.setActive('youtube');
        router.youtube.loadVideo(cachedFallback);
        setState({ isResolving: false });
        return;
      }

      const controller = new AbortController();
      refs.current.resolveAbort = controller;
      const videoId = await resolveToYoutubeId(track.name, artistName, track.id, {
        signal: controller.signal,
      });

      if (refs.current.currentTrack?.id !== track.id) {
        return;
      }

      if (videoId && router.youtube.isReady()) {
        router.setActive('youtube');
        router.youtube.loadVideo(videoId);
        setState({ isResolving: false });
      } else if (videoId) {
        console.warn('YT IFrame not ready, trying HTML5 Audio stream for desktop');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const audioRes = await fetch(`/api/audio/${videoId}`, { headers });
          if (!audioRes.ok) throw new Error(`Audio stream API returned ${audioRes.status}`);
          const audioData = await audioRes.json();
          if (!audioData.url) throw new Error('No audio URL in response');

          if (refs.current.currentTrack?.id !== track.id) return;

          router.setActive('html5');
          setState({ isPreview: false, isResolving: false });
          router.html5.playSrc(audioData.url);
        } catch (html5Err) {
          console.error('Desktop HTML5 fallback also failed:', html5Err);
          playPreviewFallback(track);
        }
      } else {
        console.warn('No video ID resolved for playback');
        playPreviewFallback(track);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Playback setup failed:', err);
      playPreviewFallback(track);
    } finally {
      if (refs.current.resolveAbort?.signal.aborted || refs.current.currentTrack?.id === track.id) {
        refs.current.resolveAbort = null;
      }
    }
  }, [abortPendingResolve, getFallbackCacheKey, playPreviewFallback, playRadioStream, stopRadio]);

  const shufflePlay = useCallback((tracks: Song[]) => {
    if (tracks.length === 0) return;
    const queueMgr = refs.current.queueMgr;
    if (!queueMgr) return;
    const firstTrack = queueMgr.shuffleAndPlay(tracks);
    if (firstTrack) {
      playTrack(firstTrack);
    }
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    refs.current.router?.togglePlay(isPlaying);
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    abortPendingResolve();
    const queueMgr = refs.current.queueMgr;
    const router = refs.current.router;
    if (!queueMgr || !router) return;
    if (queueMgr.queue.length === 0 || queueMgr.queueIndex === -1) return;

    if (refs.current.repeatMode === 'one') {
      const engine = router.activeEngine;
      if (engine === 'html5') {
        router.html5.seekTo(0);
        router.html5.resume();
      }
      return;
    }

    const nextIdx = queueMgr.getNextIndex();

    if (nextIdx === null) {
      setState({ isPlaying: false });
      router.html5.pause();
      router.youtube.stop();
      return;
    }

    queueMgr.setIndex(nextIdx);
    playTrack(queueMgr.queue[nextIdx]);
  }, [abortPendingResolve, playTrack]);

  useEffect(() => {
    refs.current.nextTrack = nextTrack;
  }, [nextTrack]);

  const prevTrack = useCallback(() => {
    abortPendingResolve();
    const queueMgr = refs.current.queueMgr;
    if (!queueMgr) return;
    if (queueMgr.queue.length === 0 || queueMgr.queueIndex === -1) return;

    const prevIdx = queueMgr.getPrevIndex();
    queueMgr.setIndex(prevIdx);
    playTrack(queueMgr.queue[prevIdx]);
  }, [abortPendingResolve, playTrack]);

  const seek = useCallback((time: number) => {
    refs.current.router?.seek(time);
    setState({ currentTime: time });
  }, []);

  const setVolume = useCallback((v: number) => {
    setState({ volume: v });
    refs.current.router?.setVolume(v);
  }, []);

  const addToQueue = useCallback((track: Song) => {
    refs.current.queueMgr?.addToQueue(track);
  }, []);

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
      addToQueue,
      shufflePlay
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
