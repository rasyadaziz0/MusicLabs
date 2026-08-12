import { API_BASE } from '@/lib/config';
import { ArtistParser } from '@/lib/utils/ArtistParser';
import { ImageHelper } from '@/lib/utils/ImageHelper';
import { SlugHelper } from '@/lib/utils/SlugHelper';
import { Song } from '@/types/music';
import { ParsedTrackSlug, TrackSEOData } from '@/types/services/track';

export class TrackPageResolverService {
  private static instance: TrackPageResolverService;
  private readonly loggerPrefix = '[TrackPageResolverService]';

  private constructor() { }

  /** Singleton instance accessor */
  public static getInstance(): TrackPageResolverService {
    if (!TrackPageResolverService.instance) {
      TrackPageResolverService.instance = new TrackPageResolverService();
    }
    return TrackPageResolverService.instance;
  }

  public isYouTubeVideoId(id: string): boolean {
    return /^[A-Za-z0-9_-]{11}$/.test(id);
  }

  /**
   * Format duration from total seconds to mm:ss string (e.g. 3:52)
   */
  public formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * ISO 8601 duration string generator for JSON-LD structured data (e.g. PT3M52S)
   */
  public toISO8601Duration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `PT${m}M${s}S`;
  }

  /**
   * Parse 3-segment URL slug: [artistSlug, titleSlug, cleanId]
   * Example: /musik/napking-kaira-shashia/aku-kamu/1736547535
   */
  public parseSlug(slug: string[]): ParsedTrackSlug | null {
    if (!slug || slug.length < 3) {
      console.debug(`${this.loggerPrefix} Invalid slug segments length: ${slug?.length || 0}`);
      return null;
    }
    const cleanId = slug[slug.length - 1];
    if (!cleanId) {
      console.debug(`${this.loggerPrefix} Missing cleanId in slug segment`);
      return null;
    }
    const trackId = SlugHelper.restoreTrackId(cleanId);
    return { cleanId, trackId };
  }

  /**
   * Resolve a Song object by its track ID using multi-provider fallback.
   * Strategy:
   * 1. Check if ID matches YouTube Music (11 chars) -> Query YTM Client
   * 2. If YTM misses or ID is non-YTM -> Fallback to iTunes API
   */
  public async resolveTrack(trackId: string): Promise<Song | null> {
    console.debug(`${this.loggerPrefix} Starting resolution for trackId: "${trackId}"`);
    try {
      const baseUrl = API_BASE || 'http://localhost:3001';
      const cleanId = trackId.replace(/^itunes-/, '');
      const res = await fetch(`${baseUrl}/api/tracks/${cleanId}`, { next: { revalidate: 3600 } });
      if (!res.ok) {
        console.debug(`${this.loggerPrefix} Backend returned error for "${trackId}"`);
        return null;
      }
      const json = await res.json();
      return json.data as Song;
    } catch (err: any) {
      console.warn(`${this.loggerPrefix} Resolution error for "${trackId}":`, err?.message || err);
      return null;
    }
  }

  public async getMoreByArtist(track: Song, artistName: string): Promise<Song[]> {
    const artistId = track.artists?.primary?.[0]?.id || '';
    const baseUrl = API_BASE || 'http://localhost:3001';
    console.debug(`${this.loggerPrefix} Discovering more tracks for artist: "${artistName}" (artistId: "${artistId}")`);

    try {
      const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
      if (cleanId && !ArtistParser.isSearchBasedId(artistId)) {
        const res = await fetch(`${baseUrl}/api/artists/${cleanId}/top?limit=20`, { next: { revalidate: 3600 } });
        if (res.ok) {
          const json = await res.json();
          const tracks = json.data?.songs || [];
          const filtered = tracks.filter((t: Song) => t.id !== track.id);
          if (filtered.length > 0) return filtered;
        }
      }

      // Fallback: search by artist name
      const res = await fetch(`${baseUrl}/api/search/songs?query=${encodeURIComponent(artistName)}&limit=20`, { next: { revalidate: 3600 } });
      if (res.ok) {
        const json = await res.json();
        const tracks = json.data || [];
        const filtered = tracks.filter((t: Song) => t.id !== track.id).slice(0, 15);
        return filtered;
      }
    } catch (err: any) {
      console.warn(`${this.loggerPrefix} Failed to fetch more by artist:`, err?.message || err);
    }

    return [];
  }

  /**
   * Build SEO & Social Graph properties from a resolved Song object.
   */
  public buildSEOData(track: Song): TrackSEOData {
    const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';
    const albumName = track.album?.name || '';
    const coverUrl = ImageHelper.getBestImageUrl(track.image) || '';
    const description = `Dengarkan "${track.name}" oleh ${artistName} di AcadMusic. Streaming gratis dengan lirik real-time.`;
    const canonicalUrl = `https://music.rasyadazizan.site${SlugHelper.buildTrackPath(artistName, track.name, track.id)}`;

    return {
      title: `${track.name} — ${artistName}`,
      description,
      coverUrl,
      canonicalUrl,
      artistName,
      albumName,
    };
  }
}

export const trackResolver = TrackPageResolverService.getInstance();
