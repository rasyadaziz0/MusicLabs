import { Song } from '@/types/music';
import { RepeatMode } from '@/types/player/queue';
import { QueueShuffleStrategy } from './QueueShuffleStrategy';

export interface NextIndexResult {
  nextIndex: number | null;
  reshuffledQueue?: Song[];
}

/**
 * QueueNavigator
 * Calculates next/previous queue navigation and cycles repeat playback modes.
 */
export class QueueNavigator {
  /**
   * Cycles repeat mode in standard order: none -> all -> one -> none
   */
  public static cycleRepeatMode(current: RepeatMode): RepeatMode {
    switch (current) {
      case 'none':
        return 'all';
      case 'all':
        return 'one';
      case 'one':
        return 'none';
      default:
        return 'none';
    }
  }

  /**
   * Resolves the previous index in circular order.
   */
  public static getPrevIndex(queueLength: number, queueIndex: number): number {
    if (queueLength === 0) return -1;
    return (queueIndex - 1 + queueLength) % queueLength;
  }

  /**
   * Resolves the next index, handling end-of-queue stops and repeat-all reshuffles.
   */
  public static getNextIndex(params: {
    queue: Song[];
    originalQueue: Song[];
    queueIndex: number;
    repeatMode: RepeatMode;
    isShuffled: boolean;
  }): NextIndexResult {
    const { queue, originalQueue, queueIndex, repeatMode, isShuffled } = params;

    if (queue.length === 0 || queueIndex === -1) {
      return { nextIndex: null };
    }

    const nextIdx = queueIndex + 1;

    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        // When shuffled + repeat all: re-shuffle for the next cycle
        if (isShuffled) {
          const currentTrack = queue[queueIndex];
          const reshuffled = QueueShuffleStrategy.fisherYatesShuffle(originalQueue);

          // Avoid starting with the same track that just ended
          if (reshuffled.length > 1 && reshuffled[0].queueItemId === currentTrack?.queueItemId) {
            const swapIdx = 1 + Math.floor(Math.random() * (reshuffled.length - 1));
            [reshuffled[0], reshuffled[swapIdx]] = [reshuffled[swapIdx], reshuffled[0]];
          }

          return { nextIndex: 0, reshuffledQueue: reshuffled };
        }
        return { nextIndex: 0 };
      } else {
        return { nextIndex: null }; // End of queue, stop playback
      }
    }

    return { nextIndex: nextIdx };
  }
}
