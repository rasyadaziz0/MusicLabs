
import { Song } from '@/types/music';

// ─── Types ───

export type RepeatMode = 'none' | 'all' | 'one';

export interface QueueState {
  queue: Song[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
}

export interface QueueManagerCallbacks {
  onStateChange: (state: QueueState) => void;
}

// ─── Manager class ───

export class QueueManager {
  private _originalQueue: Song[] = [];  // preserves insertion order
  private _queue: Song[] = [];          // active queue (may be shuffled)
  private _queueIndex: number = -1;
  private _isShuffled: boolean = false;
  private _repeatMode: RepeatMode = 'none';
  private callbacks: QueueManagerCallbacks;

  constructor(callbacks: QueueManagerCallbacks) {
    this.callbacks = callbacks;
  }

  // ── Getters ──

  get queue(): Song[] { return this._queue; }
  get queueIndex(): number { return this._queueIndex; }
  get isShuffled(): boolean { return this._isShuffled; }
  get repeatMode(): RepeatMode { return this._repeatMode; }

  // ── Internal emit ──

  private emit(): void {
    this.callbacks.onStateChange({
      queue: this._queue,
      queueIndex: this._queueIndex,
      isShuffled: this._isShuffled,
      repeatMode: this._repeatMode,
    });
  }

  // ── Fisher-Yates shuffle ──

  private static fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Shuffle the queue, keeping a specific track at position 0
   * (so the currently playing track stays at the front).
   */
  private shuffleQueueKeepingCurrent(tracks: Song[], currentTrackId?: string): Song[] {
    if (tracks.length <= 1) return [...tracks];

    if (!currentTrackId) {
      return QueueManager.fisherYatesShuffle(tracks);
    }

    const currentTrack = tracks.find(t => t.id === currentTrackId);
    const rest = tracks.filter(t => t.id !== currentTrackId);
    const shuffledRest = QueueManager.fisherYatesShuffle(rest);

    return currentTrack ? [currentTrack, ...shuffledRest] : shuffledRest;
  }

  // ── Mutations ──

  /**
   * Replace the queue contents. If `trackId` is provided, the index is
   * set to the position of that track (falls back to 0).
   */
  setQueue(tracks: Song[], trackId?: string): void {
    this._originalQueue = [...tracks];

    if (this._isShuffled) {
      this._queue = this.shuffleQueueKeepingCurrent(tracks, trackId);
    } else {
      this._queue = [...tracks];
    }

    if (trackId !== undefined) {
      const index = this._queue.findIndex((s) => s.id === trackId);
      this._queueIndex = index !== -1 ? index : 0;
    }
    this.emit();
  }

  setIndex(index: number): void {
    this._queueIndex = index;
    this.emit();
  }

  /**
   * Toggle shuffle on/off.
   * - When turning ON: shuffles the queue but keeps the current track in place.
   * - When turning OFF: restores original order, repositioning index to the current track.
   */
  toggleShuffle(): void {
    this._isShuffled = !this._isShuffled;

    const currentTrack = this._queue[this._queueIndex];

    if (this._isShuffled) {
      // Shuffle: keep current track at current position (front of remaining)
      this._queue = this.shuffleQueueKeepingCurrent(this._originalQueue, currentTrack?.id);
      this._queueIndex = 0; // current track is at position 0
    } else {
      // Unshuffle: restore original order
      this._queue = [...this._originalQueue];
      if (currentTrack) {
        const restoredIndex = this._queue.findIndex(s => s.id === currentTrack.id);
        this._queueIndex = restoredIndex !== -1 ? restoredIndex : 0;
      }
    }

    this.emit();
  }

  /**
   * Shuffle the queue and start playing from the first track.
   * Used by page-level shuffle buttons (playlist, album, liked songs).
   * Returns the first track in the shuffled queue.
   */
  shuffleAndPlay(tracks: Song[]): Song | null {
    if (tracks.length === 0) return null;

    this._originalQueue = [...tracks];
    this._isShuffled = true;
    this._queue = QueueManager.fisherYatesShuffle(tracks);
    this._queueIndex = 0;
    this.emit();

    return this._queue[0];
  }

  cycleRepeatMode(): void {
    this._repeatMode =
      this._repeatMode === 'none' ? 'all'
        : this._repeatMode === 'all' ? 'one'
          : 'none';
    this.emit();
  }

  clearQueue(): void {
    if (this._queueIndex >= 0) {
      this._queue = this._queue.slice(0, this._queueIndex + 1);
      const remainingIds = new Set(this._queue.map(t => t.id));
      this._originalQueue = this._originalQueue.filter(t => remainingIds.has(t.id));
    } else {
      this._queue = [];
      this._originalQueue = [];
      this._queueIndex = -1;
    }
    this.emit();
  }

  /**
   * Append a track to the end of the queue.
   * Skips if the last track in the queue is the same track (duplicate-adjacent guard).
   */
  addToQueue(track: Song): void {
    if (this._queue.length > 0 && this._queue[this._queue.length - 1].id === track.id) return;
    this._queue = [...this._queue, track];
    this._originalQueue = [...this._originalQueue, track];
    this.emit();
  }

  // ── Index calculation ──

  /**
   * Calculate the next track index based on shuffle and repeat mode.
   *
   * - repeat-one is NOT handled here (the caller should check & replay before calling)
   * - Returns `null` when playback should stop (end of non-repeating queue)
   */
  getNextIndex(): number | null {
    if (this._queue.length === 0 || this._queueIndex === -1) return null;

    const nextIdx = this._queueIndex + 1;

    if (nextIdx >= this._queue.length) {
      if (this._repeatMode === 'all') {
        // When shuffled + repeat all: re-shuffle for the next cycle
        if (this._isShuffled) {
          const currentTrack = this._queue[this._queueIndex];
          this._queue = QueueManager.fisherYatesShuffle(this._originalQueue);

          // Avoid starting with the same track that just ended
          if (this._queue.length > 1 && this._queue[0].id === currentTrack?.id) {
            const swapIdx = 1 + Math.floor(Math.random() * (this._queue.length - 1));
            [this._queue[0], this._queue[swapIdx]] = [this._queue[swapIdx], this._queue[0]];
          }
          this.emit();
        }
        return 0;
      } else {
        return null; // Stop playback
      }
    }

    return nextIdx;
  }

  getPrevIndex(): number {
    return (this._queueIndex - 1 + this._queue.length) % this._queue.length;
  }
}
