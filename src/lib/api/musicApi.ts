import { Song, ImageQuality } from '@/types/music';

// ── Internal API fetch (hits our own Next.js routes) ───────────────

async function apiFetchInternal<T>(path: string): Promise<T> {
  const res = await fetch(path, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error: ${path}`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

// ── Search ─────────────────────────────────────────────────────────

export const searchSongs = (q: string, page = 1) =>
  apiFetchInternal<any>(`/api/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=20`);

export const searchArtists = (q: string, page = 1) =>
  apiFetchInternal<any>(`/api/search/artists?query=${encodeURIComponent(q)}&page=${page}&limit=20`);

export const searchAll = (q: string) =>
  apiFetchInternal<any>(`/api/search?q=${encodeURIComponent(q)}`);

// ── Home feed (Deezer chart) ───────────────────────────────────────

export const getHomeFeed = () =>
  apiFetchInternal<any>(`/api/home`);

// ── Artist songs ───────────────────────────────────────────────────

export const getArtistSongs = (artistId: string, page = 1) => {
  // Extract numeric Deezer ID from prefixed format (e.g., "dz-artist-123" → "123")
  const numericId = artistId.replace(/^dz-artist-/, '');
  return apiFetchInternal<any>(
    `/api/artists/${numericId}/top?page=${page}&limit=20`
  );
};

// ── Lyrics (stub — Deezer doesn't provide lyrics) ─────────────────

export const getSongLyrics = async (_trackId: string): Promise<{ lyrics: string } | null> => {
  // Deezer API doesn't expose lyrics publicly.
  // Lyrics are fetched from Supabase (LRC format) in useLyrics hook.
  // This stub exists as a fallback that gracefully returns null.
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

/** Get best cover art image URL */
export function getBestImageUrl(images: ImageQuality[]): string {
  return images.find(i => i.quality === '500x500')?.url
    ?? images.find(i => i.quality === '150x150')?.url
    ?? images[0]?.url ?? '';
}
