import { SortableTrack } from '@/types/player/controller';

export interface AutoplayTrackRowProps {
  track: SortableTrack;
  onClick: () => void;
  onPromote: (trackId: string) => void;
  onRemove: (trackId: string) => void;
}
