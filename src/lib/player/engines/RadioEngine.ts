
import Hls from 'hls.js';
import { Song } from '@/types/music';

// ─── Shared types ───

export interface RadioMeta {
  title: string;
  station: string;
}

// ─── Callback contract ───

export interface RadioEngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onMetaUpdate: (meta: RadioMeta) => void;
  onError?: (errorMsg: string) => void;
}

// ─── Engine class ───

export class RadioEngine {
  private audio: HTMLAudioElement | null = null;
  private metaInterval: NodeJS.Timeout | null = null;
  private callbacks: RadioEngineCallbacks;
  private _listeners?: {
    handlePlay: () => void;
    handlePause: () => void;
    handleError: () => void;
  };

  constructor(callbacks: RadioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  // ── Playback ──

  /**
   * Start playing a radio stream using plain HTML5 Audio + Icecast metadata polling.
   *
   * @param track       The radio Song (must have `radioStreamUrl`)
   * @param volume      Current volume level (0–1)
   * @param getCurrentTrackId  Returns the ID of the track the player currently considers
   *                           active — used to guard metadata updates against stale polls
   */
  play(
    track: Song,
    volume: number,
    getCurrentTrackId: () => string | null,
  ): void {
    const streamUrl = track.radioStreamUrl;
    if (!streamUrl) return;

    // Clean up any existing radio playback
    this.stop();

    this.callbacks.onMetaUpdate({
      title: 'Connecting...',
      station: track.name,
    });

    // Create a fresh audio element for this radio stream
    const audio = new Audio();
    audio.volume = volume;
    this.audio = audio;

    let hls: Hls | null = null;
    let hasFallenBack = false;

    const setupStream = (url: string) => {
      if (url.includes('.m3u8') && Hls.isSupported()) {
        hls = new Hls({
          startLevel: -1,
          debug: false,
        });
        hls.loadSource(url);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audio.play().catch(console.error);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          void event; // event name unused — only data.fatal matters
          if (data.fatal) {
            console.error('HLS error:', data);
            handleFallback();
          }
        });
      } else {
        // Native fallback (Safari supports HLS natively)
        audio.src = url;
        audio.play().catch(console.error);
      }
    };

    const handleFallback = () => {
      if (!hasFallenBack && streamUrl !== track.url && track.url) {
        hasFallenBack = true;
        console.log('Trying fallback URL:', track.url);
        if (hls) {
          hls.destroy();
          hls = null;
        }
        setupStream(track.url);
      } else {
        // Fallback exhausted or unavailable
        if (this.callbacks.onError) {
          this.callbacks.onError('Stream offline');
        }
      }
    };

    const handlePlay = () => this.callbacks.onPlay();
    const handlePause = () => this.callbacks.onPause();
    const handleError = () => {
      console.error('Radio stream error:', audio.src);
      if (audio.error) {
        console.error('Error code:', audio.error.code, 'Message:', audio.error.message);
      }
      handleFallback();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Save references so we can remove them later
    this._listeners = { handlePlay, handlePause, handleError };

    setupStream(streamUrl);

    // ── Metadata polling ──

    const pollMetadata = async () => {
      try {
        const res = await fetch(`/api/radio/metadata?url=${encodeURIComponent(streamUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title && getCurrentTrackId() === track.id) {
            this.callbacks.onMetaUpdate({
              title: data.title,
              station: track.name,
            });
          }
        }
      } catch {
        // Silently fail — metadata is best-effort
      }
    };

    // Poll immediately then every 15 s
    pollMetadata();
    this.metaInterval = setInterval(pollMetadata, 15000);
  }

  // ── Controls ──

  /** Stop any active radio stream playback & metadata polling */
  stop(): void {
    if (this.audio) {
      if (this._listeners) {
        const { handlePlay, handlePause, handleError } = this._listeners;
        this.audio.removeEventListener('play', handlePlay);
        this.audio.removeEventListener('playing', handlePlay);
        this.audio.removeEventListener('pause', handlePause);
        this.audio.removeEventListener('error', handleError);
      }
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    if (this.metaInterval) {
      clearInterval(this.metaInterval);
      this.metaInterval = null;
    }
  }

  pause(): void {
    if (this.audio) this.audio.pause();
  }

  resume(): void {
    if (this.audio) this.audio.play().catch(console.error);
  }

  setVolume(v: number): void {
    if (this.audio) this.audio.volume = v;
  }

  destroy(): void {
    this.stop();
  }
}