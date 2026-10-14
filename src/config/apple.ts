export const APPLE_SCRAPER_CONFIG = {
  maxTracks: parseInt(process.env.APPLE_MAX_IMPORT_TRACKS || '500', 10),
  userAgent: process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
