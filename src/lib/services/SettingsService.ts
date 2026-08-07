import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { UserSettings } from '@/types/context/settings';

const STORAGE_KEY = 'userSettings';

export class SettingsService {
  private static instance: SettingsService;

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getLocalSettings(defaultSettings: UserSettings): UserSettings {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...defaultSettings, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  }

  public saveLocalSettings(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public async fetchRemoteSettings(userId: string): Promise<Partial<UserSettings> | null> {
    try {
      const data = await ProfileRepository.getInstance().getProfile(userId);
      if (data) {
        return {
          lyricsFontSize: (data.lyrics_font_size as UserSettings['lyricsFontSize']) || 'medium',
          romanizationEnabled: data.romanization_enabled ?? true,
          isPublic: data.is_public ?? true,
          showNowPlaying: data.show_now_playing ?? true,
          showRecentlyPlayed: data.show_recently_played ?? true,
        };
      }
    } catch (err) {
      console.error('SettingsService fetchRemoteSettings error:', err);
    }
    return null;
  }
}
