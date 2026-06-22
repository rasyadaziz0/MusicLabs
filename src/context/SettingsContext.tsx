'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';

export interface UserSettings {
  lyricsFontSize: 'small' | 'medium' | 'large';
  romanizationEnabled: boolean;
  isPublic: boolean;
  showNowPlaying: boolean;
  showRecentlyPlayed: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  lyricsFontSize: 'medium',
  romanizationEnabled: true,
  isPublic: true,
  showNowPlaying: true,
  showRecentlyPlayed: true,
};

const STORAGE_KEY = 'userSettings';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  isLoaded: boolean;
}

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
    // 1. Instant load from localStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }

    // 2. If user is logged in, fetch from Supabase (source of truth)
    if (authLoading) return;

    if (!user) {
      setIsLoaded(true);
      return;
    }

    ProfileRepository.getInstance().getProfile(user.id).then(data => {
      if (data) {
        const loaded: UserSettings = {
          lyricsFontSize: (data.lyrics_font_size as UserSettings['lyricsFontSize']) || 'medium',
          romanizationEnabled: data.romanization_enabled ?? true,
          isPublic: data.is_public ?? true,
          showNowPlaying: data.show_now_playing ?? true,
          showRecentlyPlayed: data.show_recently_played ?? true,
        };
        setSettings(loaded);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
      }
      setIsLoaded(true);
    }).catch(() => {
      setIsLoaded(true);
    });
  }, [user, authLoading]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
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
