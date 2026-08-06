import { Song } from '@/types/music';

export interface LyricsHeaderProps {
  currentTrack: Song;
  hasRomanizations: boolean;
  showRomanization: boolean;
  onToggleRomanization: () => void;
  hideHeader?: boolean;
}
