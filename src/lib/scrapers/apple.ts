import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from '@/types/services/scrapers';

export class AppleScraper implements PlaylistScraper {
  match(url: string): boolean {
    return url.includes('music.apple.com/');
  }

  async scrape(url: string): Promise<ScrapedPlaylist> {
    try {
      // 1. Fetch HTML of the Apple Music page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple Music: ${response.statusText}`);
      }

      const html = await response.text();

      // 2. Apple Music embeds its data in a serialized-server-data script tag or 
      // shoebox-media-api-cache-amp-music script tag
      // For public playlists, the shoebox-media-api-cache-amp-music usually contains the tracklist.
      const match = html.match(/<script type="application\/json" id="serialized-server-data">([\s\S]*?)<\/script>/)
                 || html.match(/<script type="application\/json" id="shoebox-media-api-cache-amp-music">([\s\S]*?)<\/script>/);

      let playlistName = 'Apple Music Playlist';
      let coverUrl = '';
      const tracks: ScrapedTrack[] = [];
      let playlistId = url.split('/').pop()?.split('?')[0] || 'apple-playlist';

      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);
          
          function traverse(obj: any) {
            if (Array.isArray(obj)) {
              for (const item of obj) traverse(item);
            } else if (typeof obj === 'object' && obj !== null) {
              
              // Find playlist details
              if (obj.kind === 'playlist' && obj.title) {
                 playlistName = obj.title;
              } else if (obj.title && obj.artwork && !obj.artistName && !obj.duration) {
                 if (playlistName === 'Apple Music Playlist') {
                     playlistName = obj.title;
                     if (obj.artwork?.dictionary?.url) {
                         coverUrl = obj.artwork.dictionary.url.replace('{w}', '500').replace('{h}', '500').replace('{f}', 'jpg');
                     }
                 }
              }
              
              // Find tracks
              if (obj.contentDescriptor?.kind === 'song' && obj.title && obj.artistName) {
                 const trackAlbum = obj.tertiaryLinks?.[0]?.title || '';
                 let trackCover = '';
                 if (obj.artwork?.dictionary?.url) {
                    trackCover = obj.artwork.dictionary.url.replace('{w}', '150').replace('{h}', '150').replace('{f}', 'jpg');
                 }
                 tracks.push({
                   title: obj.title,
                   artist: obj.artistName,
                   album: trackAlbum,
                   duration: Math.floor((obj.duration || 0) / 1000),
                   coverUrl: trackCover
                 });
              }
              
              for (const key in obj) {
                traverse(obj[key]);
              }
            }
          }
          
          traverse(data);
          
        } catch (err) {
          console.error("Error parsing Apple Music JSON", err);
        }
      }

      // Fallback extraction if JSON parsing failed or tracks are empty
      // Apple Music also includes og:title and tracks might be somewhat visible in HTML
      // For now, if tracks is empty, it means our scrape failed or playlist is empty
      if (tracks.length === 0) {
        throw new Error('Failed to extract tracks from Apple Music page. The JSON format might have changed or the playlist is empty.');
      }

      return {
        id: `apple-${playlistId}`,
        name: playlistName,
        description: '',
        coverUrl,
        tracks,
        source: 'apple'
      };

    } catch (err: any) {
      throw new Error(`Apple Music Scraper Error: ${err.message}`);
    }
  }
}
