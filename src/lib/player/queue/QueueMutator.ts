import { Song } from '@/types/music';
import { QueueShuffleStrategy } from './QueueShuffleStrategy';
import { AutoplayManager } from './AutoplayManager';

export interface MutableQueueState {
  queue: Song[];
  originalQueue: Song[];
  queueIndex: number;
}

export class QueueMutator {
  /**
   * Appends a track before autoplay tracks, updating both active and original queues.
   */
  public static addToQueue(state: MutableQueueState, track: Song): boolean {
    if (state.queue.length > 0 && state.queue[state.queue.length - 1].id === track.id) {
      return false;
    }

    const trackToAdd = QueueShuffleStrategy.assignQueueItemId({ ...track, isAutoplay: false });

    // Active queue: insert before first autoplay track
    const firstAutoplayIdx = state.queue.findIndex((t) => t.isAutoplay);
    if (firstAutoplayIdx !== -1) {
      state.queue = [
        ...state.queue.slice(0, firstAutoplayIdx),
        trackToAdd,
        ...state.queue.slice(firstAutoplayIdx),
      ];
    } else {
      state.queue = [...state.queue, trackToAdd];
    }

    // Original queue: insert before first autoplay track
    const origFirstAutoplayIdx = state.originalQueue.findIndex((t) => t.isAutoplay);
    if (origFirstAutoplayIdx !== -1) {
      state.originalQueue = [
        ...state.originalQueue.slice(0, origFirstAutoplayIdx),
        trackToAdd,
        ...state.originalQueue.slice(origFirstAutoplayIdx),
      ];
    } else {
      state.originalQueue = [...state.originalQueue, trackToAdd];
    }

    return true;
  }

  /**
   * Inserts track immediately after current track index in both queues.
   */
  public static playNext(state: MutableQueueState, track: Song): void {
    if (state.queue.length === 0) {
      this.addToQueue(state, track);
      return;
    }

    const trackToAdd = QueueShuffleStrategy.assignQueueItemId({ ...track, isAutoplay: false });

    // Insert after current track in active queue
    const insertIdx = state.queueIndex >= 0 ? state.queueIndex + 1 : state.queue.length;
    state.queue = [
      ...state.queue.slice(0, insertIdx),
      trackToAdd,
      ...state.queue.slice(insertIdx),
    ];

    // Determine correct insertion point for original queue
    const currentTrack = state.queueIndex >= 0 ? state.queue[state.queueIndex] : null;
    let origInsertIdx = state.originalQueue.length;

    if (currentTrack) {
      const foundIdx = state.originalQueue.findIndex(
        (t) => t.queueItemId === currentTrack.queueItemId
      );
      if (foundIdx !== -1) {
        origInsertIdx = foundIdx + 1;
      }
    }

    state.originalQueue = [
      ...state.originalQueue.slice(0, origInsertIdx),
      trackToAdd,
      ...state.originalQueue.slice(origInsertIdx),
    ];
  }

  /**
   * Removes a track from both active queue and original queue.
   */
  public static removeFromQueue(
    state: MutableQueueState,
    trackId: string,
    queueItemId?: string
  ): boolean {
    const predicate = queueItemId
      ? (t: Song) => t.queueItemId === queueItemId
      : (t: Song) => t.id === trackId;

    const idx = state.queue.findIndex((t, i) => predicate(t) && i > state.queueIndex);
    if (idx === -1) return false;

    const removed = state.queue.splice(idx, 1)[0];
    const origIdx = state.originalQueue.findIndex((t) => t.queueItemId === removed.queueItemId);
    if (origIdx !== -1) {
      state.originalQueue.splice(origIdx, 1);
    }
    return true;
  }

  /**
   * Promotes an autoplay track to manual and moves it before other autoplay tracks.
   */
  public static promoteToManual(
    state: MutableQueueState,
    trackId: string,
    queueItemId?: string
  ): boolean {
    const predicate = queueItemId
      ? (t: Song) => t.queueItemId === queueItemId
      : (t: Song) => t.id === trackId;

    const idx = state.queue.findIndex((t, i) => predicate(t) && i > state.queueIndex);
    if (idx === -1) return false;

    state.queue[idx] = { ...state.queue[idx], isAutoplay: false };

    // Move it before other autoplay tracks
    const [track] = state.queue.splice(idx, 1);
    const firstAutoplayIdx = state.queue.findIndex((t) => t.isAutoplay);
    if (firstAutoplayIdx !== -1) {
      state.queue.splice(firstAutoplayIdx, 0, track);
    } else {
      state.queue.push(track);
    }

    const origIdx = state.originalQueue.findIndex((t) => t.queueItemId === track.queueItemId);
    if (origIdx !== -1) {
      state.originalQueue[origIdx] = { ...state.originalQueue[origIdx], isAutoplay: false };
    }
    return true;
  }

  /**
   * Clears upcoming tracks in the queue, preserving history up to the current track.
   */
  public static clearQueue(state: MutableQueueState): void {
    if (state.queueIndex >= 0) {
      const currentTrack = state.queue[state.queueIndex];
      state.queue = state.queue.slice(0, state.queueIndex + 1);

      if (currentTrack) {
        const origIdx = state.originalQueue.findIndex(
          (t) => t.queueItemId === currentTrack.queueItemId
        );
        if (origIdx !== -1) {
          state.originalQueue = state.originalQueue.slice(0, origIdx + 1);
        }
      }
    } else {
      state.queue = [];
      state.originalQueue = [];
      state.queueIndex = -1;
    }
  }

  /**
   * Reorders tracks in the active queue and shifts queueIndex appropriately.
   */
  public static reorderQueue(
    state: MutableQueueState,
    startIndex: number,
    endIndex: number
  ): boolean {
    if (
      startIndex < 0 ||
      startIndex >= state.queue.length ||
      endIndex < 0 ||
      endIndex >= state.queue.length ||
      startIndex === endIndex
    ) {
      return false;
    }

    const newQueue = [...state.queue];
    const [moved] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, moved);
    state.queue = newQueue;

    if (startIndex === state.queueIndex) {
      state.queueIndex = endIndex;
    } else if (startIndex < state.queueIndex && endIndex >= state.queueIndex) {
      state.queueIndex--;
    } else if (startIndex > state.queueIndex && endIndex <= state.queueIndex) {
      state.queueIndex++;
    }

    return true;
  }

  /**
   * Appends arbitrary tracks ensuring duplicates are ignored.
   */
  public static appendTracks(state: MutableQueueState, tracks: Song[]): boolean {
    if (!tracks || tracks.length === 0) return false;

    const existingIds = new Set(state.queue.map((t) => t.id));
    const newTracks = tracks.filter((t) => !existingIds.has(t.id));

    if (newTracks.length === 0) return false;

    const taggedNewTracks = newTracks.map((t) =>
      QueueShuffleStrategy.assignQueueItemId({ ...t, isAutoplay: t.isAutoplay ?? true })
    );

    state.queue = [...state.queue, ...taggedNewTracks];
    state.originalQueue = [...state.originalQueue, ...taggedNewTracks];
    return true;
  }

  /**
   * Appends recommendations from AutoplayManager ensuring unique IDs.
   */
  public static appendAutoplayTracks(
    state: MutableQueueState,
    tracks: Song[],
    autoplayManager: AutoplayManager
  ): boolean {
    if (!tracks || tracks.length === 0) return false;

    const existingIds = new Set(state.queue.map((t) => t.id));
    const taggedNewTracks = autoplayManager
      .getTracksToAppend(tracks, existingIds)
      .map((t) => QueueShuffleStrategy.assignQueueItemId(t));

    if (taggedNewTracks.length === 0) return false;

    state.queue = [...state.queue, ...taggedNewTracks];
    state.originalQueue = [...state.originalQueue, ...taggedNewTracks];
    return true;
  }
}
