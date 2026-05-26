
import { YouTubeEngine } from './engines/YouTubeEngine';
import { Html5Engine } from './engines/Html5Engine';
import { RadioEngine } from './engines/RadioEngine';

// ─── Types ───

export type ActiveEngine = 'youtube' | 'html5' | 'radio' | 'none';

// ─── Router class ───

export class AudioRouter {
  private _activeEngine: ActiveEngine = 'none';

  readonly youtube: YouTubeEngine;
  readonly html5: Html5Engine;
  readonly radio: RadioEngine;

  constructor(youtube: YouTubeEngine, html5: Html5Engine, radio: RadioEngine) {
    this.youtube = youtube;
    this.html5 = html5;
    this.radio = radio;
  }

  // ── Active engine ──

  get activeEngine(): ActiveEngine { return this._activeEngine; }

  setActive(engine: ActiveEngine): void {
    this._activeEngine = engine;
  }

  // ── Dispatched controls ──

  /** Toggle play / pause on the currently active engine */
  togglePlay(isPlaying: boolean): void {
    const engine = this._activeEngine;
    if (engine === 'radio') {
      if (isPlaying) this.radio.pause();
      else this.radio.resume();
    } else if (engine === 'html5') {
      if (isPlaying) this.html5.pause();
      else this.html5.resume();
    } else if (engine === 'youtube') {
      const state = this.youtube.getPlayerState();
      if (state === 1) this.youtube.pause();
      else this.youtube.play();
    }
  }

  /** Seek to a specific time (no-op for radio) */
  seek(time: number): void {
    const engine = this._activeEngine;
    if (engine === 'radio') return;
    if (engine === 'html5') {
      this.html5.seekTo(time);
    } else if (engine === 'youtube') {
      this.youtube.seekTo(time);
    }
  }

  /** Set volume across all engines */
  setVolume(v: number): void {
    this.html5.setVolume(v);
    this.radio.setVolume(v);
    this.youtube.setVolume(v);
  }

  // ── Progress polling ──

  /**
   * Poll current playback progress from the engines.
   *
   * Mirrors the original 50 ms timer: checks YouTube first, then HTML5.
   * If both are active HTML5 overwrites — this matches the original behaviour.
   */
  pollProgress(): { currentTime?: number; duration?: number } {
    const result: { currentTime?: number; duration?: number } = {};

    // Check YouTube engine
    const ytState = this.youtube.getPlayerState();
    if (ytState === 1) { // Playing
      result.currentTime = this.youtube.getCurrentTime();
    }

    // Check HTML5 engine (may overwrite YT value — matches original behavior)
    if (!this.html5.isPaused()) {
      result.currentTime = this.html5.getCurrentTime();
      const d = this.html5.getDuration();
      if (d > 0) result.duration = d;
    }

    return result;
  }

  // ── Teardown ──

  destroy(): void {
    this.youtube.destroy();
    this.html5.destroy();
    this.radio.destroy();
    this._activeEngine = 'none';
  }
}


