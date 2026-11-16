export interface KeyboardShortcutsConfig {
  playPause: string;      // default: 'Space'
  nextTrack: string;      // default: 'n'
  prevTrack: string;      // default: 'p'
  forward10: string;      // default: 'l'
  rewind10: string;       // default: 'j'
  closeNowPlaying: string;// default: 'Escape'
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutsConfig = {
  playPause: 'Space',
  nextTrack: 'n',
  prevTrack: 'p',
  forward10: 'l',
  rewind10: 'j',
  closeNowPlaying: 'Escape',
};

export interface UserSettings {
  lyricsFontSize: 'small' | 'medium' | 'large';
  romanizationEnabled: boolean;
  isPublic: boolean;
  showNowPlaying: boolean;
  showRecentlyPlayed: boolean;
  shortcuts?: KeyboardShortcutsConfig;
}

export interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  updateShortcuts: (shortcuts: Partial<KeyboardShortcutsConfig>) => void;
  resetShortcuts: () => void;
  isLoaded: boolean;
}
