import { Song } from '@/types/music';
import { QueueManagerCallbacks, RepeatMode } from '@/types/player/queue';
import { AutoplayManager } from './queue/AutoplayManager';
import { QueueShuffleStrategy } from './queue/QueueShuffleStrategy';
import { QueueMutator, MutableQueueState } from './queue/QueueMutator';
import { QueueNavigator } from './queue/QueueNavigator';

// Re-export modular queue sub-components
export { AutoplayManager, QueueShuffleStrategy, QueueMutator, QueueNavigator };

/**
 * QueueManager
 * Facade coordinating queue mutations, shuffle algorithms, and navigation.
 */
export class QueueManager {
  private _originalQueue: Song[] = []; // Preserves insertion order
  private _queue: Song[] = []; // Active queue (may be shuffled)
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

  get queue(): Song[] {
    return this._queue;
  }
  get queueIndex(): number {
    return this._queueIndex;
  }
  get isShuffled(): boolean {
    return this._isShuffled;
  }
  get repeatMode(): RepeatMode {
    return this._repeatMode;
  }
  get isAutoplayEnabled(): boolean {
    return this.autoplayManager.isEnabled;
  }

  // ── Internal Helpers ──

  private emit(): void {
    this.callbacks.onStateChange({
      queue: this._queue,
      queueIndex: this._queueIndex,
      isShuffled: this._isShuffled,
      repeatMode: this._repeatMode,
      isAutoplayEnabled: this.autoplayManager.isEnabled,
    });
  }

  private getMutableState(): MutableQueueState {
    return {
      queue: this._queue,
      originalQueue: this._originalQueue,
      queueIndex: this._queueIndex,
    };
  }

  private syncFromMutableState(state: MutableQueueState): void {
    this._queue = state.queue;
    this._originalQueue = state.originalQueue;
    this._queueIndex = state.queueIndex;
  }

  // ── Initialization & Index Setting ──

  setQueue(tracks: Song[], target?: number | string): void {
    const identifiedTracks = tracks.map((t) => QueueShuffleStrategy.assignQueueItemId(t));
    this._originalQueue = [...identifiedTracks];

    let targetQueueItemId: string | undefined;
    if (typeof target === 'string') {
      targetQueueItemId = target;
    } else if (typeof target === 'number' && identifiedTracks[target]) {
      targetQueueItemId = identifiedTracks[target].queueItemId;
    }

    if (this._isShuffled) {
      this._queue = QueueShuffleStrategy.shuffleQueueKeepingCurrent(
        identifiedTracks,
        targetQueueItemId
      );
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

  // ── Shuffle & Repeat Modes ──

  toggleShuffle(): void {
    this._isShuffled = !this._isShuffled;
    const currentTrack = this._queue[this._queueIndex];

    if (this._isShuffled) {
      this._queue = QueueShuffleStrategy.shuffleQueueKeepingCurrent(
        this._originalQueue,
        currentTrack?.queueItemId
      );
      this._queueIndex = 0;
    } else {
      this._queue = [...this._originalQueue];
      this._queueIndex = QueueShuffleStrategy.restoreUnshuffledIndex(
        this._originalQueue,
        currentTrack?.queueItemId
      );
    }

    this.emit();
  }

  shuffleAndPlay(tracks: Song[]): Song | null {
    if (tracks.length === 0) return null;

    const identifiedTracks = tracks.map((t) => QueueShuffleStrategy.assignQueueItemId(t));
    this._originalQueue = [...identifiedTracks];
    this._isShuffled = true;
    this._queue = QueueShuffleStrategy.fisherYatesShuffle(identifiedTracks);
    this._queueIndex = 0;
    this.emit();

    return this._queue[0];
  }

  cycleRepeatMode(): void {
    this._repeatMode = QueueNavigator.cycleRepeatMode(this._repeatMode);
    this.emit();
  }

  toggleAutoplay(): void {
    this.autoplayManager.toggle();
  }

  // ── Queue Mutations ──

  clearQueue(): void {
    const state = this.getMutableState();
    QueueMutator.clearQueue(state);
    this.syncFromMutableState(state);
    this.emit();
  }

  addToQueue(track: Song): void {
    const state = this.getMutableState();
    if (QueueMutator.addToQueue(state, track)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  removeFromQueue(trackId: string, queueItemId?: string): void {
    const state = this.getMutableState();
    if (QueueMutator.removeFromQueue(state, trackId, queueItemId)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  promoteToManual(trackId: string, queueItemId?: string): void {
    const state = this.getMutableState();
    if (QueueMutator.promoteToManual(state, trackId, queueItemId)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  appendAutoplayTracks(tracks: Song[]): void {
    const state = this.getMutableState();
    if (QueueMutator.appendAutoplayTracks(state, tracks, this.autoplayManager)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  appendTracks(tracks: Song[]): void {
    const state = this.getMutableState();
    if (QueueMutator.appendTracks(state, tracks)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  playNext(track: Song): void {
    const state = this.getMutableState();
    QueueMutator.playNext(state, track);
    this.syncFromMutableState(state);
    this.emit();
  }

  reorderQueue(startIndex: number, endIndex: number): void {
    const state = this.getMutableState();
    if (QueueMutator.reorderQueue(state, startIndex, endIndex)) {
      this.syncFromMutableState(state);
      this.emit();
    }
  }

  // ── Navigation ──

  getNextIndex(): number | null {
    const result = QueueNavigator.getNextIndex({
      queue: this._queue,
      originalQueue: this._originalQueue,
      queueIndex: this._queueIndex,
      repeatMode: this._repeatMode,
      isShuffled: this._isShuffled,
    });

    if (result.reshuffledQueue) {
      this._queue = result.reshuffledQueue;
      this.emit();
    }

    return result.nextIndex;
  }

  getPrevIndex(): number {
    return QueueNavigator.getPrevIndex(this._queue.length, this._queueIndex);
  }
}
