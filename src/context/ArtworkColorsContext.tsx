'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { useDominantColors, type DominantColors } from '@/hooks/useDominantColors';

// ── Context ────────────────────────────────────────────────────────────────

interface ArtworkColorsContextType {
  colors: DominantColors | null;
  prevColors: DominantColors | null;
  isLoading: boolean;
}

const ArtworkColorsContext = createContext<ArtworkColorsContextType>({
  colors: null,
  prevColors: null,
  isLoading: false,
});

// ── Provider — mount ONCE at app level, drives from currentTrack ───────────

export function ArtworkColorsProvider({ children }: { children: React.ReactNode }) {
  const { currentTrack } = usePlayer();

  const coverUrl = currentTrack ? getBestImageUrl(currentTrack.image) : null;
  const trackId = currentTrack?.id ?? null;

  const { current, previous, isLoading } = useDominantColors(coverUrl, trackId);

  // ── Set CSS custom properties on :root for global tinting ──
  useEffect(() => {
    if (!current) return;
    const root = document.documentElement;
    root.style.setProperty('--artwork-accent', current.colors[0]);
    root.style.setProperty('--artwork-secondary', current.colors[1]);
    root.style.setProperty('--artwork-muted', current.colors[2]);
    root.style.setProperty('--artwork-bg', current.colors[3]);
    root.style.setProperty('--artwork-luminance', String(current.luminance));

    return () => {
      root.style.removeProperty('--artwork-accent');
      root.style.removeProperty('--artwork-secondary');
      root.style.removeProperty('--artwork-muted');
      root.style.removeProperty('--artwork-bg');
      root.style.removeProperty('--artwork-luminance');
    };
  }, [current]);

  return (
    <ArtworkColorsContext.Provider
      value={{
        colors: current,
        prevColors: previous,
        isLoading,
      }}
    >
      {children}
    </ArtworkColorsContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useArtworkColors() {
  return useContext(ArtworkColorsContext);
}
