import { Song, ImageQuality } from '@/types/music';

import { createClient } from '@/lib/supabase/client';
import { ArtistParser } from '@/lib/utils/ArtistParser';

// ── Internal API fetch (hits Express Backend) ───────────────

const BASE_URL = (process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL) || '';

if (!BASE_URL && typeof window !== 'undefined') {
  console.error('[MusicApiService] NEXT_PUBLIC_EXPRESS_API_URL is not set. API calls will fail.');
}

export class MusicApiService {
  static async apiFetchInternal<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
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

  static searchSongs = (q: string, limit = 20, country = 'ID') =>
  MusicApiService.apiFetchInternal<any>(`/api/search/songs?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

  static searchArtists = (q: string, limit = 20, country = 'ID') =>
  MusicApiService.apiFetchInternal<any>(`/api/search/artists?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

  static searchAll = (q: string, country = 'ID') =>
  MusicApiService.apiFetchInternal<any>(`/api/search?q=${encodeURIComponent(q)}&country=${country}`);

  static searchAlbums = (q: string, limit = 20, country = 'ID') =>
  MusicApiService.apiFetchInternal<any>(`/api/search/albums?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

// ── Home feed (YT Music) ──────────────────────────────────────────

  static getHomeFeed = () =>
  MusicApiService.apiFetchInternal<any>(`/api/home`);

// ── Artist songs ───────────────────────────────────────────────────

  static getArtistInfo = (artistId: string) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return MusicApiService.apiFetchInternal<any>(`/api/artists/${cleanId}`);
};

  static getArtistTopTracks = (artistId: string) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return MusicApiService.apiFetchInternal<any>(`/api/artists/${cleanId}/top?limit=100`)
    .then((res) => res?.songs ?? []);
};

  static getArtistSongs = (artistId: string, page = 1) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return MusicApiService.apiFetchInternal<any>(
    `/api/artists/${cleanId}/top?page=${page}&limit=20`
  );
};

  static getArtistAlbums = (artistId: string, limit = 50) => {
  const cleanId = ArtistParser.stripArtistIdPrefix(artistId);
  return MusicApiService.apiFetchInternal<any[]>(
    `/api/artists/${cleanId}/albums?limit=${limit}`
  );
};

  static getSong = (trackId: string) => {
  const itunesId = trackId.replace(/^itunes-/, '');
  return MusicApiService.apiFetchInternal<Song>(`/api/tracks/${itunesId}`);
};

  static getAlbum = (albumId: string) => {
  const itunesId = albumId.replace(/^itunes-album-/, '');
  return MusicApiService.apiFetchInternal<any>(`/api/albums/${itunesId}`);
};

  static getSongsByIds = async (trackIds: string[]): Promise<Song[]> => {
  if (trackIds.length === 0) return [];

  // Single track — use direct endpoint
  if (trackIds.length === 1) {
    try {
      const song = await MusicApiService.getSong(trackIds[0]);
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
      const res = await MusicApiService.apiFetchInternal<any>('/api/tracks/batch', {
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

  static getSongLyrics = async (_trackId: string): Promise<{ lyrics: string } | null> => {
  return null;
};

// ── Audio resolve ──────────────────────────────────────────────────

  static async resolveAudioUrl(title: string, artist: string): Promise<{
  audioUrl: string;
  videoId: string;
} | null> {
  try {
    const res = await MusicApiService.apiFetchInternal<any>(
      `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    );
    return res?.audioUrl ? res : null;
  } catch {
    return null;
  }
}



}