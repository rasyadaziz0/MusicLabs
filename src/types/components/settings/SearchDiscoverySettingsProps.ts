export interface SearchDiscoverySettingsProps {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  searchRegion: string;
  setSearchRegion: (region: string) => void;
}
