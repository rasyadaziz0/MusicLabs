export interface PrivacySocialSettingsProps {
  t: (key: string) => string;
  isPublic: boolean;
  setIsPublic: (enabled: boolean) => void;
  showNowPlaying: boolean;
  setShowNowPlaying: (enabled: boolean) => void;
  showRecentlyPlayed: boolean;
  setShowRecentlyPlayed: (enabled: boolean) => void;
}
