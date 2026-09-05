import { Song } from '@/types/music';

import { createClient } from '@/lib/supabase/client';
import { ArtistParser } from '@/lib/utils/ArtistParser';

// ── Internal API fetch (hits Express Backend) ───────────────

const BASE_URL = (process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL) || '';

if (!BASE_URL && typeof window !== 'undefined') {
  console.error('[MusicApiService] NEXT_PUBLIC_EXPRESS_API_URL is not set. API calls will fail.');
}


let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAuthToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  cachedToken = session?.access_token ?? null;
  tokenExpiry = Date.now() + 5 * 60 * 1000; // cache for 5 minutes
  return cachedToken;
}

export async function apiFetchInternal<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  
  const res = await fetch(url, { 
    ...options,
    headers,
  });
  
  if (!res.ok) {
    let errMsg = `API error: ${path}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMsg);
  }
  
  const json = await res.json();
  return (json?.data ?? json) as T;
}

// ── Search ─────────────────────────────────────────────────────────

  export let searchSongs = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/songs?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

  export let searchArtists = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/artists?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

  export let searchAll = (q: string, country = 'ID') =>
  apiFetchInternal<any>(`/api/search?q=${encodeURIComponent(q)}&country=${country}`);

  export let searchAlbums = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/albums?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

// ── Home feed (YT Music) ──────────────────────────────────────────

  export let getHomeFeed = () =>
  apiFetchInternal<any>(`/api/home`);

// ── Artist songs ───────────────────────────────────────────────────

  export let getArtistInfo = (artistId: string) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return apiFetchInternal<any>(`/api/artists/${cleanId}`);
};

  export let getArtistTopTracks = (artistId: string) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return apiFetchInternal<any>(`/api/artists/${cleanId}/top?limit=100`)
    .then((res) => res?.songs ?? []);
};

  export let getArtistSongs = (artistId: string, page = 1) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return apiFetchInternal<any>(
    `/api/artists/${cleanId}/top?page=${page}&limit=20`
  );
};

  export let getArtistAlbums = (artistId: string, limit = 50) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return apiFetchInternal<any[]>(
    `/api/artists/${cleanId}/albums?limit=${limit}`
  );
};

  export let getSong = (trackId: string) => {
  const itunesId = trackId.replace(/^itunes-/, '');
  return apiFetchInternal<Song>(`/api/tracks/${itunesId}`);
};

  export let getAlbum = (albumId: string) => {
  const itunesId = albumId.replace(/^itunes-album-/, '');
  return apiFetchInternal<any>(`/api/albums/${itunesId}`);
};

  export let getSongsByIds = async (trackIds: string[]): Promise<Song[]> => {
  if (trackIds.length === 0) return [];

  // Single track — use direct endpoint
  if (trackIds.length === 1) {
    try {
      const song = await getSong(trackIds[0]);
      return song ? [song] : [];
    } catch {
      return [];
    }
  }

  // Multiple tracks — use batch endpoint (1 request instead of N)
  const MAX_BATCH = 50;
  const allSongs: Song[] = [];

  for (let i = 0; i < trackIds.length; i += MAX_BATCH) {
    const batch = trackIds.slice(i, i + MAX_BATCH);
    try {
      const res = await apiFetchInternal<any>('/api/tracks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: batch }),
      });

      const data = res || {};

      // Preserve order from input IDs
      for (const id of batch) {
        const song = data[id];
        if (song) allSongs.push(song);
      }
    } catch (err) {
      console.error('Batch fetch error:', err);
    }
  }

  return allSongs;
};

// ── Lyrics (stub) ─────────────────────────────────────────────────

  export let getSongLyrics = async (track: Song): Promise<{ lyrics: string, type?: 'plain' | 'lrc' | 'yrc', synced?: boolean } | null> => {
    try {
      const params = new URLSearchParams({
        title: track.name,
        artist: track.artists.primary[0]?.name || '',
        album: track.album?.name || '',
        duration: Math.round(track.duration).toString()
      });
      const res = await apiFetchInternal<any>(`/api/lyrics?${params.toString()}`);
      return res ? res : null;
    } catch {
      return null;
    }
  };

// ── Audio resolve ──────────────────────────────────────────────────

  export async function resolveAudioUrl(title: string, artist: string): Promise<{
  audioUrl: string;
  videoId: string;
} | null> {
  try {
    const res = await apiFetchInternal<any>(
      `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    );
    return res?.audioUrl ? res : null;
  } catch {
    return null;
  }
}



