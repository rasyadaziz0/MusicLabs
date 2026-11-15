/**
 * Client-side resolver for matching Spotify / iTunes tracks to YouTube videos.
 * Uses localStorage to cache results and reduce API calls.
 */
import { supabase } from './supabase/client';

const CACHE_KEY_PREFIX = 'yt_resolve_v9_';

import { API_BASE } from './config';

type ResolveOptions = {
  signal?: AbortSignal;
  duration?: number;
  album?: string;
};

export async function resolveToYoutubeId(
  title: string,
  artist: string,
  trackId: string,
  options: ResolveOptions = {}
): Promise<string | null> {
  // If trackId is already a YouTube video ID (11 chars), use it directly
  if (/^[A-Za-z0-9_-]{11}$/.test(trackId)) {
    return trackId;
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${trackId}`;

  // 1. Cek cache localStorage with TTL (7 days)
  const cachedStr = localStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      const parsed = JSON.parse(cachedStr);
      if (parsed && typeof parsed.videoId === 'string') {
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < 7 * 24 * 60 * 60 * 1000) {
          return parsed.videoId;
        }
      }
    } catch {
      // Legacy format fallback
      return cachedStr;
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const durationParam = options.duration ? `&duration=${options.duration}` : '';
    const trackIdParam = trackId ? `&trackId=${encodeURIComponent(trackId)}` : '';
    const albumParam = options.album ? `&album=${encodeURIComponent(options.album)}` : '';

    // 2. Fetch dari internal NodeJS API endpoint yang menggunakan youtube.music.search
    let res = await fetch(
      `${API_BASE}/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}${trackIdParam}${durationParam}${albumParam}`,
      { signal: options.signal, headers }
    );

    if (!res.ok) {
      console.warn(`YouTube resolve primary failed for: ${title} - ${artist}, trying fallback...`);
      res = await fetch(
        `${API_BASE}/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}${trackIdParam}&fallback=1${durationParam}${albumParam}`,
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
      // 3. Simpan ke cache dengan TTL
      localStorage.setItem(cacheKey, JSON.stringify({ videoId, timestamp: Date.now() }));
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
