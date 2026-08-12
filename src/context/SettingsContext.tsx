'use client';

import { SettingsService } from '@/lib/services/SettingsService';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

import { UserSettings } from '@/types/context/settings';

import { SettingsContextType } from '@/types/context/settings';

const DEFAULT_SETTINGS: UserSettings = {
  lyricsFontSize: 'medium',
  romanizationEnabled: true,
  isPublic: true,
  showNowPlaying: true,
  showRecentlyPlayed: true,
};

const STORAGE_KEY = 'userSettings';

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
