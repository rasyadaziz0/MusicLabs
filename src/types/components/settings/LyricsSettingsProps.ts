export interface LyricsSettingsProps {
  t: (key: string) => string;
  lyricsFontSize: string;
  setLyricsFontSize: (size: string) => void;
  romanizationEnabled: boolean;
  setRomanizationEnabled: (enabled: boolean) => void;
  fontSizeOptions: { value: string; label: string }[];
}
