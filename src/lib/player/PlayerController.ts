import { Song } from '@/types/music';
import toast from 'react-hot-toast';
import { YouTubeEngine } from './engines/YouTubeEngine';
import { Html5Engine } from './engines/Html5Engine';
import { RadioEngine, RadioMeta } from './engines/RadioEngine';
import { AudioRouter } from './AudioRouter';
import { QueueManager } from './QueueManager';
import { SleepTimer } from './SleepTimer';
import { TrackResolver } from './TrackResolver';
import { PlayerCache } from './PlayerCache';
import { registerTimeGetter } from '@/hooks/useHighPrecisionTime';
import { recordRecentPlay } from '@/lib/supabase/music';

// ─── State shape (shared with context) ───

export type PlayerState = {
  currentTrack: Song | null;
  isPlaying: boolean;
  isResolving: boolean;
  isPreview: boolean;
  isGuestPreview: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  queueIndex: number;
  isRadio: boolean;
  radioMeta: RadioMeta | null;
  isError: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  sleepTimerEndTime: number | null;
};

export const INITIAL_STATE: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  isResolving: false,
  isPreview: false,
  isGuestPreview: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  queueIndex: -1,
  isRadio: false,
  radioMeta: null,
  isError: false,
  isShuffled: false,
  repeatMode: 'none',
  sleepTimerEndTime: null,
};

// ─── Options ───

export interface PlayerControllerOptions {
  /** Called when state changes. Receives a partial state to merge. */
  onStateChange: (patch: Partial<PlayerState>) => void;
}

// ─── Controller ───

export class PlayerController {
  private router: AudioRouter;
  private queueMgr: QueueManager;
  private sleepTimer: SleepTimer;
  private resolver: TrackResolver;

  private emit: (patch: Partial<PlayerState>) => void;

  // Internal state refs (not subject to React render cycles)
  private _currentTrack: Song | null = null;
  private _isPlaying = false;
  private _volume = 1;
  private _lastRecordedTrack: string | null = null;
  private _userId: string | null = null;
  private _isMobile = false;
  private _progressTimer: NodeJS.Timeout | null = null;

  constructor(options: PlayerControllerOptions) {
    this.emit = options.onStateChange;
    this.resolver = new TrackResolver();

    // ── YouTube Engine ──
    const ytEngine = new YouTubeEngine({
      onPlay: () => this.emit({ isPlaying: true }),
      onPause: () => this.emit({ isPlaying: false }),
      onDuration: (d) => this.emit({ duration: d }),
      onEnded: () => {
        if (this.queueMgr.repeatMode === 'one') {
          this.router.youtube.seekTo(0, true);
          this.router.youtube.play();
        } else {
          this.nextTrack();
        }
      },
      onError: (errorCode) => this.handleYouTubeError(errorCode),
    });

    // ── HTML5 Engine ──
    const html5Engine = new Html5Engine({
      onPlay: () => this.emit({ isPlaying: true }),
      onPause: () => this.emit({ isPlaying: false }),
      onEnded: () => this.nextTrack(),
    });

    // ── Radio Engine ──
    const radioEngine = new RadioEngine({
      onPlay: () => this.emit({ isPlaying: true }),
      onPause: () => this.emit({ isPlaying: false }),
      onMetaUpdate: (meta) => this.emit({ radioMeta: meta }),
      onError: (msg) => {
        this.emit({
          isPlaying: false,
          radioMeta: { title: msg, station: this._currentTrack?.name || 'Error' },
        });
      },
    });

    // ── Audio Router ──
    this.router = new AudioRouter(ytEngine, html5Engine, radioEngine);
    ytEngine.initialize();
    html5Engine.initialize(1);

    // ── High-precision time getter for karaoke ──
    registerTimeGetter(() => {
      const engine = this.router.activeEngine;
      if (engine === 'html5') return this.router.html5.getCurrentTime();
      if (engine === 'youtube') return this.router.youtube.getCurrentTime();
      return 0;
    });

    // ── Progress polling (50ms) ──
    this._progressTimer = setInterval(() => {
      const progress = this.router.pollProgress();
      const patch: Partial<PlayerState> = {};
      if (progress.currentTime !== undefined) patch.currentTime = progress.currentTime;
      if (progress.duration !== undefined) patch.duration = progress.duration;
      if (Object.keys(patch).length > 0) this.emit(patch);
    }, 50);

    // ── Queue Manager ──
    this.queueMgr = new QueueManager({
      onStateChange: (qs) => {
        this.emit({
          queue: qs.queue,
          queueIndex: qs.queueIndex,
          isShuffled: qs.isShuffled,
          repeatMode: qs.repeatMode,
        });
      },
    });

    // ── Sleep Timer ──
    this.sleepTimer = new SleepTimer({
      onTimeout: () => {
        this.router.togglePlay(true);
        this.emit({ isPlaying: false });
      },
      onStateChange: (s) => {
        this.emit({ sleepTimerEndTime: s.endTime });
      },
    });

    // ── Mobile detection ──
    if (typeof window !== 'undefined') {
      this._isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
    }
  }

  // ────────────────────────────────────────
  //  User / Auth
  // ────────────────────────────────────────

  setUserId(userId: string | null): void {
    this._userId = userId;
  }

  // ────────────────────────────────────────
  //  Playback
  // ────────────────────────────────────────

  async playTrack(track: Song, newQueue?: Song[]): Promise<void> {
    this.resolver.abort();

    if (newQueue) {
      this.queueMgr.setQueue(newQueue, track.id);
    }

    this.emit({
      currentTrack: track,
      isPreview: false,
      isGuestPreview: false,
      isError: false,
      currentTime: 0,
    });
    this._currentTrack = track;
    this.resolver.resetFallbackTrack();

    // Record recent play
    this.recordPlay(track);

    // ── Radio ──
    if (track.isRadio && track.radioStreamUrl) {
      this.playRadioStream(track);
      return;
    }

    this.stopRadio();

    // ── Guest (no user) → preview only ──
    if (!this._userId) {
      this.emit({ isResolving: true, isGuestPreview: true });
      await this.applyPreviewFallback(track);
      return;
    }

    this.emit({ isResolving: true });
    this.router.html5.stop();

    // ── Mobile path ──
    if (this._isMobile) {
      this.router.youtube.stop();
      await this.playMobile(track);
      return;
    }

    // ── Desktop path ──
    await this.playDesktop(track);
  }

  private async playDesktop(track: Song): Promise<void> {
    const result = await this.resolver.resolveDesktop(
      track,
      () => this._currentTrack?.id ?? null
    );

    if (this._currentTrack?.id !== track.id) return;

    switch (result.type) {
      case 'youtube':
        if (result.videoId && this.router.youtube.isReady()) {
          this.router.setActive('youtube');
          this.router.youtube.loadVideo(result.videoId);
          this.emit({ isResolving: false });
        } else if (result.videoId) {
          // YT IFrame not ready — try HTML5 audio stream
          console.warn('YT IFrame not ready, trying HTML5 Audio stream for desktop');
          const audioUrl = await this.resolver.fetchAudioStreamUrl(result.videoId);
          if (this._currentTrack?.id !== track.id) return;

          if (audioUrl) {
            this.router.setActive('html5');
            this.emit({ isPreview: false, isResolving: false });
            this.router.html5.playSrc(audioUrl);
          } else {
            await this.applyPreviewFallback(track);
          }
        } else {
          await this.applyPreviewFallback(track);
        }
        break;

      case 'preview':
        if (result.audioUrl) {
          this.applyPreviewResult(result.audioUrl);
        } else {
          this.emit({ isResolving: false, isError: true });
          toast.error('Lagu tidak tersedia');
        }
        break;

      default:
        // 'error' — aborted or failed
        break;
    }
  }

  private async playMobile(track: Song): Promise<void> {
    const result = await this.resolver.resolveMobile(
      track,
      () => this._currentTrack?.id ?? null
    );

    if (this._currentTrack?.id !== track.id) return;

    switch (result.type) {
      case 'html5':
        if (result.audioUrl) {
          this.router.setActive('html5');
          this.emit({ isPreview: false, isResolving: false });
          this.router.html5.playSrc(result.audioUrl);
        }
        break;

      case 'youtube':
        if (result.videoId && this.router.youtube.isReady()) {
          this.router.setActive('youtube');
          this.router.youtube.loadVideo(result.videoId);
          this.emit({ isResolving: false });
        } else {
          await this.applyPreviewFallback(track);
        }
        break;

      case 'preview':
        if (result.audioUrl) {
          this.applyPreviewResult(result.audioUrl);
        } else {
          this.emit({ isResolving: false, isError: true });
          toast.error('Lagu tidak tersedia');
        }
        break;

      default:
        break;
    }
  }

  // ────────────────────────────────────────
  //  Preview helpers
  // ────────────────────────────────────────

  private applyPreviewResult(audioUrl: string): void {
    this.emit({ isPreview: true, isResolving: false });
    this.router.setActive('html5');
    this.stopRadio();
    this.router.youtube.stop();
    this.router.html5.playSrc(audioUrl);
  }

  private async applyPreviewFallback(track: Song): Promise<void> {
    const result = await this.resolver.resolvePreview(track);

    if (this._currentTrack?.id !== track.id) return;

    if (result.type === 'preview' && result.audioUrl) {
      this.applyPreviewResult(result.audioUrl);
    } else {
      this.emit({ isResolving: false, isError: true });
      toast.error('Lagu tidak tersedia');
    }
  }

  // ────────────────────────────────────────
  //  YouTube error handler
  // ────────────────────────────────────────

  private async handleYouTubeError(errorCode: number): Promise<void> {
    const activeTrack = this._currentTrack;
    if (!activeTrack) {
      await this.applyPreviewFallback(activeTrack!);
      return;
    }

    // Embed-blocked codes → try re-resolve
    if (errorCode === 101 || errorCode === 150) {
      this.emit({ isResolving: true });

      const result = await this.resolver.resolveEmbedFallback(
        activeTrack,
        () => this._currentTrack?.id ?? null
      );

      if (this._currentTrack?.id !== activeTrack.id) return;

      switch (result.type) {
        case 'youtube':
          if (result.videoId) {
            this.router.youtube.loadVideo(result.videoId);
            this.emit({ isResolving: false });
            return;
          }
          break;
        case 'preview':
          if (result.audioUrl) {
            this.applyPreviewResult(result.audioUrl);
            return;
          }
          break;
        default:
          break;
      }
    }

    console.error('Player Error. Falling back to preview.', errorCode);
    await this.applyPreviewFallback(activeTrack);
  }

  // ────────────────────────────────────────
  //  Radio
  // ────────────────────────────────────────

  private stopRadio(): void {
    this.router.radio.stop();
    this.emit({ isRadio: false, radioMeta: null });
  }

  private playRadioStream(track: Song): void {
    this.router.html5.stop();
    this.router.youtube.stop();
    this.stopRadio();

    this.emit({ isRadio: true, isPreview: false, isGuestPreview: false, isResolving: false });
    this.router.setActive('radio');

    this.router.radio.play(
      track,
      this._volume,
      () => this._currentTrack?.id ?? null,
    );
  }

  // ────────────────────────────────────────
  //  Queue / Navigation
  // ────────────────────────────────────────

  nextTrack(): void {
    this.resolver.abort();

    if (this.queueMgr.queue.length === 0 || this.queueMgr.queueIndex === -1) return;

    if (this.queueMgr.repeatMode === 'one') {
      const engine = this.router.activeEngine;
      if (engine === 'html5') {
        this.router.html5.seekTo(0);
        this.router.html5.resume();
      }
      return;
    }

    const nextIdx = this.queueMgr.getNextIndex();

    if (nextIdx === null) {
      this.emit({ isPlaying: false });
      this.router.html5.pause();
      this.router.youtube.stop();
      return;
    }

    this.queueMgr.setIndex(nextIdx);
    this.playTrack(this.queueMgr.queue[nextIdx]);
  }

  prevTrack(): void {
    this.resolver.abort();
    if (this.queueMgr.queue.length === 0 || this.queueMgr.queueIndex === -1) return;

    const prevIdx = this.queueMgr.getPrevIndex();
    this.queueMgr.setIndex(prevIdx);
    this.playTrack(this.queueMgr.queue[prevIdx]);
  }

  togglePlay(): void {
    this.router.togglePlay(this._isPlaying);
  }

  seek(time: number): void {
    this.router.seek(time);
    this.emit({ currentTime: time });
  }

  setVolume(v: number): void {
    this._volume = v;
    this.emit({ volume: v });
    this.router.setVolume(v);
  }

  addToQueue(track: Song): void {
    this.queueMgr.addToQueue(track);
  }

  clearQueue(): void {
    this.queueMgr.clearQueue();
  }

  reorderQueue(startIndex: number, endIndex: number): void {
    this.queueMgr.reorderQueue(startIndex, endIndex);
  }


  shufflePlay(tracks: Song[]): void {
    if (tracks.length === 0) return;
    const firstTrack = this.queueMgr.shuffleAndPlay(tracks);
    if (firstTrack) this.playTrack(firstTrack);
  }

  toggleShuffle(): void {
    this.queueMgr.toggleShuffle();
  }

  cycleRepeatMode(): void {
    this.queueMgr.cycleRepeatMode();
  }

  // ────────────────────────────────────────
  //  Sleep Timer
  // ────────────────────────────────────────

  setSleepTimer(minutes: number): void {
    this.sleepTimer.start(minutes);
  }

  clearSleepTimer(): void {
    this.sleepTimer.stop();
  }

  // ────────────────────────────────────────
  //  State sync (called by React wrapper)
  // ────────────────────────────────────────

  /** Sync isPlaying from React state into the controller's internal ref */
  syncIsPlaying(isPlaying: boolean): void {
    this._isPlaying = isPlaying;
  }

  // ────────────────────────────────────────
  //  Listening history
  // ────────────────────────────────────────

  private recordPlay(track: Song): void {
    if (this._userId && this._lastRecordedTrack !== track.id) {
      this._lastRecordedTrack = track.id;
      recordRecentPlay(this._userId, track.id).catch(console.error);
    }
  }

  // ────────────────────────────────────────
  //  Lifecycle
  // ────────────────────────────────────────

  destroy(): void {
    if (this._progressTimer) clearInterval(this._progressTimer);
    this.resolver.abort();
    this.sleepTimer.destroy();
    this.router.destroy();
  }
}
