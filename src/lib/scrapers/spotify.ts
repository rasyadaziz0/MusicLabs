import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from '@/types/services/scrapers';

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

    // Trik: Gunakan halaman embed Spotify karena menyimpan data track di dalam __NEXT_DATA__ tanpa butuh auth API!
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
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

    let json;
    try {
      json = JSON.parse(match[1]);
    } catch (err) {
      throw new Error('Invalid JSON data found in Spotify HTML.');
    }

    const entity = json?.props?.pageProps?.state?.data?.entity;

    if (!entity || !entity.trackList) {
      throw new Error('Playlist data is empty or missing trackList.');
    }

    const tracks: ScrapedTrack[] = entity.trackList.map((t: any) => ({
      title: t.title,
      artist: t.subtitle,
      duration: t.duration ? Math.floor(t.duration / 1000) : 0,
      coverUrl: t.coverArt?.sources?.[0]?.url || undefined
    }));

    return {
      id: `spotify-${entity.id || playlistId}`,
      name: entity.name || 'Unknown Spotify Playlist',
      description: entity.description || '',
      coverUrl: entity.coverArt?.sources?.[0]?.url || undefined,
      tracks,
      source: 'spotify'
    };
  }
}
