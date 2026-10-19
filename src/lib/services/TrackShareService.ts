import { SlugHelper } from '@/lib/utils/SlugHelper';
import { Song } from '@/types/music';

export class TrackShareService {
  private static instance: TrackShareService;

  public static getInstance(): TrackShareService {
    if (!TrackShareService.instance) {
      TrackShareService.instance = new TrackShareService();
    }
    return TrackShareService.instance;
  }

  /**
   * Builds the canonical web permalink for a given track.
   */
  public buildTrackUrl(track: Song, origin?: string): string {
    const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
    const artistName = track.artists?.primary?.[0]?.name || 'unknown';
    return `${baseOrigin}${SlugHelper.buildTrackPath(artistName, track.name, track.id)}`;
  }

  /**
   * Invokes native Web Share API with fallback to system clipboard.
   */
  public async shareTrack(track: Song, origin?: string): Promise<boolean> {
    const trackUrl = this.buildTrackUrl(track, origin);
    const artists = track.artists?.primary?.map((a) => a.name).join(', ') || '';
    const payload = {
      title: track.name,
      text: artists ? `${artists} - ${track.name}` : track.name,
      url: trackUrl,
    };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(payload);
        return true;
      } catch (error: any) {
        if (error?.name === 'AbortError') return false;
        console.warn('[TrackShareService] navigator.share failed, falling back to clipboard:', error);
      }
    }

    return await this.copyToClipboard(trackUrl);
  }

  /**
   * Copies track permalink directly to clipboard.
   */
  public async copyTrackLink(track: Song, origin?: string): Promise<boolean> {
    const trackUrl = this.buildTrackUrl(track, origin);
    return await this.copyToClipboard(trackUrl);
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        const cb = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
        if (cb?.writeText) {
          await cb.writeText(text);
          return true;
        }
      }
    } catch (err) {
      console.error('[TrackShareService] Failed to copy to clipboard:', err);
    }
    return false;
  }
}
