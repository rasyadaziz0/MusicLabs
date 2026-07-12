import { Song } from '@/types/music';
import { getITunesTrack, getITunesArtistTopTracks, searchITunesTracks } from '@/lib/server/itunesApi';
import { getYtMusicClient, mapYtSongToAppSong } from '@/lib/server/ytmusic';
import { getBestImageUrl, searchSongs } from '@/lib/api/musicApi';
import { restoreTrackId, buildTrackPath } from '@/lib/utils/slugify';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ParsedTrackSlug {
  cleanId: string;
  trackId: string;
}

export interface TrackSEOData {
  title: string;
  description: string;
  coverUrl: string;
  canonicalUrl: string;
  artistName: string;
  albumName: string;
}

/**
 * OOP Service for resolving track metadata, multi-provider fallbacks, and related songs
 * for the Music share/detail pages. Provides structured logging for seamless debugging.
 */
export class TrackPageResolverService {
  private static instance: TrackPageResolverService;
  private readonly loggerPrefix = '[TrackPageResolverService]';

  private constructor() {}

  /** Singleton instance accessor */
  public static getInstance(): TrackPageResolverService {
    if (!TrackPageResolverService.instance) {
      TrackPageResolverService.instance = new TrackPageResolverService();
    }
    return TrackPageResolverService.instance;
  }

  /**
   * Helper to inspect if an ID matches YouTube Music's 11-character video ID pattern.
   */
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
    const trackId = restoreTrackId(cleanId);
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

    // 0. Check Supabase Cache
    try {
      const supabase = await createClient();
      const { data: cached } = await supabase
        .from('indexed_tracks')
        .select('raw_data, updated_at')
        .eq('track_id', trackId)
        .single();
      
      if (cached && cached.raw_data) {
        // Check if fresh (less than 7 days old)
        const ageInMs = new Date().getTime() - new Date(cached.updated_at).getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        
        if (ageInDays < 7) {
          console.debug(`${this.loggerPrefix} Cache HIT for "${trackId}" (Age: ${ageInDays.toFixed(1)} days)`);
          return cached.raw_data as unknown as Song;
        } else {
          console.debug(`${this.loggerPrefix} Cache STALE for "${trackId}" (Age: ${ageInDays.toFixed(1)} days), fetching fresh...`);
        }
      }
    } catch (err: any) {
      console.warn(`${this.loggerPrefix} Supabase cache read error:`, err?.message || err);
    }

    let resolvedSong: Song | null = null;

    // 1. YouTube Music check
    if (this.isYouTubeVideoId(trackId)) {
      try {
        console.debug(`${this.loggerPrefix} Provider strategy -> YouTube Music (id: ${trackId})`);
        const client = await getYtMusicClient();
        const songData = await client.getSong(trackId);
        if (songData) {
          resolvedSong = mapYtSongToAppSong(songData as any);
          console.debug(`${this.loggerPrefix} Successfully resolved via YouTube Music: "${resolvedSong.name}" (${resolvedSong.id})`);
        } else {
          console.debug(`${this.loggerPrefix} YouTube Music returned null for ID "${trackId}". Attempting fallback...`);
        }
      } catch (err: any) {
        console.warn(`${this.loggerPrefix} YouTube Music resolution error for "${trackId}":`, err?.message || err);
      }
    }

    // 2. iTunes API check
    if (!resolvedSong) {
      const itunesId = trackId.replace(/^itunes-/, '');
      try {
        console.debug(`${this.loggerPrefix} Provider strategy -> iTunes API (id: ${itunesId})`);
        const track = await getITunesTrack(itunesId);
        if (track) {
          resolvedSong = track;
          console.debug(`${this.loggerPrefix} Successfully resolved via iTunes API: "${track.name}" (${track.id})`);
        }
      } catch (err: any) {
        console.warn(`${this.loggerPrefix} iTunes API resolution error for "${itunesId}":`, err?.message || err);
      }
    }

    if (resolvedSong) {
      // Save to Supabase Cache via service-role client (bypasses RLS)
      try {
        const adminDb = createAdminClient();
        await adminDb
          .from('indexed_tracks')
          .upsert({
            track_id: trackId,
            name: resolvedSong.name,
            artist_name: resolvedSong.artists?.primary?.[0]?.name || 'Unknown Artist',
            raw_data: resolvedSong as any,
            updated_at: new Date().toISOString()
          }, { onConflict: 'track_id' });
        console.debug(`${this.loggerPrefix} Cached "${resolvedSong.name}" to Supabase.`);
      } catch (err: any) {
        console.warn(`${this.loggerPrefix} Supabase cache write error:`, err?.message || err);
      }
      return resolvedSong;
    }

    console.warn(`${this.loggerPrefix} Failed to resolve track for ID "${trackId}" across all providers.`);
    return null;
  }

  /**
   * Fetch additional songs ("More by Artist") using multi-stage fallback queries.
   */
  public async getMoreByArtist(track: Song, artistName: string): Promise<Song[]> {
    const artistId = track.artists?.primary?.[0]?.id || '';
    console.debug(`${this.loggerPrefix} Discovering more tracks for artist: "${artistName}" (artistId: "${artistId}")`);

    // Strategy 1: iTunes Artist Top Tracks if artist ID has itunes prefix
    if (artistId.startsWith('itunes-artist-')) {
      const itunesId = artistId.replace('itunes-artist-', '');
      try {
        const tracks = await getITunesArtistTopTracks(itunesId, 20);
        const filtered = tracks.filter(t => t.id !== track.id);
        if (filtered.length > 0) {
          console.debug(`${this.loggerPrefix} Found ${filtered.length} more tracks via iTunes Artist ID.`);
          return filtered;
        }
      } catch (err: any) {
        console.debug(`${this.loggerPrefix} Strategy 1 (iTunes Artist Top Tracks) failed: ${err?.message || err}`);
      }
    }

    // Strategy 2: iTunes Name Search
    try {
      const tracks = await searchITunesTracks(artistName, 20);
      const filtered = tracks.filter(t => t.id !== track.id);
      if (filtered.length > 0) {
        console.debug(`${this.loggerPrefix} Found ${filtered.length} more tracks via iTunes Name Search.`);
        return filtered;
      }
    } catch (err: any) {
      console.debug(`${this.loggerPrefix} Strategy 2 (iTunes Search) failed: ${err?.message || err}`);
    }

    // Strategy 3: YouTube Music Search
    try {
      const client = await getYtMusicClient();
      const searchResults = await client.searchSongs(artistName);
      if (searchResults && searchResults.length > 0) {
        const tracks = searchResults.map((ytSong: any) => mapYtSongToAppSong(ytSong)).filter(Boolean) as Song[];
        const filtered = tracks.filter(t => t.id !== track.id).slice(0, 15);
        console.debug(`${this.loggerPrefix} Found ${filtered.length} more tracks via YouTube Music search.`);
        return filtered;
      }
      return [];
    } catch (err: any) {
      console.debug(`${this.loggerPrefix} Strategy 3 (YouTube Music Search) failed: ${err?.message || err}`);
      return [];
    }
  }

  /**
   * Build SEO & Social Graph properties from a resolved Song object.
   */
  public buildSEOData(track: Song): TrackSEOData {
    const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';
    const albumName = track.album?.name || '';
    const coverUrl = getBestImageUrl(track.image) || '';
    const description = `Dengarkan "${track.name}" oleh ${artistName} di AcadMusic. Streaming gratis dengan lirik real-time.`;
    const canonicalUrl = `https://music.rasyadazizan.site${buildTrackPath(artistName, track.name, track.id)}`;

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
