export const SPOTIFY_SCRAPER_CONFIG = {
  pathfinderHash: process.env.SPOTIFY_PATHFINDER_HASH || '7982b11e21535cd2594badc40030b745671b61a1fa66766e569d45e6364f3422',
  maxTracks: parseInt(process.env.SPOTIFY_MAX_IMPORT_TRACKS || '500', 10),
  userAgent: process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
