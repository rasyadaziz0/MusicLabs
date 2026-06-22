'use client';

import { createContext, useContext, useEffect, useRef, useReducer, useCallback } from 'react';
import { Song } from '@/types/music';
import { RadioMeta } from '@/lib/player/engines/RadioEngine';
import { PlayerController, PlayerState, INITIAL_STATE } from '@/lib/player/PlayerController';
import { useAuth } from './AuthContext';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePresenceBroadcast } from '@/hooks/usePresenceBroadcast';

// ─── Context type (unchanged — no consumer changes needed) ───

interface PlayerContextType {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean;
  isGuestPreview: boolean;
  isRadio: boolean;
  radioMeta: RadioMeta | null;
  isError: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  isAutoplayEnabled: boolean;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  playTrack: (track: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Song) => void;
  playNext: (track: Song) => void;
  removeFromQueue: (trackId: string) => void;
  promoteToManual: (trackId: string) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  shufflePlay: (tracks: Song[]) => void;
  sleepTimerEndTime: number | null;
  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;
  toggleAutoplay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ─── Provider ───

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useReducer(
    (prev: PlayerState, next: Partial<PlayerState>) => ({ ...prev, ...next }),
    INITIAL_STATE
  );

  const controllerRef = useRef<PlayerController | null>(null);

  // ── Create controller once ──
  useEffect(() => {
    const ctrl = new PlayerController({
      onStateChange: (patch) => setState(patch),
    });
    controllerRef.current = ctrl;

    return () => {
      ctrl.destroy();
      controllerRef.current = null;
    };
  }, []);

  // ── Sync user ID into controller ──
  useEffect(() => {
    controllerRef.current?.setUserId(user?.id ?? null);
  }, [user]);

  // ── Sync isPlaying into controller (needed for togglePlay) ──
  useEffect(() => {
    controllerRef.current?.syncIsPlaying(state.isPlaying);
  }, [state.isPlaying]);

  // ── Broadcast "Now Playing" presence to Supabase ──
  usePresenceBroadcast(state.currentTrack, state.isPlaying);

  // ── Stable callbacks (delegate to controller) ──

  const playTrack = useCallback((track: Song, queue?: Song[]) => {
    controllerRef.current?.playTrack(track, queue);
  }, []);

  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay();
  }, []);

  const nextTrack = useCallback(() => {
    controllerRef.current?.nextTrack();
  }, []);

  const prevTrack = useCallback(() => {
    controllerRef.current?.prevTrack();
  }, []);

  const seek = useCallback((time: number) => {
    controllerRef.current?.seek(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    controllerRef.current?.setVolume(v);
  }, []);

  const addToQueue = useCallback((track: Song) => {
    controllerRef.current?.addToQueue(track);
  }, []);

  const playNext = useCallback((track: Song) => {
    controllerRef.current?.playNext(track);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    controllerRef.current?.removeFromQueue(trackId);
  }, []);

  const promoteToManual = useCallback((trackId: string) => {
    controllerRef.current?.promoteToManual(trackId);
  }, []);

  const clearQueue = useCallback(() => {
    controllerRef.current?.clearQueue();
  }, []);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    controllerRef.current?.reorderQueue(startIndex, endIndex);
  }, []);


  const shufflePlay = useCallback((tracks: Song[]) => {
    controllerRef.current?.shufflePlay(tracks);
  }, []);

  const toggleShuffle = useCallback(() => {
    controllerRef.current?.toggleShuffle();
  }, []);

  const cycleRepeatMode = useCallback(() => {
    controllerRef.current?.cycleRepeatMode();
  }, []);

  const setSleepTimer = useCallback((minutes: number) => {
    controllerRef.current?.setSleepTimer(minutes);
  }, []);

  const clearSleepTimer = useCallback(() => {
    controllerRef.current?.clearSleepTimer();
  }, []);

  const toggleAutoplay = useCallback(() => {
    controllerRef.current?.toggleAutoplay();
  }, []);

  // ── Media Session (React hook — stays in context) ──
  useMediaSession({
    currentTrack: state.currentTrack,
    togglePlay,
    nextTrack,
    prevTrack,
  });

  // ── Provide ──

  return (
    <PlayerContext.Provider value={{
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      isResolving: state.isResolving,
      isPreview: state.isPreview,
      isGuestPreview: state.isGuestPreview,
      isRadio: state.isRadio,
      radioMeta: state.radioMeta,
      isError: state.isError,
      currentTime: state.currentTime,
      duration: state.duration,
      volume: state.volume,
      queue: state.queue,
      queueIndex: state.queueIndex,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
      isAutoplayEnabled: state.isAutoplayEnabled,
      toggleAutoplay,
      toggleShuffle,
      cycleRepeatMode,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      addToQueue,
      playNext,
      removeFromQueue,
      promoteToManual,
      clearQueue,
      reorderQueue,
      shufflePlay,
      sleepTimerEndTime: state.sleepTimerEndTime,
      setSleepTimer,
      clearSleepTimer,
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
