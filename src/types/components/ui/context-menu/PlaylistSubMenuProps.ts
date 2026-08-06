import { Song } from '@/types/music';

export interface PlaylistSubMenuProps {
  track: Song;
  onClose: () => void;
  onBack: () => void;
  hideHeader?: boolean;
}
