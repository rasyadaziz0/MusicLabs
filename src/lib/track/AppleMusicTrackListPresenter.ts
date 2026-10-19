import { Song } from '@/types/music';
import { ImageHelper } from '@/lib/utils/ImageHelper';
import { ArtistParser } from '@/lib/utils/ArtistParser';

export class AppleMusicTrackListPresenter {
  /**
   * Sums the total duration of an array of tracks in seconds.
   */
  public static calculateTotalDuration(tracks: Song[]): number {
    return tracks.reduce((acc, song) => acc + (song.duration || 0), 0);
  }

  /**
   * Formats a single track's duration in MM:SS format.
   */
  public static formatTrackDuration(durationInSeconds: number): string {
    const safeDuration = Math.max(0, Math.floor(durationInSeconds || 0));
    const mins = Math.floor(safeDuration / 60);
    const secs = safeDuration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formats summary string like "12 tracks, 45 minutes" or "12 tracks, 1 hours 10 minutes".
   */
  public static formatSummary(
    tracksCount: number,
    totalDurationInSeconds: number,
    t: (key: string) => string
  ): string {
    const totalMins = Math.floor(totalDurationInSeconds / 60);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    let timeStr: string;
    if (hours > 0) {
      timeStr = `${hours} ${t('tracklist.hours')} ${mins > 0 ? `${mins} ${t('tracklist.minutes')}` : ''}`.trim();
    } else {
      timeStr = `${mins} ${t('tracklist.minutes')}`;
    }

    return `${tracksCount} ${t('tracklist.songs_count')}, ${timeStr}`;
  }

  /**
   * Generates a stable unique identifier for list items and sortable context.
   */
  public static getTrackKey(song: Song, index: number): string {
    return song.uniqueId || `${song.id}-${index}`;
  }

  /**
   * Checks whether the track is currently playing.
   */
  public static isCurrentTrack(currentTrackId: string | undefined, songId: string): boolean {
    return Boolean(currentTrackId && currentTrackId === songId);
  }

  /**
   * Resolves the best available cover art URL.
   */
  public static getBestCoverUrl(song: Song): string | null {
    return ImageHelper.getBestImageUrl(song.image) ?? null;
  }

  /**
   * Resolves the canonical link for an artist.
   */
  public static getArtistLink(artist: Parameters<typeof ArtistParser.getArtistLink>[0]): string {
    return ArtistParser.getArtistLink(artist);
  }
}
