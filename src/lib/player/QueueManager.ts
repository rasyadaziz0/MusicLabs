
import { Song } from '@/types/music';
import { AutoplayManager } from './queue/AutoplayManager';
import { QueueState, QueueManagerCallbacks, RepeatMode } from '@/types/player/queue';

// ─── Manager class ───

export class QueueManager {
  private _originalQueue: Song[] = [];  // preserves insertion order
  private _queue: Song[] = [];          // active queue (may be shuffled)
  private _queueIndex: number = -1;
  private _isShuffled: boolean = false;
  private _repeatMode: RepeatMode = 'none';
  private autoplayManager: AutoplayManager;
  private callbacks: QueueManagerCallbacks;

  constructor(callbacks: QueueManagerCallbacks) {
    this.callbacks = callbacks;
    this.autoplayManager = new AutoplayManager({
      onStateChange: () => this.emit(),
    });
  }

  // ── Getters ──

  get queue(): Song[] { return this._queue; }
  get queueIndex(): number { return this._queueIndex; }
  get isShuffled(): boolean { return this._isShuffled; }
  get repeatMode(): RepeatMode { return this._repeatMode; }
  get isAutoplayEnabled(): boolean { return this.autoplayManager.isEnabled; }

  // ── Internal emit ──

  private emit(): void {
    this.callbacks.onStateChange({
      queue: this._queue,
      queueIndex: this._queueIndex,
      isShuffled: this._isShuffled,
      repeatMode: this._repeatMode,
      isAutoplayEnabled: this.autoplayManager.isEnabled,
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
  private shuffleQueueKeepingCurrent(tracks: Song[], currentQueueItemId?: string): Song[] {
    if (tracks.length <= 1) return [...tracks];

    if (!currentQueueItemId) {
      return QueueManager.fisherYatesShuffle(tracks);
    }

    const currentTrack = tracks.find(t => t.queueItemId === currentQueueItemId);
    const rest = tracks.filter(t => t.queueItemId !== currentQueueItemId);
    const shuffledRest = QueueManager.fisherYatesShuffle(rest);

    return currentTrack ? [currentTrack, ...shuffledRest] : shuffledRest;
  }

  private assignQueueItemId(track: Song): Song {
    return track.queueItemId ? track : { ...track, queueItemId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) };
  }

  // ── Mutations ──

  setQueue(tracks: Song[], target?: number | string): void {
    const identifiedTracks = tracks.map(t => this.assignQueueItemId(t));
    this._originalQueue = [...identifiedTracks];

    let targetQueueItemId: string | undefined;
    if (typeof target === 'string') {
      targetQueueItemId = target;
    } else if (typeof target === 'number' && identifiedTracks[target]) {
      targetQueueItemId = identifiedTracks[target].queueItemId;
    }

    if (this._isShuffled) {
      this._queue = this.shuffleQueueKeepingCurrent(identifiedTracks, targetQueueItemId);
    } else {
      this._queue = [...identifiedTracks];
    }

    if (targetQueueItemId !== undefined) {
      const idx = this._queue.findIndex((s) => s.queueItemId === targetQueueItemId);
      this._queueIndex = idx !== -1 ? idx : 0;
    } else {
      this._queueIndex = this._queue.length > 0 ? 0 : -1;
    }
    this.emit();
  }

  setIndex(index: number): void {
    this._queueIndex = index;
    const currentTrack = this._queue[index];
    if (currentTrack && currentTrack.isAutoplay) {
      this.autoplayManager.markAsPlayed(currentTrack.id);
    }
    this.emit();
  }
  toggleShuffle(): void {
    this._isShuffled = !this._isShuffled;

    const currentTrack = this._queue[this._queueIndex];

    if (this._isShuffled) {
      // Shuffle: keep current track at current position (front of remaining)
      this._queue = this.shuffleQueueKeepingCurrent(this._originalQueue, currentTrack?.queueItemId);
      this._queueIndex = 0; // current track is at position 0
    } else {
      // Unshuffle: restore original order
      this._queue = [...this._originalQueue];
      if (currentTrack) {
        const restoredIndex = this._queue.findIndex(s => s.queueItemId === currentTrack.queueItemId);
        this._queueIndex = restoredIndex !== -1 ? restoredIndex : 0;
      }
    }

    this.emit();
  }

  shuffleAndPlay(tracks: Song[]): Song | null {
    if (tracks.length === 0) return null;

    const identifiedTracks = tracks.map(t => this.assignQueueItemId(t));
    this._originalQueue = [...identifiedTracks];
    this._isShuffled = true;
    this._queue = QueueManager.fisherYatesShuffle(identifiedTracks);
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

  toggleAutoplay(): void {
    this.autoplayManager.toggle();
  }

  clearQueue(): void {
    if (this._queueIndex >= 0) {
      const currentTrack = this._queue[this._queueIndex];
      this._queue = this._queue.slice(0, this._queueIndex + 1);

      if (currentTrack) {
        const origIdx = this._originalQueue.findIndex(t => t.queueItemId === currentTrack.queueItemId);
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
    
    // Find the first autoplay track to insert before it (so manual tracks stay together)
    const firstAutoplayIdx = this._queue.findIndex(t => t.isAutoplay);
    const trackToAdd = this.assignQueueItemId({ ...track, isAutoplay: false });
    if (firstAutoplayIdx !== -1) {
      this._queue = [
        ...this._queue.slice(0, firstAutoplayIdx),
        trackToAdd,
        ...this._queue.slice(firstAutoplayIdx)
      ];
    } else {
      this._queue = [...this._queue, trackToAdd];
    }
    
    // Also update original queue
    const origFirstAutoplayIdx = this._originalQueue.findIndex(t => t.isAutoplay);
    if (origFirstAutoplayIdx !== -1) {
      this._originalQueue = [
        ...this._originalQueue.slice(0, origFirstAutoplayIdx),
        trackToAdd,
        ...this._originalQueue.slice(origFirstAutoplayIdx)
      ];
    } else {
      this._originalQueue = [...this._originalQueue, trackToAdd];
    }

    this.emit();
  }

  removeFromQueue(trackId: string, queueItemId?: string): void {
    // If queueItemId is provided, use it for exact targeting. Otherwise fallback to first instance of trackId.
    const predicate = queueItemId 
      ? (t: Song) => t.queueItemId === queueItemId 
      : (t: Song) => t.id === trackId;
      
    const idx = this._queue.findIndex((t, i) => predicate(t) && i > this._queueIndex);
    if (idx !== -1) {
      const removed = this._queue.splice(idx, 1)[0];
      
      const origIdx = this._originalQueue.findIndex(t => t.queueItemId === removed.queueItemId);
      if (origIdx !== -1) {
        this._originalQueue.splice(origIdx, 1);
      }
      this.emit();
    }
  }

  promoteToManual(trackId: string, queueItemId?: string): void {
    const predicate = queueItemId 
      ? (t: Song) => t.queueItemId === queueItemId 
      : (t: Song) => t.id === trackId;

    const idx = this._queue.findIndex((t, i) => predicate(t) && i > this._queueIndex);
    if (idx !== -1) {
      this._queue[idx] = { ...this._queue[idx], isAutoplay: false };
      
      // Move it before other autoplay tracks
      const [track] = this._queue.splice(idx, 1);
      const firstAutoplayIdx = this._queue.findIndex(t => t.isAutoplay);
      if (firstAutoplayIdx !== -1) {
        this._queue.splice(firstAutoplayIdx, 0, track);
      } else {
        this._queue.push(track);
      }

      const origIdx = this._originalQueue.findIndex(t => t.queueItemId === track.queueItemId);
      if (origIdx !== -1) {
        this._originalQueue[origIdx] = { ...this._originalQueue[origIdx], isAutoplay: false };
      }
      this.emit();
    }
  }

  appendAutoplayTracks(tracks: Song[]): void {
    if (!tracks || tracks.length === 0) return;
    
    const existingIds = new Set(this._queue.map(t => t.id));
    const taggedNewTracks = this.autoplayManager.getTracksToAppend(tracks, existingIds).map(t => this.assignQueueItemId(t));

    if (taggedNewTracks.length === 0) return;

    // Append to the unshuffled tail (even if currently shuffled, they append at the end of _queue in order)
    this._queue = [...this._queue, ...taggedNewTracks];
    this._originalQueue = [...this._originalQueue, ...taggedNewTracks];
    this.emit();
  }

  appendTracks(tracks: Song[]): void {
    if (!tracks || tracks.length === 0) return;
    
    const existingIds = new Set(this._queue.map(t => t.id));
    const newTracks = tracks.filter(t => !existingIds.has(t.id));
    
    if (newTracks.length === 0) return;

    const taggedNewTracks = newTracks.map(t => this.assignQueueItemId({ ...t, isAutoplay: t.isAutoplay ?? true }));

    this._queue = [...this._queue, ...taggedNewTracks];
    this._originalQueue = [...this._originalQueue, ...taggedNewTracks];
    this.emit();
  }

  playNext(track: Song): void {
    if (this._queue.length === 0) {
      this.addToQueue(track);
      return;
    }

    const trackToAdd = this.assignQueueItemId({ ...track, isAutoplay: false });

    // Insert after current track in active queue
    const insertIdx = this._queueIndex >= 0 ? this._queueIndex + 1 : this._queue.length;
    this._queue = [
      ...this._queue.slice(0, insertIdx),
      trackToAdd,
      ...this._queue.slice(insertIdx)
    ];

    // Determine correct insertion point for original queue
    const currentTrack = this._queueIndex >= 0 ? this._queue[this._queueIndex] : null;
    let origInsertIdx = this._originalQueue.length;
    
    if (currentTrack) {
      const foundIdx = this._originalQueue.findIndex((t) => t.queueItemId === currentTrack.queueItemId);
      if (foundIdx !== -1) {
        origInsertIdx = foundIdx + 1;
      }
    }

    this._originalQueue = [
      ...this._originalQueue.slice(0, origInsertIdx),
      trackToAdd,
      ...this._originalQueue.slice(origInsertIdx)
    ];

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
          if (this._queue.length > 1 && this._queue[0].queueItemId === currentTrack?.queueItemId) {
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
