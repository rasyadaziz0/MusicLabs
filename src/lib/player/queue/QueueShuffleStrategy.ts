import { Song } from '@/types/music';

/**
 * QueueShuffleStrategy
 * Encapsulates track unique ID generation, Fisher-Yates shuffle algorithms,
 * and smart queue shuffling that keeps the active track pinned at index 0.
 */
export class QueueShuffleStrategy {
  /**
   * Ensures every track has a unique queueItemId so duplicate tracks can coexist.
   */
  public static assignQueueItemId(track: Song): Song {
    if (track.queueItemId) return track;
    const uniqueId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    return { ...track, queueItemId: uniqueId };
  }

  /**
   * Implements unbiased in-place Fisher-Yates array permutation.
   */
  public static fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Shuffles an array of tracks while keeping the active track at index 0.
   */
  public static shuffleQueueKeepingCurrent(
    tracks: Song[],
    currentQueueItemId?: string
  ): Song[] {
    if (tracks.length <= 1) return [...tracks];

    if (!currentQueueItemId) {
      return this.fisherYatesShuffle(tracks);
    }

    const currentTrack = tracks.find((t) => t.queueItemId === currentQueueItemId);
    const rest = tracks.filter((t) => t.queueItemId !== currentQueueItemId);
    const shuffledRest = this.fisherYatesShuffle(rest);

    return currentTrack ? [currentTrack, ...shuffledRest] : shuffledRest;
  }

  /**
   * Resolves the corresponding index in the unshuffled original queue.
   */
  public static restoreUnshuffledIndex(
    originalQueue: Song[],
    currentQueueItemId?: string
  ): number {
    if (!currentQueueItemId) return 0;
    const restoredIndex = originalQueue.findIndex((s) => s.queueItemId === currentQueueItemId);
    return restoredIndex !== -1 ? restoredIndex : 0;
  }
}
