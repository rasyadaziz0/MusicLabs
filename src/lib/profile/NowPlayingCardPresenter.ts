import { PresenceData } from '@/types/components/profile/PresenceData';

export class NowPlayingCardPresenter {
  public static readonly STALE_THRESHOLD_MS = 5 * 60 * 1000;

  /**
   * Evaluates if presence data is fresh (updated within the last 5 minutes).
   */
  public static isPresenceFresh(updatedAt?: string | null): boolean {
    if (!updatedAt) return false;
    const time = new Date(updatedAt).getTime();
    if (isNaN(time)) return false;
    return Date.now() - time < this.STALE_THRESHOLD_MS;
  }

  /**
   * Calculates anchor position for the track context menu.
   */
  public static calculateMenuPosition(
    buttonRect?: DOMRect | null,
    fallbackClickPos?: { x: number; y: number } | null
  ): { x: number; y: number } | null {
    if (buttonRect) {
      return { x: buttonRect.left, y: buttonRect.bottom + 8 };
    }
    if (fallbackClickPos) {
      return fallbackClickPos;
    }
    return null;
  }

  public static hasActiveTrack(presence: PresenceData | null): boolean {
    return Boolean(presence?.track_id && this.isPresenceFresh(presence.updated_at));
  }

  public static getTrackName(presence: PresenceData | null): string {
    return presence?.track_name || '';
  }

  public static getArtistName(presence: PresenceData | null): string {
    return presence?.artist_name || '';
  }

  public static getCoverUrl(presence: PresenceData | null): string | null {
    return presence?.cover_url || null;
  }
}
