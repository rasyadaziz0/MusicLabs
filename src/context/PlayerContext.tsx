'use client';

import { createContext, useContext, useEffect, useRef, useReducer, useCallback, useState } from 'react';
import { Song } from '@/types/music';
import { RadioMeta } from '@/lib/player/engines/RadioEngine';
import { PlayerController, PlayerState, INITIAL_STATE } from '@/lib/player/PlayerController';
import { useAuth } from './AuthContext';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePresenceBroadcast } from '@/hooks/usePresenceBroadcast';
import { useSpotifyConnect } from '@/hooks/useSpotifyConnect';
import { DeviceInfo, RemoteCommandType, HandoffPayload } from '@/types/connect';

// ─── Context type ───

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

  // ── Spotify Connect fields ──
  myTabId: string;
  activeTabId: string | null;
  isActivePlayer: boolean;
  connectedDevices: DeviceInfo[];
  autoplayBlocked: boolean;
  isElecting: boolean;
  transferPlayback: (targetTabInstanceId: string) => void;
  renameDevice: (newName: string) => void;
  dismissAutoplayBlock: () => void;
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

  // ── Connect Handlers ──

  const handleReceiveHandoff = useCallback(async (payload: HandoffPayload) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    await ctrl.playTrack(payload.track, payload.queue);
    ctrl.seek(payload.position);
    if (!payload.isPlaying && state.isPlaying) {
      ctrl.togglePlay();
    }
  }, [state.isPlaying]);

  const handleReceiveCommand = useCallback((cmd: RemoteCommandType, payload?: { time?: number; volume?: number }) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    if (cmd === 'TOGGLE_PLAY') ctrl.togglePlay();
    else if (cmd === 'NEXT') ctrl.nextTrack();
    else if (cmd === 'PREV') ctrl.prevTrack();
    else if (cmd === 'SEEK' && payload?.time !== undefined) ctrl.seek(payload.time);
    else if (cmd === 'SET_VOLUME' && payload?.volume !== undefined) ctrl.setVolume(payload.volume);
  }, []);

  const handleActivePlayerPause = useCallback(() => {
    controllerRef.current?.togglePlay();
  }, []);

  // ── Connect Hook ──
  const connect = useSpotifyConnect({
    getCurrentTrack: () => state.currentTrack,
    getCurrentTime: () => state.currentTime,
    getDuration: () => state.duration,
    getIsPlaying: () => state.isPlaying,
    getVolume: () => state.volume,
    getQueue: () => state.queue,
    getQueueIndex: () => state.queueIndex,
    getIsShuffled: () => state.isShuffled,
    getRepeatMode: () => state.repeatMode,
    onReceiveHandoff: handleReceiveHandoff,
    onReceiveCommand: handleReceiveCommand,
    onActivePlayerPause: handleActivePlayerPause,
  });

  const isRemote = !connect.isActivePlayer && connect.activeTabId !== null && connect.remoteState !== null;

  // Broadcast state changes when active player
  const prevTrackIdRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean>(false);
  const prevQueueLenRef = useRef<number>(0);

  useEffect(() => {
    if (!connect.isActivePlayer) return;
    if (state.currentTrack?.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = state.currentTrack?.id ?? null;
      connect.broadcastSync('track_change');
    } else if (state.isPlaying !== prevIsPlayingRef.current) {
      prevIsPlayingRef.current = state.isPlaying;
      connect.broadcastSync(state.isPlaying ? 'play' : 'pause');
    } else if (state.queue.length !== prevQueueLenRef.current) {
      prevQueueLenRef.current = state.queue.length;
      connect.broadcastSync('queue_change');
    }
  }, [state.currentTrack?.id, state.isPlaying, state.queue.length, connect]);

  // Smooth scrubber extrapolation for remote tabs
  const [remoteScrubberTime, setRemoteScrubberTime] = useState(0);
  useEffect(() => {
    if (!isRemote || !connect.remoteState?.isPlaying) return;
    const update = () => {
      const now = Date.now();
      const elapsed = (now - connect.remoteState!.timestamp) / 1000;
      setRemoteScrubberTime(connect.remoteState!.position + elapsed);
    };
    update();
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, [isRemote, connect.remoteState]);

  // ── Branched State Getters ──
  const effectiveCurrentTrack = isRemote ? connect.remoteState!.track : state.currentTrack;
  const effectiveIsPlaying = isRemote ? connect.remoteState!.isPlaying : state.isPlaying;
  const effectiveCurrentTime = isRemote ? (connect.remoteState!.isPlaying ? remoteScrubberTime : connect.remoteState!.position) : state.currentTime;
  const effectiveDuration = isRemote ? connect.remoteState!.duration : state.duration;
  const effectiveVolume = isRemote ? connect.remoteState!.volume : state.volume;
  const effectiveQueue = isRemote ? connect.remoteState!.queue : state.queue;
  const effectiveQueueIndex = isRemote ? connect.remoteState!.queueIndex : state.queueIndex;
  const effectiveIsShuffled = isRemote ? connect.remoteState!.isShuffled : state.isShuffled;
  const effectiveRepeatMode = isRemote ? connect.remoteState!.repeatMode : state.repeatMode;

  // ── Stable callbacks (branched execution) ──

  const playTrack = useCallback((track: Song, queue?: Song[]) => {
    if (isRemote && connect.activeTabId) {
      connect.transferPlayback(connect.myTabId); // claim back or play locally
    }
    controllerRef.current?.playTrack(track, queue);
  }, [isRemote, connect]);

  const togglePlay = useCallback(() => {
    if (isRemote) connect.sendRemoteCommand('TOGGLE_PLAY');
    else controllerRef.current?.togglePlay();
  }, [isRemote, connect]);

  const nextTrack = useCallback(() => {
    if (isRemote) connect.sendRemoteCommand('NEXT');
    else controllerRef.current?.nextTrack();
  }, [isRemote, connect]);

  const prevTrack = useCallback(() => {
    if (isRemote) connect.sendRemoteCommand('PREV');
    else controllerRef.current?.prevTrack();
  }, [isRemote, connect]);

  const seek = useCallback((time: number) => {
    if (isRemote) connect.sendRemoteCommand('SEEK', { time });
    else {
      controllerRef.current?.seek(time);
      connect.broadcastSync('seek');
    }
  }, [isRemote, connect]);

  const setVolume = useCallback((v: number) => {
    if (isRemote) connect.sendRemoteCommand('SET_VOLUME', { volume: v });
    else {
      controllerRef.current?.setVolume(v);
      connect.broadcastSync('volume_change');
    }
  }, [isRemote, connect]);

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

  // ── Media Session ──
  useMediaSession({
    currentTrack: effectiveCurrentTrack,
    togglePlay,
    nextTrack,
    prevTrack,
  });

  return (
    <PlayerContext.Provider value={{
      currentTrack: effectiveCurrentTrack,
      isPlaying: effectiveIsPlaying,
      isResolving: state.isResolving,
      isPreview: state.isPreview,
      isGuestPreview: state.isGuestPreview,
      isRadio: state.isRadio,
      radioMeta: state.radioMeta,
      isError: state.isError,
      currentTime: effectiveCurrentTime,
      duration: effectiveDuration,
      volume: effectiveVolume,
      queue: effectiveQueue,
      queueIndex: effectiveQueueIndex,
      isShuffled: effectiveIsShuffled,
      repeatMode: effectiveRepeatMode,
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
      // Connect exports
      myTabId: connect.myTabId,
      activeTabId: connect.activeTabId,
      isActivePlayer: connect.isActivePlayer,
      connectedDevices: connect.connectedDevices,
      autoplayBlocked: connect.autoplayBlocked,
      isElecting: connect.isElecting,
      transferPlayback: connect.transferPlayback,
      renameDevice: connect.renameDevice,
      dismissAutoplayBlock: connect.dismissAutoplayBlock,
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
