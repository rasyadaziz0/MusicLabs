'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EmbedPlayerController, EmbedPlayerState } from './EmbedPlayerController';
import { EmbedTrackPlayerUI } from './EmbedTrackPlayerUI';

// ─── Props ───────────────────────────────────────────────────────────────────

interface EmbedPlayerProps {
  trackId: string;
  trackName: string;
  artistName: string;
  coverUrl: string;
  duration: number; // seconds
  isLoggedIn?: boolean;
  previewUrl?: string; // iTunes preview URL (30s)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmbedPlayer({
  trackId,
  trackName,
  artistName,
  coverUrl,
  duration,
  isLoggedIn = false,
  previewUrl,
}: EmbedPlayerProps) {

  const [state, setState] = useState<EmbedPlayerState>({
    isPlaying: false,
    currentTime: 0,
    totalDuration: duration || 30,
    isLoading: true,
    error: null,
  });
  
  const [hasStarted, setHasStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    if (state.isPlaying) {
      setHasStarted(true);
      setShowPromo(false);
    } else if (hasStarted && !isLoggedIn) {
      // Show promo modal when paused or ended for guests
      setShowPromo(true);
    }
  }, [state.isPlaying, hasStarted, isLoggedIn]);

  const controllerRef = useRef<EmbedPlayerController | null>(null);

  // ── Initialize Controller ──
  useEffect(() => {
    const controller = new EmbedPlayerController({
      trackName,
      artistName,
      duration,
      isLoggedIn,
      previewUrl,
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
  }, [trackName, artistName, duration, isLoggedIn, previewUrl]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay(state.isPlaying);
  }, [state.isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (state.totalDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = ratio * state.totalDuration;

    controllerRef.current?.seek(seekTime);
  }, [state.totalDuration]);

  return (
    <EmbedTrackPlayerUI
      trackId={trackId}
      trackName={trackName}
      artistName={artistName}
      coverUrl={coverUrl}
      isLoggedIn={isLoggedIn}
      state={state}
      hasStarted={hasStarted}
      showMenu={showMenu}
      setShowMenu={setShowMenu}
      showPromo={showPromo}
      setShowPromo={setShowPromo}
      togglePlay={togglePlay}
      handleSeek={handleSeek}
      useNativePreview={controllerRef.current?.useNativePreview || false}
    />
  );
}
