import { Song } from '@/types/music';
import { PlayerState } from '@/types/player/controller';
import { gooeyToast as toast } from 'goey-toast';
import { AudioRouter } from '../AudioRouter';
import { TrackResolver } from '../TrackResolver';
import * as PlayerCache from '../cache';

export interface PlaybackCoordinatorDependencies {
  router: AudioRouter;
  resolver: TrackResolver;
  emit: (patch: Partial<PlayerState>) => void;
  stopRadio: () => void;
  getCurrentTrack: () => Song | null;
}

export class PlaybackCoordinator {
  private router: AudioRouter;
  private resolver: TrackResolver;
  private emit: (patch: Partial<PlayerState>) => void;
  private stopRadio: () => void;
  private getCurrentTrack: () => Song | null;

  constructor(deps: PlaybackCoordinatorDependencies) {
    this.router = deps.router;
    this.resolver = deps.resolver;
    this.emit = deps.emit;
    this.stopRadio = deps.stopRadio;
    this.getCurrentTrack = deps.getCurrentTrack;
  }

  public applyPreviewResult(audioUrl: string): void {
    this.emit({ isPreview: true, isResolving: false });
    this.router.setActive('html5');
    this.stopRadio();
    this.router.youtube.stop();
    this.router.html5.playSrc(audioUrl);
  }

  public async applyPreviewFallback(track: Song): Promise<void> {
    const result = await this.resolver.resolvePreview(track);

    if (this.getCurrentTrack()?.id !== track.id) return;

    if (result.type === 'preview' && result.audioUrl) {
      this.applyPreviewResult(result.audioUrl);
    } else {
      this.emit({ isResolving: false, isError: true });
      toast.error('Lagu tidak tersedia');
    }
  }

  public async playDesktop(track: Song): Promise<void> {
    const result = await this.resolver.resolveDesktop(
      track,
      () => this.getCurrentTrack()?.id ?? null
    );

    if (this.getCurrentTrack()?.id !== track.id) return;

    switch (result.type) {
      case 'youtube':
        if (result.videoId && this.router.youtube.isReady()) {
          this.router.setActive('youtube');
          this.router.youtube.loadVideo(result.videoId);
          this.emit({ isResolving: false });
        } else if (result.videoId) {
          // YT IFrame not ready — try HTML5 Audio stream for desktop
          console.warn('YT IFrame not ready, trying HTML5 Audio stream for desktop');
          const audioUrl = await this.resolver.fetchAudioStreamUrl(result.videoId);
          if (this.getCurrentTrack()?.id !== track.id) return;

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
        break;
    }
  }

  public async playMobile(track: Song): Promise<void> {
    const result = await this.resolver.resolveMobile(
      track,
      () => this.getCurrentTrack()?.id ?? null
    );

    if (this.getCurrentTrack()?.id !== track.id) return;

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

  public async handleYouTubeError(errorCode: number): Promise<void> {
    const activeTrack = this.getCurrentTrack();
    if (!activeTrack) {
      return;
    }

    // Invalidate the problematic videoId cache to force a fresh resolve next time
    PlayerCache.invalidate(activeTrack.id);

    // Embed-blocked codes → try re-resolve
    if (errorCode === 101 || errorCode === 150) {
      this.emit({ isResolving: true });

      const result = await this.resolver.resolveEmbedFallback(
        activeTrack,
        () => this.getCurrentTrack()?.id ?? null
      );

      if (this.getCurrentTrack()?.id !== activeTrack.id) return;

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
}
