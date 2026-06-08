
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
      const currentTrack = this._queue[this._queueIndex];
      this._queue = this._queue.slice(0, this._queueIndex + 1);

      if (currentTrack) {
        const origIdx = this._originalQueue.findIndex(t => t.id === currentTrack.id);
        if (origIdx !== -1) {
          this._originalQueue = this._originalQueue.slice(0, origIdx + 1);
        }
      }
    } else {
      this._queue = [];
      this._originalQueue = [];
      this._queueIndex = -1;
    }
    this.emit();
  }
  addToQueue(track: Song): void {
    if (this._queue.length > 0 && this._queue[this._queue.length - 1].id === track.id) return;
    this._queue = [...this._queue, track];
    this._originalQueue = [...this._originalQueue, track];
    this.emit();
  }

  reorderQueue(startIndex: number, endIndex: number): void {
    if (
      startIndex < 0 || startIndex >= this._queue.length ||
      endIndex < 0 || endIndex >= this._queue.length ||
      startIndex === endIndex
    ) {
      return;
    }

    const newQueue = [...this._queue];
    const [moved] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, moved);
    this._queue = newQueue;

    if (startIndex === this._queueIndex) {
      this._queueIndex = endIndex;
    } else if (startIndex < this._queueIndex && endIndex >= this._queueIndex) {
      this._queueIndex--;
    } else if (startIndex > this._queueIndex && endIndex <= this._queueIndex) {
      this._queueIndex++;
    }

    this.emit();
  }

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
