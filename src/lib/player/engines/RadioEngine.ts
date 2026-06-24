
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
  private hls: Hls | null = null;
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

    let hasFallenBack = false;

    const setupStream = (url: string, useProxy: boolean = false) => {
      const targetUrl = useProxy ? `/api/radio/proxy?url=${encodeURIComponent(url)}` : url;

      if (url.includes('.m3u8') && Hls.isSupported()) {
        const hlsInstance = new Hls({
          startLevel: -1,
          debug: false,
        });
        this.hls = hlsInstance;
        
        hlsInstance.loadSource(targetUrl);
        hlsInstance.attachMedia(audio);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          // Guard: Only play if this audio element is still the active one
          if (this.audio === audio) {
            audio.play().catch(console.error);
          }
        });
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (!hasFallenBack) {
              // On the first try, a fatal error (especially network) is almost certainly CORS.
              // We must fallback to the proxy immediately instead of trying to recover.
              console.warn('Initial HLS error (likely CORS), falling back to proxy...', data);
              handleFallback();
              return;
            }

            // On the fallback (proxied) stream, try to recover from temporary network/media errors
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS network error on proxy, trying to recover...', data);
                hlsInstance?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS media error on proxy, trying to recover...', data);
                hlsInstance?.recoverMediaError();
                break;
              default:
                console.error('HLS unrecoverable error:', data);
                handleFallback();
                break;
            }
          }
        });
      } else {
        // Native fallback (Safari supports HLS natively, plus normal Icecast streams)
        audio.src = targetUrl;
        // Guard: Only play if this audio element is still the active one
        if (this.audio === audio) {
          audio.play().catch(console.error);
        }
      }
    };

    const handleFallback = () => {
      if (!hasFallenBack) {
        hasFallenBack = true;
        console.debug('HLS failed. Trying fallback with CORS proxy for URL:', streamUrl);
        if (this.hls) {
          this.hls.destroy();
          this.hls = null;
        }
        setupStream(streamUrl, true);
      } else if (streamUrl !== track.url && track.url) {
        console.debug('Trying secondary fallback URL:', track.url);
        setupStream(track.url, true);
      } else {
        // Fallback exhausted or unavailable
        if (this.callbacks.onError) {
          this.callbacks.onError('Stream offline or blocked by CORS');
        }
      }
    };

    const handlePlay = () => this.callbacks.onPlay();
    const handlePause = () => this.callbacks.onPause();
    const handleError = () => {
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
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
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