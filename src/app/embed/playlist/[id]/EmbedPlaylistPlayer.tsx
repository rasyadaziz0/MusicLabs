'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EmbedPlaylistPlayerController, EmbedPlaylistPlayerState } from './EmbedPlaylistPlayerController';
import { EmbedPlaylistTrack } from '../../_components/types';
import { EmbedPlaylistPlayerUI } from './EmbedPlaylistPlayerUI';

interface EmbedPlaylistPlayerProps {
  playlistId: string;
  playlistName: string;
  coverUrl: string;
  tracks: EmbedPlaylistTrack[];
  isLoggedIn?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmbedPlaylistPlayer({
  playlistId,
  playlistName,
  coverUrl,
  tracks,
  isLoggedIn = false,
}: EmbedPlaylistPlayerProps) {
  const [state, setState] = useState<EmbedPlaylistPlayerState>({
    currentIndex: 0,
    isPlaying: false,
    currentTime: 0,
    totalDuration: tracks[0]?.duration || 0,
    isLoading: false,
    error: null,
    useNativePreview: !isLoggedIn,
    currentTrack: tracks[0] || null,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    if (state.isPlaying) {
      setHasStarted(true);
      setShowPromo(false);
    } else if (hasStarted && !isLoggedIn) {
      setShowPromo(true);
    }
  }, [state.isPlaying, hasStarted, isLoggedIn]);

  const controllerRef = useRef<EmbedPlaylistPlayerController | null>(null);

  // ── Initialize Controller ──
  useEffect(() => {
    const controller = new EmbedPlaylistPlayerController({
      tracks,
      isLoggedIn,
      onStateChange: (patch) => {
        setState((prev) => ({ ...prev, ...patch }));
      },
    });

    controllerRef.current = controller;
    controller.initialize();

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [tracks, isLoggedIn]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay(state.isPlaying);
  }, [state.isPlaying]);

  const handleNext = useCallback(() => {
    controllerRef.current?.handleNext();
  }, []);

  const handlePrev = useCallback(() => {
    controllerRef.current?.handlePrev();
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (state.totalDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = ratio * state.totalDuration;
    controllerRef.current?.seek(seekTime);
  }, [state.totalDuration]);

  const setTrack = useCallback((index: number) => {
    controllerRef.current?.setTrackIndex(index);
  }, []);

  if (tracks.length === 0) {
    return (
      <div className="w-full h-full min-h-[380px] bg-[#f5f5f7] flex items-center justify-center font-sans">
        <span className="text-[#86868b] text-sm">No tracks in this playlist</span>
      </div>
    );
  }

  return (
    <EmbedPlaylistPlayerUI
      playlistId={playlistId}
      playlistName={playlistName}
      coverUrl={coverUrl}
      tracks={tracks}
      isLoggedIn={isLoggedIn}
      state={state}
      showPromo={showPromo}
      setShowPromo={setShowPromo}
      togglePlay={togglePlay}
      handleNext={handleNext}
      handlePrev={handlePrev}
      handleSeek={handleSeek}
      setTrack={setTrack}
    />
  );
}
