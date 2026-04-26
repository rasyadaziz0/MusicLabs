/**
 * Client-side resolver for matching Deezer tracks to YouTube videos.
 * Uses localStorage to cache results and reduce API calls.
 */

const CACHE_KEY_PREFIX = 'yt_resolve_v3_';

export async function resolveToYoutubeId(title: string, artist: string, trackId: string): Promise<string | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${trackId}`;
  
  // 1. Cek cache localStorage
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    // 2. Fetch dari internal Edge function (strict topic-first resolver)
    const query = `${title} ${artist} topic -lyric`.trim();
    const res = await fetch(
      `/api/search/youtube?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&q=${encodeURIComponent(query)}`
    );
    
    if (!res.ok) {
      console.warn(`YouTube resolve failed for: ${query}`);
      return null;
    }

    const data = await res.json();
    const videoId = data.videoId;

    if (videoId) {
      // 3. Simpan ke cache
      localStorage.setItem(cacheKey, videoId);
      return videoId;
    }

    return null;
  } catch (error) {
    console.error('Error resolving YouTube ID:', error);
    return null;
  }
}
