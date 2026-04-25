import { Song, ImageQuality } from '@/types/music';

const BASE =
  process.env.NEXT_PUBLIC_YTMUSIC_API_URL
  || process.env.NEXT_PUBLIC_MUSIC_API_URL
  || '';

// Helper
async function apiFetch<T>(path: string): Promise<T> {
  if (!BASE) {
    throw new Error('Missing API base URL. Set NEXT_PUBLIC_YTMUSIC_API_URL in your environment.');
  }

  const baseUrl = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API error: ${path}`);
  const json = await res.json();
  return json.data as T;
}

// Internal helper for Next.js route handlers under /api/*
async function apiFetchInternal<T>(path: string): Promise<T> {
  const res = await fetch(path, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error: ${path}`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

// Search
export const searchSongs = (q: string, page = 1) =>
  apiFetchInternal<any>(`/api/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=20`);

export const searchArtists = (q: string, page = 1) =>
  apiFetchInternal<any>(`/api/search/artists?query=${encodeURIComponent(q)}&page=${page}&limit=20`);

export const searchAll = (q: string) =>
  apiFetchInternal<any>(`/api/search?q=${encodeURIComponent(q)}`);

// Songs
export const getSong = (id: string) => apiFetch<Song[]>(`/api/songs?id=${id}`);
export const getSongLyrics = (id: string) => apiFetch<any>(`/api/songs/${id}/lyrics`);
export const getSuggestions = (id: string) => apiFetch<Song[]>(`/api/songs/${id}/suggestions`);

// Albums & Artists
export const getAlbum = (id: string) => apiFetch<any>(`/api/albums?id=${id}`);
export const getArtist = (id: string) => apiFetch<any>(`/api/artists?id=${id}`);
export const getArtistSongs = (id: string, page = 1) =>
  apiFetch<any>(`/api/artists/${id}/songs?page=${page}&sortBy=popularity&sortOrder=desc`);

// Home feed
export const getHomeFeed = (lang = 'hindi,english') => apiFetch<any>(`/api/modules?language=${lang}`);

// Playlist YouTube Music
export const getYoutubeMusicPlaylist = (id: string) => apiFetch<any>(`/api/playlists?id=${id}`);

// Helper: ambil URL audio kualitas terbaik
export function getBestAudioUrl(song: Song): string {
  const urls = song.downloadUrl;
  const preferred = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const quality of preferred) {
    const found = urls.find(u => u.quality === quality);
    if (found?.url) return found.url;
  }
  return urls[urls.length - 1]?.url ?? '';
}

// Helper: ambil cover art terbaik
export function getBestImageUrl(images: ImageQuality[]): string {
  return images.find(i => i.quality === '500x500')?.url
    ?? images.find(i => i.quality === '150x150')?.url
    ?? images[0]?.url ?? '';
}
