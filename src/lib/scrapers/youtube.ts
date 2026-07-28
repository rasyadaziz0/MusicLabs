import YTMusic from 'ytmusic-api';
import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from './types';

export class YouTubeScraper implements PlaylistScraper {
  private ytmusic: YTMusic | null = null;

  match(url: string): boolean {
    return url.includes('youtube.com/playlist') || url.includes('music.youtube.com/playlist');
  }

  private extractPlaylistId(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('list');
    } catch {
      return null;
    }
  }

  private async getClient(): Promise<YTMusic> {
    if (!this.ytmusic) {
      this.ytmusic = new YTMusic();
      await this.ytmusic.initialize();
    }
    return this.ytmusic;
  }

  async scrape(url: string): Promise<ScrapedPlaylist> {
    const playlistId = this.extractPlaylistId(url);
    if (!playlistId) {
      throw new Error('Invalid YouTube playlist URL. Make sure it contains ?list=');
    }

    const client = await this.getClient();
    const data = await client.getPlaylist(playlistId);
    
    if (!data) {
      throw new Error('Playlist not found or private');
    }

    const videos = await client.getPlaylistVideos(playlistId);

    const tracks: ScrapedTrack[] = videos.map((song: any) => {
      let title = song.name || '';
      let artist = Array.isArray(song.artists) ? song.artists.map((a: any) => a.name).join(', ') : song.artists?.name;
      
      // Trik #2: Bersihin judul YouTube yang berantakan
      const cleaned = title
        .replace(/\s*[\(\[][^()\[\]]*?(official|video|audio|lyric|mv|hd|4k|visualizer)[^()\[\]]*?[\)\]]/gi, "")
        .replace(/\s*\|.*$/, "")
        .trim();

      const sep = cleaned.match(/^(.*?)\s+[\-\u2013\u2014:]\s+(.*)$/); // handle - – — :
      if (sep) {
        artist = sep[1];
        title = sep[2];
      } else {
        title = cleaned;
        if (artist) {
          artist = artist.replace(/\s*-\s*Topic$/i, "");
        } else {
          artist = 'Unknown';
        }
      }

      return {
        title,
        artist,
        album: song.album?.name,
        duration: song.duration, 
        coverUrl: song.thumbnails?.[song.thumbnails.length - 1]?.url || song.thumbnails?.[0]?.url
      };
    });

    return {
      id: `youtube-${playlistId}`,
      name: data.name || 'YouTube Playlist',
      description: '', // ytmusic-api doesn't always return description easily
      coverUrl: data.thumbnails?.[data.thumbnails.length - 1]?.url || data.thumbnails?.[0]?.url,
      tracks,
      source: 'youtube'
    };
  }
}
