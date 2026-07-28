import { PlaylistScraper, ScrapedPlaylist } from './types';
import { SpotifyScraper } from './spotify';
import { YouTubeScraper } from './youtube';
import { AppleScraper } from './apple';

const scrapers: PlaylistScraper[] = [
  new SpotifyScraper(),
  new YouTubeScraper(),
  new AppleScraper(),
];

export async function scrapePlaylist(url: string): Promise<ScrapedPlaylist> {
  const scraper = scrapers.find((s) => s.match(url));
  
  if (!scraper) {
    throw new Error('URL tidak didukung. Pastikan URL berasal dari Spotify, YouTube Music, atau Apple Music.');
  }

  return scraper.scrape(url);
}

export * from './types';
