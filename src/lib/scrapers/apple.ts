import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from '@/types/services/scrapers';
import { APPLE_SCRAPER_CONFIG } from '@/config/apple';

/**
 * Apple Music playlist scraper (frontend version).
 *
 * Multi-tier robust extraction strategy:
 *   1. `serialized-server-data` (Primary & richest source):
 *      Contains full Svelte sections with playlist header (title, description,
 *      high-res artwork) and tracklist (title, artist, album, duration, artwork).
 *   2. Schema.org JSON-LD (`<script id="schema:music-playlist" type="application/ld+json">`):
 *      Provides track name, duration (ISO 8601), and thumbnail.
 *   3. Open Graph meta tags (`<meta property="music:song">`):
 *      Fallback providing track URLs, slugs, and durations.
 */
export class AppleScraper implements PlaylistScraper {
  match(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'music.apple.com';
    } catch {
      return url.includes('music.apple.com/');
    }
  }

  async scrape(url: string): Promise<ScrapedPlaylist> {
    try {
      // 1. Fetch HTML of the Apple Music page
      const response = await fetch(url, {
        headers: {
          'User-Agent': APPLE_SCRAPER_CONFIG.userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple Music: ${response.statusText}`);
      }

      const html = await response.text();

      let playlistName = 'Apple Music Playlist';
      let playlistDescription = '';
      let coverUrl = '';
      let tracks: ScrapedTrack[] = [];
      const playlistId = url.split('/').pop()?.split('?')[0] || 'apple-playlist';

      // ── Strategy 1: serialized-server-data (Richest data: Title, Artist, Album, Duration, Cover) ──
      const serializedResult = this.extractFromSerializedData(html);
      if (serializedResult && serializedResult.tracks.length > 0) {
        tracks = serializedResult.tracks;
        playlistName = serializedResult.playlistName || playlistName;
        playlistDescription = serializedResult.playlistDescription || playlistDescription;
        coverUrl = serializedResult.coverUrl || coverUrl;
      }

      // ── Strategy 2: Schema.org JSON-LD (Fallback if serialized data missing) ──
      if (tracks.length === 0) {
        tracks = this.extractFromJsonLd(html);
        const meta = this.extractPlaylistMetaFromJsonLd(html);
        if (meta.name) playlistName = meta.name;
        if (meta.description) playlistDescription = meta.description;
      }

      // ── Strategy 3: Open Graph meta tags (Final fallback) ──
      if (tracks.length === 0) {
        tracks = this.extractFromOgMetaTags(html);
      }

      // Fill in any missing playlist metadata from OG meta tags
      const ogMeta = this.extractPlaylistMetaFromOg(html);
      if ((playlistName === 'Apple Music Playlist' || !playlistName) && ogMeta.name) {
        playlistName = ogMeta.name;
      }
      if (!coverUrl && ogMeta.coverUrl) {
        coverUrl = ogMeta.coverUrl;
      }
      if (!playlistDescription && ogMeta.description) {
        playlistDescription = ogMeta.description;
      }

      if (tracks.length === 0) {
        throw new Error('Failed to extract tracks from Apple Music page. The page format might have changed or the playlist is empty.');
      }

      return {
        id: `apple-${playlistId}`,
        name: playlistName,
        description: playlistDescription,
        coverUrl,
        tracks: tracks.slice(0, APPLE_SCRAPER_CONFIG.maxTracks),
        source: 'apple'
      };

    } catch (err: any) {
      throw new Error(`Apple Music Scraper Error: ${err.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  Strategy 1: serialized-server-data (Svelte sections & recursive)
  // ──────────────────────────────────────────────────────────────

  private extractFromSerializedData(html: string): {
    playlistName?: string;
    playlistDescription?: string;
    coverUrl?: string;
    tracks: ScrapedTrack[];
  } | null {
    const match = html.match(/<script[^>]*id=["']serialized-server-data["'][^>]*>([\s\S]*?)<\/script>/i)
               || html.match(/<script[^>]*id=["']shoebox-media-api-cache-amp-music["'][^>]*>([\s\S]*?)<\/script>/i);

    if (!match?.[1]) return null;

    try {
      const parsed = JSON.parse(match[1]);
      const rootData = Array.isArray(parsed) ? parsed[0] : parsed;
      const innerData = rootData?.data?.[0]?.data || rootData?.data || rootData;

      let playlistName: string | undefined;
      let playlistDescription: string | undefined;
      let coverUrl: string | undefined;
      const tracks: ScrapedTrack[] = [];

      // A. Try modern Svelte sections structure
      const sections = innerData?.sections;
      if (Array.isArray(sections)) {
        for (const section of sections) {
          // Playlist Header
          if (section.itemKind === 'containerDetailHeaderLockup' || section.id?.includes('header')) {
            const header = section.items?.[0];
            if (header) {
              if (header.title) playlistName = header.title;
              const art = header.artwork?.dictionary?.url;
              if (art) coverUrl = this.formatArtworkUrl(art, 600, 600);
              const desc = header.modalPresentationDescriptor?.paragraphText || header.description;
              if (desc) playlistDescription = desc.replace(/<[^>]*>/g, '').trim();
            }
          }

          // Tracklist
          if (
            section.itemKind === 'trackLockup' ||
            section.id?.includes('track-list') ||
            section.items?.some((i: any) => i.artistName || i.composer)
          ) {
            for (const item of (section.items || [])) {
              const title = item.title;
              if (!title) continue;

              let artist = item.artistName || '';
              if (!artist && Array.isArray(item.subtitleLinks)) {
                artist = item.subtitleLinks.map((s: any) => s.title).filter(Boolean).join(', ');
              }

              let album = '';
              if (Array.isArray(item.tertiaryLinks) && item.tertiaryLinks.length > 0) {
                album = item.tertiaryLinks[0].title || '';
              }

              let duration: number | undefined;
              if (typeof item.duration === 'number') {
                duration = Math.round(item.duration / 1000);
              }

              let trackCover = '';
              const art = item.artwork?.dictionary?.url;
              if (art) {
                trackCover = this.formatArtworkUrl(art, 300, 300);
              }

              tracks.push({
                title,
                artist,
                album,
                duration,
                coverUrl: trackCover
              });
            }
          }
        }

        if (tracks.length > 0) {
          return { playlistName, playlistDescription, coverUrl, tracks };
        }
      }

      // B. Fallback: Recursive JSON tree walk (handles legacy Ember or nested objects)
      const recursiveTracks: ScrapedTrack[] = [];
      const traverse = (obj: any) => {
        if (Array.isArray(obj)) {
          for (const item of obj) traverse(item);
        } else if (typeof obj === 'object' && obj !== null) {
          if (obj.contentDescriptor?.kind === 'song' && obj.title) {
            const title = obj.title;
            const artist = obj.artistName || (Array.isArray(obj.subtitleLinks) ? obj.subtitleLinks.map((s: any) => s.title).join(', ') : '');
            const album = obj.tertiaryLinks?.[0]?.title || '';
            const duration = obj.duration ? Math.round(obj.duration / 1000) : undefined;
            let trackCover = '';
            if (obj.artwork?.dictionary?.url) {
              trackCover = this.formatArtworkUrl(obj.artwork.dictionary.url, 300, 300);
            }
            recursiveTracks.push({
              title,
              artist,
              album,
              duration,
              coverUrl: trackCover
            });
          }

          for (const key of Object.keys(obj)) {
            traverse(obj[key]);
          }
        }
      };

      traverse(innerData);
      if (recursiveTracks.length > 0) {
        return { playlistName, playlistDescription, coverUrl, tracks: recursiveTracks };
      }

    } catch (err) {
      console.error('[AppleScraper] Error parsing serialized data:', err);
    }

    return null;
  }

  // ──────────────────────────────────────────────────────────────
  //  Strategy 2: Schema.org JSON-LD extraction
  // ──────────────────────────────────────────────────────────────

  private extractFromJsonLd(html: string): ScrapedTrack[] {
    const tracks: ScrapedTrack[] = [];

    const jsonLdMatch = html.match(
      /<script\s+[^>]*id=["']?schema:music-playlist["']?[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    ) || html.match(
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*id=["']?schema:music-playlist["']?[^>]*>([\s\S]*?)<\/script>/i
    ) || html.match(
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );

    if (!jsonLdMatch?.[1]) return tracks;

    try {
      const schema = JSON.parse(jsonLdMatch[1]);

      if (schema['@type'] !== 'MusicPlaylist' || !Array.isArray(schema.track)) {
        return tracks;
      }

      for (const entry of schema.track) {
        if (entry['@type'] !== 'MusicRecording') continue;

        const name = entry.name;
        if (!name) continue;

        const duration = this.parseIsoDuration(entry.duration);
        const thumbnailUrl = entry.audio?.thumbnailUrl || '';

        let artist = '';
        if (entry.byArtist) {
          if (typeof entry.byArtist === 'string') {
            artist = entry.byArtist;
          } else if (entry.byArtist.name) {
            artist = entry.byArtist.name;
          } else if (Array.isArray(entry.byArtist)) {
            artist = entry.byArtist.map((a: any) => a.name || a).filter(Boolean).join(', ');
          }
        }

        tracks.push({
          title: name,
          artist,
          album: '',
          duration,
          coverUrl: thumbnailUrl,
        });
      }
    } catch (err) {
      console.error('[AppleScraper] Error parsing JSON-LD:', err);
    }

    return tracks;
  }

  private extractPlaylistMetaFromJsonLd(html: string): { name: string; description: string } {
    const jsonLdMatch = html.match(
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );

    if (!jsonLdMatch?.[1]) return { name: '', description: '' };

    try {
      const schema = JSON.parse(jsonLdMatch[1]);
      return {
        name: schema.name || '',
        description: schema.description || '',
      };
    } catch {
      return { name: '', description: '' };
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  Strategy 3: Open Graph meta tags extraction (fallback)
  // ──────────────────────────────────────────────────────────────

  private extractFromOgMetaTags(html: string): ScrapedTrack[] {
    const tracks: ScrapedTrack[] = [];

    const songUrlRegex = /<meta\s+property=["']music:song["']\s+content=["']([^"']+)["']\s*\/?>/g;
    const songUrls: string[] = [];
    let m: RegExpExecArray | null;

    while ((m = songUrlRegex.exec(html)) !== null) {
      songUrls.push(m[1]);
    }

    const durationRegex = /<meta\s+property=["']music:song:duration["']\s+content=["']([^"']+)["']\s*\/?>/g;
    const durations: string[] = [];
    while ((m = durationRegex.exec(html)) !== null) {
      durations.push(m[1]);
    }

    for (let i = 0; i < songUrls.length; i++) {
      const songUrl = songUrls[i];
      const slugMatch = songUrl.match(/\/song\/([^/]+)\/\d+/);
      const title = slugMatch
        ? decodeURIComponent(slugMatch[1])
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : `Track ${i + 1}`;

      const duration = i < durations.length ? this.parseIsoDuration(durations[i]) : undefined;

      tracks.push({
        title,
        artist: '',
        album: '',
        duration,
        coverUrl: '',
      });
    }

    return tracks;
  }

  private extractPlaylistMetaFromOg(html: string): { name: string; coverUrl: string; description: string } {
    const titleMatch = html.match(
      /<meta\s+(?:property|name)=["'](?:og:title|apple:title)["']\s+content=["']([^"']+)["']/i
    );
    const imageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    const descMatch = html.match(
      /<meta\s+(?:property|name)=["'](?:og:description|apple:description)["']\s+content=["']([^"']+)["']/i
    );

    let name = titleMatch?.[1] || '';
    name = name.replace(/\s+on\s+Apple\s+Music$/i, '').trim();

    return {
      name,
      coverUrl: imageMatch?.[1] || '',
      description: descMatch?.[1] || '',
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  Utilities
  // ──────────────────────────────────────────────────────────────

  private formatArtworkUrl(template: string, width = 300, height = 300, format = 'jpg'): string {
    return template
      .replace('{w}', width.toString())
      .replace('{h}', height.toString())
      .replace('{f}', format);
  }

  private parseIsoDuration(iso?: string): number | undefined {
    if (!iso) return undefined;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
}
