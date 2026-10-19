import { registerTimeGetter } from '@/hooks/useHighPrecisionTime';
import { Song } from '@/types/music';
import { PlayerControllerOptions, PlayerState } from '@/types/player/controller';
import { AudioRouter } from './AudioRouter';
import { QueueManager } from './QueueManager';
import { SleepTimer } from './SleepTimer';
import { TrackResolver } from './TrackResolver';
import * as PlayerCache from './cache';
import { Html5Engine } from './engines/Html5Engine';
import { RadioEngine } from './engines/RadioEngine';
import { YouTubeEngine } from './engines/YouTubeEngine';
import { PlaybackCoordinator } from './playback/PlaybackCoordinator';
import { RadioPlaybackHandler } from './playback/RadioPlaybackHandler';
import { PlaybackHistoryRecorder } from './playback/PlaybackHistoryRecorder';

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
  isAutoplayEnabled: false,
};

// Re-export modular player sub-components
export {
  PlaybackCoordinator,
  RadioPlaybackHandler,
  PlaybackHistoryRecorder,
  QueueManager,
  AudioRouter,
  SleepTimer,
  TrackResolver,
};

export class PlayerController {
  private router: AudioRouter;
  private queueMgr: QueueManager;
  private sleepTimer: SleepTimer;
  private resolver: TrackResolver;
  private coordinator: PlaybackCoordinator;
  private radioHandler: RadioPlaybackHandler;
  private historyRecorder: PlaybackHistoryRecorder;

  private emit: (patch: Partial<PlayerState>) => void;

  // Internal state refs (not subject to React render cycles)
  private _currentTrack: Song | null = null;
  private _isPlaying = false;
  private _volume = 1;
  private _isMobile = false;
  private _progressTimer: NodeJS.Timeout | null = null;

  constructor(options: PlayerControllerOptions) {
    this.emit = options.onStateChange;
    this.resolver = new TrackResolver();
    this.historyRecorder = new PlaybackHistoryRecorder();

    // Cleanup old player caches
    PlayerCache.cleanupOldVersions();

    // ── Engine Setup ──
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
      onError: (errorCode) => this.coordinator.handleYouTubeError(errorCode),
    });

    const html5Engine = new Html5Engine({
      onPlay: () => this.emit({ isPlaying: true }),
      onPause: () => this.emit({ isPlaying: false }),
      onEnded: () => this.nextTrack(),
    });

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

    this.router = new AudioRouter(ytEngine, html5Engine, radioEngine);
    ytEngine.initialize();
    html5Engine.initialize(1);

    // ── Sub-handlers ──
    this.radioHandler = new RadioPlaybackHandler(this.router, this.emit);
    this.coordinator = new PlaybackCoordinator({
      router: this.router,
      resolver: this.resolver,
      emit: this.emit,
      stopRadio: () => this.radioHandler.stopRadio(),
      getCurrentTrack: () => this._currentTrack,
    });

    // ── High-precision time getter for karaoke ──
    registerTimeGetter(() => {
      const engine = this.router.activeEngine;
      if (engine === 'html5') return this.router.html5.getCurrentTime();
      if (engine === 'youtube') return this.router.youtube.getCurrentTime();
      return 0;
    });

    // ── Progress polling (50ms) ──
    this._progressTimer = setInterval(() => {
      this.sleepTimer?.tick();
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
          isAutoplayEnabled: qs.isAutoplayEnabled,
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

  setUserId(userId: string | null): void {
    this.historyRecorder.setUserId(userId);
  }

  async playTrack(track: Song, newQueue?: Song[], target?: number | string): Promise<void> {
    this.router.html5.unlock();
    this.resolver.abort();

    if (newQueue) {
      this.queueMgr.setQueue(newQueue, target);
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

    // Record listening history
    this.historyRecorder.recordPlay(track);

    // Live Radio stream
    if (track.isRadio && track.radioStreamUrl) {
      this.radioHandler.playRadioStream(
        track,
        this._volume,
        () => this._currentTrack?.id ?? null
      );
      return;
    }

    this.radioHandler.stopRadio();

    // Guest preview only (unauthenticated users)
    if (!this.historyRecorder.getUserId()) {
      this.emit({ isResolving: true, isGuestPreview: true });
      await this.coordinator.applyPreviewFallback(track);
      return;
    }

    this.emit({ isResolving: true });
    this.router.html5.stop();

    if (this._isMobile) {
      this.router.youtube.stop();
      await this.coordinator.playMobile(track);
    } else {
      await this.coordinator.playDesktop(track);
    }
  }

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

  playNext(track: Song): void {
    this.queueMgr.playNext(track);
  }

  removeFromQueue(trackId: string): void {
    this.queueMgr.removeFromQueue(trackId);
  }

  promoteToManual(trackId: string): void {
    this.queueMgr.promoteToManual(trackId);
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

  toggleAutoplay(): void {
    this.queueMgr.toggleAutoplay();
  }

  setSleepTimer(minutes: number): void {
    this.sleepTimer.start(minutes);
  }

  clearSleepTimer(): void {
    this.sleepTimer.stop();
  }

  syncIsPlaying(isPlaying: boolean): void {
    this._isPlaying = isPlaying;
  }

  destroy(): void {
    if (this._progressTimer) clearInterval(this._progressTimer);
    this.resolver.abort();
    this.sleepTimer.destroy();
    this.router.destroy();
  }
}
