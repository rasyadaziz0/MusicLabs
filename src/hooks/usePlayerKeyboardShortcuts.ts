'use client';

import { useSettings } from '@/context/SettingsContext';
import { KeyboardShortcutDispatcher } from '@/lib/shortcuts';
import { DEFAULT_KEYBOARD_SHORTCUTS } from '@/types/context/settings';
import { Song } from '@/types/music';
import { useEffect, useRef } from 'react';

export interface PlayerKeyboardShortcutsProps {
  currentTrack: Song | null;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  isNowPlayingOpen?: boolean;
  onCloseNowPlaying?: () => void;
  enabled?: boolean;
}

export function usePlayerKeyboardShortcuts({
  currentTrack,
  togglePlay,
  nextTrack,
  prevTrack,
  seek,
  currentTime,
  duration,
  isNowPlayingOpen,
  onCloseNowPlaying,
  enabled = true,
}: PlayerKeyboardShortcutsProps) {
  const { settings } = useSettings();
  const shortcuts = settings.shortcuts || DEFAULT_KEYBOARD_SHORTCUTS;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const contextRef = useRef({
    hasTrack: Boolean(currentTrack),
    currentTime,
    duration,
    isNowPlayingOpen,
    onCloseNowPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
  });

  contextRef.current = {
    hasTrack: Boolean(currentTrack),
    currentTime,
    duration,
    isNowPlayingOpen,
    onCloseNowPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
  };

  useEffect(() => {
    if (!enabled) return;

    const dispatcher = KeyboardShortcutDispatcher.getInstance();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentShortcuts = shortcutsRef.current || DEFAULT_KEYBOARD_SHORTCUTS;
      dispatcher.dispatch(e, currentShortcuts, contextRef.current);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled]);
}
