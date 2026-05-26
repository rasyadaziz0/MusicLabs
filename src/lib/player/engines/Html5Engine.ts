
// ─── Callback contract ───

export interface Html5EngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

// ─── Engine class ───

export class Html5Engine {
  private audio: HTMLAudioElement | null = null;
  private callbacks: Html5EngineCallbacks;

  constructor(callbacks: Html5EngineCallbacks) {
    this.callbacks = callbacks;
  }

  // ── Lifecycle ──

  /** Create the Audio element and attach event listeners */
  initialize(volume: number): void {
    this.audio = new Audio();
    this.audio.volume = volume;

    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);
  }

  destroy(): void {
    if (!this.audio) return;
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('play', this.handlePlay);
    this.audio.removeEventListener('pause', this.handlePause);
    this.audio.pause();
    this.audio.src = '';
    this.audio = null;
  }

  // ── Event handlers (bound) ──

  private handleEnded = (): void => { this.callbacks.onEnded(); };
  private handlePlay = (): void => { this.callbacks.onPlay(); };
  private handlePause = (): void => { this.callbacks.onPause(); };

  // ── Playback controls ──

  /** Set a new source URL and start playing */
  playSrc(src: string): void {
    if (!this.audio) return;
    this.audio.src = src;
    this.audio.play().catch(console.error);
  }

  resume(): void {
    if (!this.audio) return;
    this.audio.play().catch(console.error);
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  /** Pause and clear the source */
  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.src = '';
  }

  seekTo(time: number): void {
    if (!this.audio) return;
    this.audio.currentTime = time;
  }

  setVolume(v: number): void {
    if (this.audio) this.audio.volume = v;
  }

  // ── State queries ──

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    const d = this.audio?.duration;
    return (d && isFinite(d)) ? d : 0;
  }

  isPaused(): boolean {
    return this.audio?.paused ?? true;
  }
}


