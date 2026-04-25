import { Song } from '@/types/music';

const DEEZER_BASE = 'https://api.deezer.com';

// ── Deezer response types ──────────────────────────────────────────

export interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  duration: number; // seconds
  explicit_lyrics: boolean;
  link: string;
  preview: string;
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
}

export interface DeezerArtist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  nb_album: number;
  nb_fan: number;
  type: string;
}

export interface DeezerAlbum {
  id: number;
  title: string;
  link: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  nb_tracks: number;
  artist: {
    id: number;
    name: string;
    picture: string;
  };
}

// ── Deezer fetch helper ────────────────────────────────────────────

async function deezerFetch<T>(path: string): Promise<T> {
  const url = `${DEEZER_BASE}${path}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Deezer API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Mapping helpers ────────────────────────────────────────────────

export function mapDeezerTrackToSong(track: DeezerTrack): Song {
  const images = [
    { quality: '500x500', url: track.album.cover_xl || track.album.cover_big || '' },
    { quality: '150x150', url: track.album.cover_medium || track.album.cover_small || '' },
  ].filter(img => img.url);

  const artistImages = [
    { quality: '500x500', url: track.artist.picture_xl || track.artist.picture_big || '' },
    { quality: '150x150', url: track.artist.picture_medium || track.artist.picture_small || '' },
  ].filter(img => img.url);

  return {
    id: `dz-${track.id}`,
    name: track.title || track.title_short || 'Unknown Title',
    type: 'song',
    year: '',
    releaseDate: null,
    duration: track.duration || 0,
    label: 'Deezer',
    explicitContent: track.explicit_lyrics || false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: track.link || '',
    copyright: '',
    album: {
      id: `dz-album-${track.album.id}`,
      name: track.album.title || 'Single',
      url: '',
    },
    artists: {
      primary: [
        {
          id: `dz-artist-${track.artist.id}`,
          name: track.artist.name || 'Unknown Artist',
          role: 'primary',
          type: 'artist',
          image: artistImages,
          url: track.artist.link || '',
        },
      ],
      featured: [],
      all: [
        {
          id: `dz-artist-${track.artist.id}`,
          name: track.artist.name || 'Unknown Artist',
          role: 'primary',
          type: 'artist',
          image: artistImages,
          url: track.artist.link || '',
        },
      ],
    },
    image: images,
    // Audio URL dikosongkan — resolved lazily saat play via YouTube
    downloadUrl: [],
    deezerTrackId: track.id,
    preview: track.preview,
  };
}

// ── Public API functions ───────────────────────────────────────────

export async function searchDeezerTracks(query: string, limit = 20): Promise<Song[]> {
  const data = await deezerFetch<{ data: DeezerTrack[] }>(
    `/search/track?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return (data.data || []).map(mapDeezerTrackToSong);
}

export async function searchDeezerArtists(query: string, limit = 20) {
  const data = await deezerFetch<{ data: DeezerArtist[] }>(
    `/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return (data.data || []).map((artist) => ({
    id: `dz-artist-${artist.id}`,
    title: artist.name,
    description: `${(artist.nb_fan || 0).toLocaleString()} fans`,
    image: [
      { quality: '500x500', url: artist.picture_xl || artist.picture_big || '' },
      { quality: '150x150', url: artist.picture_medium || artist.picture_small || '' },
    ].filter(img => img.url),
  }));
}

export async function getDeezerChart() {
  const data = await deezerFetch<{
    tracks: { data: DeezerTrack[] };
    artists: { data: DeezerArtist[] };
    albums: { data: DeezerAlbum[] };
  }>('/chart');

  return {
    tracks: (data.tracks?.data || []).map(mapDeezerTrackToSong),
    artists: (data.artists?.data || []).map((artist) => ({
      id: `dz-artist-${artist.id}`,
      name: artist.name,
      image: artist.picture_xl || artist.picture_big || '',
      fans: artist.nb_fan || 0,
    })),
    albums: (data.albums?.data || []).map((album) => ({
      id: `dz-album-${album.id}`,
      title: album.title,
      cover: album.cover_xl || album.cover_big || '',
      artist: album.artist?.name || '',
    })),
  };
}

export async function getDeezerArtistTopTracks(artistId: number, limit = 20): Promise<Song[]> {
  const data = await deezerFetch<{ data: DeezerTrack[] }>(
    `/artist/${artistId}/top?limit=${limit}`
  );
  return (data.data || []).map(mapDeezerTrackToSong);
}
