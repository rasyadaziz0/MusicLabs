import { Song, ImageQuality } from '@/types/music';

// ── Internal API fetch (hits our own Next.js routes) ───────────────

async function apiFetchInternal<T>(path: string): Promise<T> {
  const res = await fetch(path, { next: { revalidate: 60 } });
  
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

export const searchSongs = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/songs?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

export const searchArtists = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/artists?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

export const searchAll = (q: string, country = 'ID') =>
  apiFetchInternal<any>(`/api/search?q=${encodeURIComponent(q)}&country=${country}`);

export const searchAlbums = (q: string, limit = 20, country = 'ID') =>
  apiFetchInternal<any>(`/api/search/albums?query=${encodeURIComponent(q)}&limit=${limit}&country=${country}`);

// ── Home feed (YT Music) ──────────────────────────────────────────

export const getHomeFeed = () =>
  apiFetchInternal<any>(`/api/home`);

// ── Artist songs ───────────────────────────────────────────────────

export const getArtistInfo = (artistId: string) => {
  const itunesId = artistId.replace(/^itunes-artist-/, '');
  return apiFetchInternal<any>(`/api/artists/${itunesId}`);
};

export const getArtistTopTracks = (artistId: string) => {
  const itunesId = artistId.replace(/^itunes-artist-/, '');
  return apiFetchInternal<any>(`/api/artists/${itunesId}/top?limit=100`)
    .then((res) => res?.songs ?? []);
};

export const getArtistSongs = (artistId: string, page = 1) => {
  // Extract iTunes ID from prefixed format (e.g., "itunes-artist-123" → "123")
  const itunesId = artistId.replace(/^itunes-artist-/, '');
  return apiFetchInternal<any>(
    `/api/artists/${itunesId}/top?page=${page}&limit=20`
  );
};

export const getArtistAlbums = (artistId: string, limit = 50) => {
  const itunesId = artistId.replace(/^itunes-artist-/, '');
  return apiFetchInternal<any[]>(
    `/api/artists/${itunesId}/albums?limit=${limit}`
  );
};

export const getSong = (trackId: string) => {
  const itunesId = trackId.replace(/^itunes-/, '');
  return apiFetchInternal<Song>(`/api/tracks/${itunesId}`);
};

export const getAlbum = (albumId: string) => {
  const itunesId = albumId.replace(/^itunes-album-/, '');
  return apiFetchInternal<any>(`/api/albums/${itunesId}`);
};

export const getSongsByIds = async (trackIds: string[]) => {
  const results = await Promise.allSettled(trackIds.map((trackId) => getSong(trackId)));
  return results
    .filter((result): result is PromiseFulfilledResult<Song> => result.status === 'fulfilled')
    .map((result) => result.value);
};

// ── Lyrics (stub) ─────────────────────────────────────────────────

export const getSongLyrics = async (_trackId: string): Promise<{ lyrics: string } | null> => {
  return null;
};

// ── Audio resolve ──────────────────────────────────────────────────

export async function resolveAudioUrl(title: string, artist: string): Promise<{
  audioUrl: string;
  videoId: string;
} | null> {
  try {
    const res = await fetch(
      `/api/audio/resolve?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.audioUrl ? data : null;
  } catch {
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────

/** Get best available audio URL from downloadUrl array */
export function getBestAudioUrl(song: Song): string {
  // Kalau audioUrl sudah di-resolve sebelumnya, pakai itu
  if (song.audioUrl) return song.audioUrl;

  const urls = song.downloadUrl;
  if (!urls || urls.length === 0) return '';

  const preferred = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const quality of preferred) {
    const found = urls.find(u => u.quality === quality);
    if (found?.url) return found.url;
  }
  return urls[urls.length - 1]?.url ?? '';
}

/** Get best cover art image URL. Returns undefined when no valid URL is available. */
export function getBestImageUrl(images: ImageQuality[]): string | undefined {
  if (!images || images.length === 0) return undefined;

  // First try explicitly looking for 500x500 just in case
  const exact500 = images.find(i => i.quality === '500x500')?.url;
  if (exact500) return exact500;

  // Otherwise, sort by width (assuming quality is format "WxH") and get the largest
  const sorted = [...images].sort((a, b) => {
    const widthA = parseInt(a.quality.split('x')[0]) || 0;
    const widthB = parseInt(b.quality.split('x')[0]) || 0;
    return widthB - widthA; // Descending
  });

  return sorted[0]?.url || undefined;
}
