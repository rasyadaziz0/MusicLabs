export interface ScrapedTrack {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
}

export interface ScrapedPlaylist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: ScrapedTrack[];
  source: 'spotify' | 'youtube' | 'apple' | 'unknown';
}

export interface PlaylistScraper {
  match(url: string): boolean;
  scrape(url: string): Promise<ScrapedPlaylist>;
}
