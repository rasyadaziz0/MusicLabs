
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
  private _queue: Song[] = [];
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

  // ── Mutations ──

  /**
   * Replace the queue contents. If `trackId` is provided, the index is
   * set to the position of that track (falls back to 0).
   */
  setQueue(tracks: Song[], trackId?: string): void {
    this._queue = tracks;
    if (trackId !== undefined) {
      const index = tracks.findIndex((s) => s.id === trackId);
      this._queueIndex = index !== -1 ? index : 0;
    }
    this.emit();
  }

  setIndex(index: number): void {
    this._queueIndex = index;
    this.emit();
  }

  toggleShuffle(): void {
    this._isShuffled = !this._isShuffled;
    this.emit();
  }

  cycleRepeatMode(): void {
    this._repeatMode =
      this._repeatMode === 'none' ? 'all'
        : this._repeatMode === 'all' ? 'one'
          : 'none';
    this.emit();
  }

  /**
   * Append a track to the end of the queue.
   * Skips if the last track in the queue is the same track (duplicate-adjacent guard).
   */
  addToQueue(track: Song): void {
    if (this._queue.length > 0 && this._queue[this._queue.length - 1].id === track.id) return;
    this._queue = [...this._queue, track];
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

    let nextIdx: number;
    if (this._isShuffled) {
      // Pick a random index that isn't the current one
      if (this._queue.length <= 1) {
        nextIdx = 0;
      } else {
        do {
          nextIdx = Math.floor(Math.random() * this._queue.length);
        } while (nextIdx === this._queueIndex);
      }
    } else {
      nextIdx = this._queueIndex + 1;
    }

    if (nextIdx >= this._queue.length) {
      if (this._repeatMode === 'all') {
        // Loop back to start
        nextIdx = 0;
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


