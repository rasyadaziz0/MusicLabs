'use client';

import { SettingsService } from '@/lib/services/SettingsService';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

import { DEFAULT_KEYBOARD_SHORTCUTS, KeyboardShortcutsConfig, UserSettings, SettingsContextType } from '@/types/context/settings';

const DEFAULT_SETTINGS: UserSettings = {
  lyricsFontSize: 'medium',
  romanizationEnabled: true,
  isPublic: true,
  showNowPlaying: true,
  showRecentlyPlayed: true,
  shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
};

const STORAGE_KEY = 'userSettings';

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  updateShortcuts: () => {},
  resetShortcuts: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings: localStorage first (instant), then Supabase (authoritative)
  useEffect(() => {
    const settingsService = SettingsService.getInstance();
    
    // 1. Instant load from localStorage
    const localSettings = settingsService.getLocalSettings(DEFAULT_SETTINGS);
    setSettings(localSettings);

    // 2. If user is logged in, fetch from Supabase (source of truth)
    if (authLoading) return;

    if (!user) {
      setIsLoaded(true);
      return;
    }

    settingsService.fetchRemoteSettings(user.id).then(remoteData => {
      if (remoteData) {
        const loaded: UserSettings = { ...localSettings, ...remoteData };
        setSettings(loaded);
        settingsService.saveLocalSettings(loaded);
      }
      setIsLoaded(true);
    }).catch(() => {
      setIsLoaded(true);
    });
  }, [user, authLoading]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      SettingsService.getInstance().saveLocalSettings(next);
      return next;
    });
  }, []);

  const updateShortcuts = useCallback((partial: Partial<KeyboardShortcutsConfig>) => {
    setSettings(prev => {
      const nextShortcuts = {
        ...(prev.shortcuts || DEFAULT_KEYBOARD_SHORTCUTS),
        ...partial,
      };
      const next: UserSettings = {
        ...prev,
        shortcuts: nextShortcuts,
      };
      SettingsService.getInstance().saveLocalSettings(next);
      if (user) {
        SettingsService.getInstance().syncShortcutsToRemote(nextShortcuts);
      }
      return next;
    });
  }, [user]);

  const resetShortcuts = useCallback(() => {
    setSettings(prev => {
      const next: UserSettings = {
        ...prev,
        shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
      };
      SettingsService.getInstance().saveLocalSettings(next);
      if (user) {
        SettingsService.getInstance().syncShortcutsToRemote(DEFAULT_KEYBOARD_SHORTCUTS);
      }
      return next;
    });
  }, [user]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateShortcuts,
        resetShortcuts,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
