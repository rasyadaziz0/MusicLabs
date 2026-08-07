export interface UserSettings {
  lyricsFontSize: 'small' | 'medium' | 'large';
  romanizationEnabled: boolean;
  isPublic: boolean;
  showNowPlaying: boolean;
  showRecentlyPlayed: boolean;
}


export interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  isLoaded: boolean;
}
