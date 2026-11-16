'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppleMusicThemeColors, PlaylistThemeService } from '@/lib/color';

export interface PlaylistThemeState {
  theme: AppleMusicThemeColors | null;
  isActive: boolean;
  coverUrl?: string | null;
  playlistName?: string | null;
  playlistId?: string | null;
}

interface PlaylistThemeContextType {
  state: PlaylistThemeState;
  setThemeForPlaylist: (params: {
    coverUrl?: string | null;
    playlistName?: string | null;
    playlistId?: string | null;
  }) => void;
  clearTheme: () => void;
}

const defaultState: PlaylistThemeState = {
  theme: null,
  isActive: false,
  coverUrl: null,
  playlistName: null,
  playlistId: null,
};

const PlaylistThemeContext = createContext<PlaylistThemeContextType>({
  state: defaultState,
  setThemeForPlaylist: () => { },
  clearTheme: () => { },
});

export function PlaylistThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlaylistThemeState>(defaultState);
  const activeKeyRef = useRef<string | null>(null);

  const setThemeForPlaylist = useCallback(
    async (params: {
      coverUrl?: string | null;
      playlistName?: string | null;
      playlistId?: string | null;
    }) => {
      const currentKey = `${params.playlistId || ''}-${params.coverUrl || ''}-${params.playlistName || ''}`;
      activeKeyRef.current = currentKey;

      const theme = await PlaylistThemeService.getInstance().resolveTheme(params);
      if (activeKeyRef.current !== currentKey) return;

      setState({
        theme,
        isActive: true,
        coverUrl: params.coverUrl,
        playlistName: params.playlistName,
        playlistId: params.playlistId,
      });
    },
    []
  );

  const clearTheme = useCallback(() => {
    activeKeyRef.current = null;
    setState(defaultState);
  }, []);

  useEffect(() => {
    PlaylistThemeService.getInstance().applyThemeToDocument(
      state.isActive && state.theme ? state.theme : null
    );
  }, [state]);

  return (
    <PlaylistThemeContext.Provider value={{ state, setThemeForPlaylist, clearTheme }}>
      {children}
    </PlaylistThemeContext.Provider>
  );
}

export function usePlaylistTheme() {
  return useContext(PlaylistThemeContext);
}

export function useSetPlaylistTheme({
  coverUrl,
  playlistName,
  playlistId,
  enabled = true,
}: {
  coverUrl?: string | null;
  playlistName?: string | null;
  playlistId?: string | null;
  enabled?: boolean;
}) {
  const { setThemeForPlaylist, clearTheme } = usePlaylistTheme();

  useEffect(() => {
    if (!enabled) return;

    setThemeForPlaylist({ coverUrl, playlistName, playlistId });

    return () => {
      clearTheme();
    };
  }, [coverUrl, playlistName, playlistId, enabled, setThemeForPlaylist, clearTheme]);
}
