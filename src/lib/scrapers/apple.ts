import { PlaylistScraper, ScrapedPlaylist, ScrapedTrack } from './types';

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
          // Finding the playlist object can be tricky as the JSON tree is deep.
          // We can recursively search for objects with type === 'playlists'
          const findPlaylists = (obj: any): any[] => {
            let results: any[] = [];
            if (Array.isArray(obj)) {
              for (const item of obj) results = results.concat(findPlaylists(item));
            } else if (typeof obj === 'object' && obj !== null) {
              if (obj.type === 'playlists' || obj.type === 'library-playlists') {
                results.push(obj);
              }
              for (const key in obj) {
                results = results.concat(findPlaylists(obj[key]));
              }
            }
            return results;
          };

          const playlists = findPlaylists(data);
          if (playlists.length > 0) {
            const playlist = playlists[0];
            playlistName = playlist.attributes?.name || playlistName;
            
            // Format artwork URL
            let rawCover = playlist.attributes?.artwork?.url;
            if (rawCover) {
              coverUrl = rawCover.replace('{w}', '500').replace('{h}', '500').replace('{f}', 'jpg');
            }
            playlistId = playlist.id || playlistId;

            const tracksData = playlist.relationships?.tracks?.data || [];
            for (const t of tracksData) {
              if (!t.attributes) continue;
              const attr = t.attributes;
              let trackCover = attr.artwork?.url;
              if (trackCover) {
                trackCover = trackCover.replace('{w}', '150').replace('{h}', '150').replace('{f}', 'jpg');
              }
              
              tracks.push({
                title: attr.name,
                artist: attr.artistName,
                album: attr.albumName,
                duration: Math.floor((attr.durationInMillis || 0) / 1000),
                coverUrl: trackCover
              });
            }
          }
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
