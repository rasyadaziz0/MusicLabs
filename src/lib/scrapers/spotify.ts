import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from '@/types/services/scrapers';
import { SPOTIFY_SCRAPER_CONFIG } from '@/config/spotify';

export class SpotifyScraper implements PlaylistScraper {
  match(url: string): boolean {
    return url.includes('spotify.com/playlist/');
  }

  private extractPlaylistId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      const playlistIdx = parts.indexOf('playlist');
      if (playlistIdx !== -1 && parts.length > playlistIdx + 1) {
        return parts[playlistIdx + 1].split('?')[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  async scrape(url: string): Promise<ScrapedPlaylist> {
    const playlistId = this.extractPlaylistId(url);
    if (!playlistId) {
      throw new Error('Invalid Spotify playlist URL');
    }

    // 1. Fetch Spotify embed page to extract metadata & session token
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': SPOTIFY_SCRAPER_CONFIG.userAgent
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('Playlist not found or private');
      throw new Error(`Failed to fetch Spotify embed page: ${response.statusText}`);
    }

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (!match || match.length < 2) {
      throw new Error('Failed to parse playlist data from Spotify HTML. The playlist might be private or the page structure changed.');
    }

    let json: any;
    try {
      json = JSON.parse(match[1]);
    } catch (err) {
      throw new Error('Invalid JSON data found in Spotify HTML.');
    }

    const entity = json?.props?.pageProps?.state?.data?.entity;
    if (!entity) {
      throw new Error('Playlist data is empty or missing.');
    }

    const playlistName = entity.name || 'Unknown Spotify Playlist';
    const playlistDescription = entity.description || '';
    const coverUrl = entity.coverArt?.sources?.[0]?.url || undefined;
    const sessionToken: string | undefined = json?.props?.pageProps?.state?.settings?.session?.accessToken;

    // 2. Try fetching full tracklist via Spotify internal Pathfinder GraphQL API (supports > 100 tracks up to 500)
    if (sessionToken) {
      try {
        const paginatedTracks = await this.fetchTracksViaPathfinder(playlistId, sessionToken);
        if (paginatedTracks.length > 0) {
          return {
            id: `spotify-${entity.id || playlistId}`,
            name: playlistName,
            description: playlistDescription,
            coverUrl,
            tracks: paginatedTracks,
            source: 'spotify'
          };
        }
      } catch (err) {
        console.warn('[SpotifyScraper] Pathfinder GraphQL failed, falling back to embed trackList:', err);
      }
    }

    // 3. Fallback: Return tracks from embed trackList (limited to 100)
    if (!entity.trackList || entity.trackList.length === 0) {
      throw new Error('No tracks found in playlist.');
    }

    const fallbackTracks: ScrapedTrack[] = entity.trackList.map((t: any) => ({
      title: t.title,
      artist: t.subtitle,
      duration: t.duration ? Math.floor(t.duration / 1000) : 0,
      coverUrl: t.coverArt?.sources?.[0]?.url || undefined
    }));

    return {
      id: `spotify-${entity.id || playlistId}`,
      name: playlistName,
      description: playlistDescription,
      coverUrl,
      tracks: fallbackTracks,
      source: 'spotify'
    };
  }

  private async fetchTracksViaPathfinder(playlistId: string, token: string): Promise<ScrapedTrack[]> {
    const allTracks: ScrapedTrack[] = [];
    let offset = 0;
    const limit = 100;
    let totalCount = 100;

    while (offset < totalCount && allTracks.length < SPOTIFY_SCRAPER_CONFIG.maxTracks) {
      const variables = {
        uri: `spotify:playlist:${playlistId}`,
        offset,
        limit,
        enableWatchFeedEntrypoint: false
      };

      const extensions = {
        persistedQuery: {
          version: 1,
          sha256Hash: SPOTIFY_SCRAPER_CONFIG.pathfinderHash
        }
      };

      const queryUrl = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=fetchPlaylist&variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`;

      const res = await fetch(queryUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': SPOTIFY_SCRAPER_CONFIG.userAgent
        }
      });

      if (!res.ok) {
        console.warn(`[SpotifyScraper] Pathfinder returned ${res.status} at offset ${offset}`);
        break;
      }

      const data = await res.json();
      const content = data?.data?.playlistV2?.content;
      if (!content) break;

      totalCount = content.totalCount || 0;
      const items = content.items || [];
      if (items.length === 0) break;

      for (const item of items) {
        const trackData = item?.itemV2?.data;
        if (!trackData || trackData.__typename !== 'Track') continue;

        const title = trackData.name;
        const artist = trackData.artists?.items
          ?.map((a: any) => a.profile?.name)
          .filter(Boolean)
          .join(', ') || 'Unknown';
        const duration = trackData.trackDuration?.totalMilliseconds
          ? Math.floor(trackData.trackDuration.totalMilliseconds / 1000)
          : 0;
        const trackCover = trackData.albumOfTrack?.coverArt?.sources?.[0]?.url;

        allTracks.push({
          title,
          artist,
          duration,
          coverUrl: trackCover
        });
      }

      if (items.length < limit) break;
      offset += limit;
    }

    return allTracks;
  }
}
