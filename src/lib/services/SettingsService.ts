import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { supabase } from '@/lib/supabase/client';
import { KeyboardShortcutsConfig, UserSettings } from '@/types/context/settings';

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
      // 1. Ambil dari user_metadata (Supabase Auth) - cepat dan bebas migrasi
      const { data: { user } } = await supabase.auth.getUser();
      const metaShortcuts = user?.user_metadata?.keyboard_shortcuts as KeyboardShortcutsConfig | undefined;

      // 2. Ambil dari tabel profiles (database)
      const data = await ProfileRepository.getInstance().getProfile(userId);
      const remoteSettings: Partial<UserSettings> = {};

      if (data) {
        remoteSettings.lyricsFontSize = (data.lyrics_font_size as UserSettings['lyricsFontSize']) || 'medium';
        remoteSettings.romanizationEnabled = data.romanization_enabled ?? true;
        remoteSettings.isPublic = data.is_public ?? true;
        remoteSettings.showNowPlaying = data.show_now_playing ?? true;
        remoteSettings.showRecentlyPlayed = data.show_recently_played ?? true;
        if (data.keyboard_shortcuts) {
          remoteSettings.shortcuts = data.keyboard_shortcuts as any;
        }
      }

      if (metaShortcuts && !remoteSettings.shortcuts) {
        remoteSettings.shortcuts = metaShortcuts;
      }

      return remoteSettings;
    } catch (err) {
      console.error('SettingsService fetchRemoteSettings error:', err);
    }
    return null;
  }

  public async syncShortcutsToRemote(shortcuts: KeyboardShortcutsConfig): Promise<void> {
    try {
      // 1. Simpan ke Supabase Auth metadata (otomatis tersinkron antar perangkat)
      await supabase.auth.updateUser({
        data: { keyboard_shortcuts: shortcuts },
      });

      // 2. Coba simpan ke kolom profiles (jika kolom sudah ada di tabel)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ keyboard_shortcuts: shortcuts })
            .eq('id', user.id);
        } catch {
          // Gracefully handled jika kolom profiles belum dibuat via migrasi
        }
      }
    } catch (err) {
      console.error('SettingsService syncShortcutsToRemote error:', err);
    }
  }
}
