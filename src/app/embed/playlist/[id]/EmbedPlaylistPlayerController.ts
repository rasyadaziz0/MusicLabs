import { YouTubePlayerInstance, EmbedPlaylistTrack } from '../../_components/types';
export interface EmbedPlaylistPlayerState {
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isLoading: boolean;
  error: string | null;
  useNativePreview: boolean; // True if using iTunes preview
  currentTrack: EmbedPlaylistTrack | null;
}

export interface EmbedPlaylistPlayerControllerOptions {
  tracks: EmbedPlaylistTrack[];
  isLoggedIn: boolean;
  onStateChange: (state: Partial<EmbedPlaylistPlayerState>) => void;
}

export class EmbedPlaylistPlayerController {
  private ytPlayer: YouTubePlayerInstance | null = null;
  private nativeAudio: HTMLAudioElement | null = null;
  private timerRef: ReturnType<typeof setInterval> | null = null;
  
  private tracks: EmbedPlaylistTrack[];
  private isLoggedIn: boolean;
  private emit: (state: Partial<EmbedPlaylistPlayerState>) => void;
  
  private isDestroyed = false;
  private currentIndex = 0;
  private isPlaying = false;
  private ytReady = false;

  constructor(options: EmbedPlaylistPlayerControllerOptions) {
    this.tracks = options.tracks;
    this.isLoggedIn = options.isLoggedIn;
    this.emit = (patch) => {
      if (patch.currentIndex !== undefined) this.currentIndex = patch.currentIndex;
      if (patch.isPlaying !== undefined) this.isPlaying = patch.isPlaying;
      options.onStateChange(patch);
    };

    this.emit({
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      totalDuration: 0,
      isLoading: false,
      error: null,
      useNativePreview: !this.isLoggedIn,
      currentTrack: this.tracks[0] || null,
    });
  }

  public initialize() {
    if (this.isLoggedIn) {
      this.loadYouTubeIframeAPI();
    }
    // We don't auto-resolve the first track until the user clicks play, 
    // BUT to show duration, we might want to resolve immediately.
    // Actually, we can just show the duration from the track object!
    if (this.tracks[0]) {
      this.emit({ totalDuration: !this.isLoggedIn ? 30 : this.tracks[0].duration || 0 });
    }
  }

  private loadYouTubeIframeAPI() {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) {
      this.ytReady = true;
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
      if (!this.isDestroyed) {
        this.ytReady = true;
      }
    };
  }

  public togglePlay(isPlayingNow: boolean) {
    if (isPlayingNow) {
      this.pause();
    } else {
      this.play();
    }
  }

  private async play() {
    this.emit({ isLoading: true, error: null });
    const track = this.tracks[this.currentIndex];
    if (!track) return;

    if (!this.isLoggedIn) {
      await this.playNativePreview(track);
    } else {
      await this.playYouTube(track);
    }
  }

  private pause() {
    if (!this.isLoggedIn && this.nativeAudio) {
      this.nativeAudio.pause();
      this.emit({ isPlaying: false });
    } else if (this.ytPlayer) {
      this.ytPlayer.pauseVideo();
      this.emit({ isPlaying: false });
    }
  }

  private async playNativePreview(track: EmbedPlaylistTrack) {
    try {
      // 1. Resolve preview URL
      const res = await fetch(`/api/preview?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artistName)}`);
      if (!res.ok || this.isDestroyed) throw new Error('Preview failed');
      const data = await res.json();
      
      if (!data.previewUrl) {
        this.emit({ error: 'Preview tidak tersedia untuk lagu ini. Silakan Masuk untuk mendengarkan.', isLoading: false });
        return;
      }

      // 2. Play Audio
      this.emit({ totalDuration: 30 });
      
      if (!this.nativeAudio) {
        this.nativeAudio = new Audio();
        this.nativeAudio.preload = 'metadata';
        
        this.nativeAudio.addEventListener('timeupdate', () => {
          if (this.nativeAudio) this.emit({ currentTime: this.nativeAudio.currentTime });
        });
        
        this.nativeAudio.addEventListener('ended', () => {
          this.emit({ isPlaying: false, currentTime: 0 });
          this.handleNext();
        });

        this.nativeAudio.addEventListener('waiting', () => this.emit({ isLoading: true }));
        this.nativeAudio.addEventListener('playing', () => this.emit({ isLoading: false, isPlaying: true }));
        this.nativeAudio.addEventListener('error', () => {
          this.emit({ error: 'Gagal memuat preview lagu.', isLoading: false, isPlaying: false });
        });
      }

      this.nativeAudio.src = data.previewUrl;
      this.nativeAudio.play().catch(() => this.emit({ error: 'Autoplay diblokir browser', isLoading: false }));

    } catch (e) {
      if (!this.isDestroyed) this.emit({ error: 'Unable to load preview', isLoading: false });
    }
  }

  private async playYouTube(track: EmbedPlaylistTrack) {
    if (!this.ytReady) {
      // Wait a bit if not ready
      setTimeout(() => { if (!this.isDestroyed) this.playYouTube(track); }, 500);
      return;
    }

    try {
      const res = await fetch(
        `/api/audio/resolve?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artistName)}${track.duration ? `&duration=${track.duration}` : ''}`
      );

      let videoId: string | null = null;
      if (!res.ok) {
        const fallbackRes = await fetch(
          `/api/audio/resolve?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artistName)}&fallback=1`
        );
        if (!fallbackRes.ok) throw new Error('Could not resolve');
        const fallbackData = await fallbackRes.json();
        videoId = fallbackData.videoId;
      } else {
        const data = await res.json();
        videoId = data.videoId;
      }

      if (this.isDestroyed || !videoId) return;

      if (!this.ytPlayer) {
        this.createYTPlayer(videoId);
      } else {
        this.ytPlayer.loadVideoById(videoId);
        this.emit({ isLoading: false }); // Will auto-play due to loadVideoById
      }
    } catch {
      if (!this.isDestroyed) this.emit({ error: 'Unable to load track', isLoading: false });
    }
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
        autoplay: 1,
      },
      events: {
        onReady: () => {
          this.emit({ isLoading: false });
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
            this.handleNext();
          } else if (event.data === 3) { // Buffering
            this.emit({ isLoading: true });
          }
        },
        onError: () => {
          this.emit({ error: 'Playback unavailable', isPlaying: false, isLoading: false });
          setTimeout(() => this.handleNext(), 2000); // Skip on error
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

  public handleNext() {
    if (this.tracks.length === 0) return;
    let nextIdx = this.currentIndex + 1;
    if (nextIdx >= this.tracks.length) nextIdx = 0; // Loop back
    
    this.setTrackIndex(nextIdx);
  }

  public handlePrev() {
    if (this.tracks.length === 0) return;
    
    // If playing for more than 3 seconds, just restart track
    if (this.isPlaying) {
      const currentT = !this.isLoggedIn && this.nativeAudio ? this.nativeAudio.currentTime : (this.ytPlayer?.getCurrentTime() || 0);
      if (currentT > 3) {
        this.seek(0);
        return;
      }
    }

    let prevIdx = this.currentIndex - 1;
    if (prevIdx < 0) prevIdx = 0;
    
    this.setTrackIndex(prevIdx);
  }

  public setTrackIndex(index: number) {
    if (index < 0 || index >= this.tracks.length) return;
    
    // Stop current
    if (this.nativeAudio) this.nativeAudio.pause();
    if (this.ytPlayer) this.ytPlayer.pauseVideo();
    
    this.emit({
      currentIndex: index,
      currentTrack: this.tracks[index],
      currentTime: 0,
      totalDuration: !this.isLoggedIn ? 30 : (this.tracks[index].duration || 0),
      error: null
    });
    
    this.play(); // Auto-play when switching
  }

  public seek(seekTime: number) {
    if (!this.isLoggedIn && this.nativeAudio) {
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
