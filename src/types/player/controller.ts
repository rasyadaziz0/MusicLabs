import { Song } from '@/types/music';
import { RadioMeta } from '@/types/player/engine';

export type PlayerState = {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean;
  isGuestPreview: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isRadio: boolean;
  radioMeta: RadioMeta | null;
  isError: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  sleepTimerEndTime: number | null;
  isAutoplayEnabled: boolean;
};

export interface PlayerControllerOptions {
  /** Called when state changes. Receives a partial state to merge. */
  onStateChange: (patch: Partial<PlayerState>) => void;
}

export interface QueueContextAdapter {
  queue: Song[];
  queueIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  playTrack: (track: Song, queue?: Song[], target?: number | string) => void;
  clearQueue: () => void;
  cycleRepeatMode: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  removeFromQueue: (trackId: string) => void;
  promoteToManual: (trackId: string) => void;
}

export type SortableTrack = Song & { uniqueId: string };
