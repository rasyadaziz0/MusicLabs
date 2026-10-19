import { Song } from '@/types/music';
import { PlayerState } from '@/types/player/controller';
import { AudioRouter } from '../AudioRouter';

export class RadioPlaybackHandler {
  constructor(
    private router: AudioRouter,
    private emit: (patch: Partial<PlayerState>) => void
  ) { }

  public stopRadio(): void {
    this.router.radio.stop();
    this.emit({ isRadio: false, radioMeta: null });
  }

  public playRadioStream(
    track: Song,
    volume: number,
    getCurrentTrackId: () => string | null
  ): void {
    this.router.html5.stop();
    this.router.youtube.stop();
    this.stopRadio();

    this.emit({
      isRadio: true,
      isPreview: false,
      isGuestPreview: false,
      isResolving: false,
    });

    this.router.setActive('radio');
    this.router.radio.play(track, volume, getCurrentTrackId);
  }
}
