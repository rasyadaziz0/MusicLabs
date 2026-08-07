import { ReactNode } from 'react';
import { Song } from '@/types/music';

export interface AppleMusicTrackListProps {
  tracks: Song[];
  onPlayTrack: (track: Song, allTracks: Song[], index?: number) => void;
  showHeart?: boolean;
  showAlbum?: boolean;
  hideHeader?: boolean;
  renderTrackOptions?: (track: Song, closeMenu: () => void) => ReactNode;
  className?: string;
  isReorderable?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}
