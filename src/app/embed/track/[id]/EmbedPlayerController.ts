import { YouTubePlayerInstance } from '../../_components/types';
export interface EmbedPlayerState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isLoading: boolean;
  error: string | null;
}

export interface EmbedPlayerControllerOptions {
  trackName: string;
  artistName: string;
  duration: number;
  isLoggedIn: boolean;
  previewUrl?: string;
  onStateChange: (state: Partial<EmbedPlayerState>) => void;
}

export class EmbedPlayerController {
  private ytPlayer: YouTubePlayerInstance | null = null;
  private nativeAudio: HTMLAudioElement | null = null;
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private emit: (state: Partial<EmbedPlayerState>) => void;
  private options: EmbedPlayerControllerOptions;

  public useNativePreview: boolean;
  private isDestroyed = false;

  constructor(options: EmbedPlayerControllerOptions) {
    this.options = options;
    this.emit = options.onStateChange;
    this.useNativePreview = !options.isLoggedIn && !!options.previewUrl;
    
    // Initial emit
    this.emit({
      isPlaying: false,
      currentTime: 0,
      totalDuration: this.useNativePreview ? 30 : (options.duration || 30),
      isLoading: true,
      error: (!options.isLoggedIn && !options.previewUrl) 
        ? 'Preview tidak tersedia untuk lagu ini. Silakan Masuk untuk mendengarkan.' 
        : null,
    });
  }

  public initialize() {
    if (this.useNativePreview && this.options.previewUrl) {
      this.initNativeAudio(this.options.previewUrl);
    } else if (this.options.isLoggedIn) {
      this.resolveAndInitYouTube();
    } else {
      this.emit({ isLoading: false });
    }
  }

  private initNativeAudio(previewUrl: string) {
    this.emit({ isLoading: false, totalDuration: 30 });
    const audio = new Audio(previewUrl);
    audio.preload = 'metadata';
    
    audio.addEventListener('timeupdate', () => {
      this.emit({ currentTime: audio.currentTime });
    });
    
    audio.addEventListener('ended', () => {
      this.emit({ isPlaying: false, currentTime: 0 });
      audio.currentTime = 0;
    });

    audio.addEventListener('waiting', () => this.emit({ isLoading: true }));
    audio.addEventListener('playing', () => this.emit({ isLoading: false }));
    audio.addEventListener('error', () => {
      this.emit({ error: 'Gagal memuat preview lagu.', isLoading: false, isPlaying: false });
    });

    this.nativeAudio = audio;
  }

  private async resolveAndInitYouTube() {
    try {
      const { trackName, artistName, duration } = this.options;
      const res = await fetch(
        `/api/audio/resolve?title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}${duration ? `&duration=${duration}` : ''}`
      );

      let videoId: string | null = null;
      if (!res.ok) {
        const fallbackRes = await fetch(
          `/api/audio/resolve?title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&fallback=1`
        );
        if (!fallbackRes.ok) throw new Error('Could not resolve track');
        const fallbackData = await fallbackRes.json();
        videoId = fallbackData.videoId;
      } else {
        const data = await res.json();
        videoId = data.videoId;
      }

      if (videoId && !this.isDestroyed) {
        this.loadYouTubeIframeAPI(videoId);
      }
    } catch {
      if (!this.isDestroyed) this.emit({ error: 'Unable to load this track' });
    }
  }

  private loadYouTubeIframeAPI(videoId: string) {
    if (window.YT?.Player) {
      this.createYTPlayer(videoId);
      return;
    }

    const existingScript = document.getElementById('yt-embed-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'yt-embed-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      if (!this.isDestroyed) this.createYTPlayer(videoId);
    };
  }

  private createYTPlayer(videoId: string) {
    if (this.isDestroyed) return;
    
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    this.ytPlayer = new window.YT.Player('embed-yt-player', {
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
        autoplay: 0, 
      },
      events: {
        onReady: () => {
          this.emit({ isLoading: false });
          if (this.ytPlayer) {
            const dur = this.ytPlayer.getDuration();
            if (dur > 0) this.emit({ totalDuration: dur });
          }
        },
        onStateChange: (event: { data: number }) => {
          if (event.data === 1) { // Playing
            this.emit({ isPlaying: true, isLoading: false });
            if (this.ytPlayer) {
              const dur = this.ytPlayer.getDuration();
              if (dur > 0) this.emit({ totalDuration: dur });
            }
            this.startYTProgressTimer();
          } else if (event.data === 2) { // Paused
            this.emit({ isPlaying: false });
            this.stopYTProgressTimer();
          } else if (event.data === 0) { // Ended
            this.emit({ isPlaying: false, currentTime: 0 });
            this.stopYTProgressTimer();
          } else if (event.data === 3) { // Buffering
            this.emit({ isLoading: true });
          }
        },
        onError: () => {
          this.emit({ error: 'Playback unavailable', isPlaying: false, isLoading: false });
        },
      },
    }) as unknown as YouTubePlayerInstance;
  }

  private startYTProgressTimer() {
    this.stopYTProgressTimer();
    this.timerRef = setInterval(() => {
      if (this.ytPlayer) {
        this.emit({ currentTime: this.ytPlayer.getCurrentTime() });
      }
    }, 250);
  }

  private stopYTProgressTimer() {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  public togglePlay(isPlaying: boolean) {
    if (this.useNativePreview && this.nativeAudio) {
      if (isPlaying) {
        this.nativeAudio.pause();
        this.emit({ isPlaying: false });
      } else {
        this.nativeAudio.play().catch(() => this.emit({ error: 'Autoplay blocked' }));
        this.emit({ isPlaying: true });
      }
      return;
    }

    if (!this.ytPlayer) return;
    if (isPlaying) {
      this.ytPlayer.pauseVideo();
    } else {
      this.emit({ isLoading: true });
      this.ytPlayer.playVideo();
    }
  }

  public seek(seekTime: number) {
    if (this.useNativePreview && this.nativeAudio) {
      this.nativeAudio.currentTime = seekTime;
      this.emit({ currentTime: seekTime });
      return;
    }

    if (this.ytPlayer) {
      this.ytPlayer.seekTo(seekTime, true);
      this.emit({ currentTime: seekTime });
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopYTProgressTimer();
    
    if (this.nativeAudio) {
      this.nativeAudio.pause();
      this.nativeAudio.src = '';
      this.nativeAudio = null;
    }

    if (this.ytPlayer?.destroy) {
      this.ytPlayer.destroy();
      this.ytPlayer = null;
    }
  }
}
