import { Song } from '@/types/music';

export interface AutoplayManagerCallbacks {
  onStateChange: (isEnabled: boolean) => void;
}

export class AutoplayManager {
  private _isEnabled: boolean = true;
  private _recentlyPlayed: string[] = [];
  private callbacks: AutoplayManagerCallbacks;

  constructor(callbacks: AutoplayManagerCallbacks) {
    this.callbacks = callbacks;
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  toggle(): void {
    this._isEnabled = !this._isEnabled;
    this.callbacks.onStateChange(this._isEnabled);
  }

  markAsPlayed(trackId: string): void {
    if (!this._recentlyPlayed.includes(trackId)) {
      this._recentlyPlayed.push(trackId);
      if (this._recentlyPlayed.length > 50) {
        this._recentlyPlayed.shift(); // Cap history to 50
      }
    }
  }

  /**
   * Filters out tracks that are already in the queue or have been recently played.
   * Returns a new array of tracks tagged with `isAutoplay: true`.
   */
  getTracksToAppend(candidateTracks: Song[], existingQueueIds: Set<string>): Song[] {
    if (!candidateTracks || candidateTracks.length === 0) return [];

    const recentSet = new Set(this._recentlyPlayed);

    const newTracks = candidateTracks.filter(
      (t) => !existingQueueIds.has(t.id) && !recentSet.has(t.id)
    );

    return newTracks.map((t) => ({ ...t, isAutoplay: true }));
  }
}
