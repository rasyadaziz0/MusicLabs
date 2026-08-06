import { Song } from '@/types/music';

export interface TrackContextMenuProps {
  track: Song | null;
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  showPlayerControls?: boolean;
}
