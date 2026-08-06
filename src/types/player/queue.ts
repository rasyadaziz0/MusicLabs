import { Song } from '@/types/music';

export interface AutoplayManagerCallbacks {
  onStateChange: (isEnabled: boolean) => void;
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface QueueState {
  queue: Song[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isAutoplayEnabled: boolean;
}

export interface QueueManagerCallbacks {
  onStateChange: (state: QueueState) => void;
}
