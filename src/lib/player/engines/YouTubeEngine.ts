
// ─── YouTube IFrame types ───

export type YouTubePlayerEvent = {
  data: number;
};

export type YouTubePlayer = {
  getDuration: () => number;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  loadVideoById: (videoId: string) => void;
  stopVideo: () => void;
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player?: new (
        elementId: string,
        options: {
          height: string;
          width: string;
          videoId?: string;
          playerVars: Record<string, number | string>;
          events: {
            onReady?: (event: any) => void;
            onStateChange: (event: YouTubePlayerEvent) => void;
            onError: (event: YouTubePlayerEvent) => void;
          };
        }
      ) => YouTubePlayer;
    };
  }
}

// ─── Callback contract ───

export interface YouTubeEngineCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onDuration: (duration: number) => void;
  onError: (errorCode: number) => void;
}

// ─── Engine class ───

export class YouTubeEngine {
  private player: YouTubePlayer | null = null;
  private hasInitialized = false;
  private apiReady = false;
  private playerReady = false;
  private pendingVideoId: string | null = null;
  private prevReady: (() => void) | undefined;
  private callbacks: YouTubeEngineCallbacks;

  constructor(callbacks: YouTubeEngineCallbacks) {
    this.callbacks = callbacks;
  }

  // ── Lifecycle ──

  /** Load the YouTube IFrame API script and create the player */
  initialize(): void {
    if (window.YT?.Player) {
      this.apiReady = true;
      // Don't create player yet — wait until we have a real videoId via loadVideo()
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      this.prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof this.prevReady === 'function') this.prevReady();
        this.apiReady = true;
        // If loadVideo() was called before the API was ready, create now
        if (this.pendingVideoId) {
          this.createPlayer(this.pendingVideoId);
          this.pendingVideoId = null;
        }
      };
    }
  }

  /**
   * Create the YT.Player with a REAL videoId.
   * Never call this with an empty string — that produces a malformed
   * embed URL (/embed/?params) which causes cross-origin postMessage errors.
   */
  private createPlayer(videoId: string): void {
    if (this.hasInitialized || this.player || !window.YT?.Player) return;
    if (!videoId) return; // Guard: never create with empty videoId
    this.hasInitialized = true;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    this.player = new window.YT.Player('youtube-player-container', {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        origin,
        autoplay: 1,
      },
      events: {
        onReady: (event: any) => {
          this.playerReady = true;
          if (typeof event.target.playVideo === 'function') {
            event.target.playVideo();
          }
        },
        onStateChange: (event: YouTubePlayerEvent) => {
          // YT.PlayerState.PLAYING = 1
          if (event.data === 1) {
            this.callbacks.onPlay();
            if (this.player) {
              this.callbacks.onDuration(this.player.getDuration());
            }
          } else if (event.data === 2 || event.data === 0) {
            this.callbacks.onPause();
            if (event.data === 0) {
              // Song ended
              this.callbacks.onEnded();
            }
          }
        },
        onError: (event: YouTubePlayerEvent) => {
          this.callbacks.onError(event?.data);
        },
      },
    });
  }

  destroy(): void {
    if (this.player && typeof this.player.destroy === 'function') {
      this.player.destroy();
    }
    this.player = null;
    this.hasInitialized = false;
    this.playerReady = false;
    this.pendingVideoId = null;

    if (window.onYouTubeIframeAPIReady && this.prevReady) {
      window.onYouTubeIframeAPIReady = this.prevReady;
    }
  }

  // ── Playback controls ──

  loadVideo(videoId: string): void {
    if (!videoId) return;

    // First load: create the player with this videoId (lazy init)
    if (!this.player && !this.hasInitialized) {
      if (this.apiReady) {
        this.createPlayer(videoId);
      } else {
        // API script not loaded yet — queue for when it's ready
        this.pendingVideoId = videoId;
      }
      return;
    }

    // Subsequent loads: player already exists, just swap the video
    if (this.player && typeof this.player.loadVideoById === 'function') {
      this.player.loadVideoById(videoId);
      this.play();
    }
  }

  stop(): void {
    this.pendingVideoId = null;
    if (this.player && typeof this.player.stopVideo === 'function') {
      this.player.stopVideo();
    }
  }

  pause(): void {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  play(): void {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  seekTo(seconds: number, allowSeekAhead = true): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, allowSeekAhead);
    }
  }

  setVolume(volume: number): void {
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(volume * 100);
    }
  }

  // ── State queries ──

  getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      return this.player.getCurrentTime();
    }
    return 0;
  }

  getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      return this.player.getDuration();
    }
    return 0;
  }

  getPlayerState(): number {
    if (this.player && typeof this.player.getPlayerState === 'function') {
      return this.player.getPlayerState();
    }
    return -1;
  }

  isReady(): boolean {
    // Player is ready when onReady has fired (playerReady), OR the API is loaded
    // and we can lazy-create the player on next loadVideo() call
    return (
      (this.player !== null && this.playerReady && typeof this.player.loadVideoById === 'function') ||
      (this.apiReady && !this.hasInitialized)
    );
  }
}


