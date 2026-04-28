/**
 * Client-side resolver for matching Deezer tracks to YouTube videos.
 * Uses localStorage to cache results and reduce API calls.
 */

const CACHE_KEY_PREFIX = 'yt_resolve_v4_';

type ResolveOptions = {
  signal?: AbortSignal;
};

export async function resolveToYoutubeId(
  title: string,
  artist: string,
  trackId: string,
  options: ResolveOptions = {}
): Promise<string | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${trackId}`;
  
  // 1. Cek cache localStorage
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    // 2. Fetch dari internal NodeJS API endpoint yang menggunakan youtube.music.search
    const res = await fetch(
      `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
      { signal: options.signal }
    );
    
    if (!res.ok) {
      console.warn(`YouTube resolve failed for: ${title} - ${artist}`);
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    console.error('Error resolving YouTube ID:', error);
    return null;
  }
}
