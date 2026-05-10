/**
 * Client-side resolver for matching Deezer tracks to YouTube videos.
 * Uses localStorage to cache results and reduce API calls.
 */
import { supabase } from './supabase/client';

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
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // 2. Fetch dari internal NodeJS API endpoint yang menggunakan youtube.music.search
    let res = await fetch(
      `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
      { signal: options.signal, headers }
    );

    if (!res.ok) {
      console.warn(`YouTube resolve primary failed for: ${title} - ${artist}, trying fallback...`);
      res = await fetch(
        `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&fallback=1`,
        { signal: options.signal, headers }
      );
    }

    if (!res.ok) {
      console.warn(`YouTube resolve fallback also failed for: ${title} - ${artist}`);
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
