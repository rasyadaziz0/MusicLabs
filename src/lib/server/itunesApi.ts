import { Song } from '@/types/music';

// ── iTunes API helper ──────────────────────────────────────

export interface ITunesResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
  artistId?: number;
  collectionId?: number;
  wrapperType?: string;
  artistType?: string;
  artistLinkUrl?: string;
  collectionType?: string;
  trackCount?: number;
}

export function mapITunesToSong(item: ITunesResult): Song {
  // Upscale artwork: iTunes returns 100x100, replace to get 600x600
  const artworkLarge = item.artworkUrl100?.replace('100x100bb', '600x600bb') || '';
  const artworkMedium = item.artworkUrl100?.replace('100x100bb', '300x300bb') || '';

  return {
    id: `itunes-${item.trackId}`,
    name: item.trackName || 'Unknown Title',
    type: 'song',
    year: item.releaseDate?.slice(0, 4) || '',
    releaseDate: item.releaseDate || null,
    duration: Math.round((item.trackTimeMillis || 0) / 1000),
    label: '',
    explicitContent: false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: item.trackViewUrl || '',
    copyright: '',
    album: {
      id: `itunes-album-${item.collectionId || ''}`,
      name: item.collectionName || '',
      url: '',
    },
    artists: {
      primary: [{
        id: `itunes-artist-${item.artistId || ''}`,
        name: item.artistName || 'Unknown Artist',
        role: 'primary',
        type: 'artist',
        image: [],
        url: item.artistLinkUrl || '',
      }],
      featured: [],
      all: [{
        id: `itunes-artist-${item.artistId || ''}`,
        name: item.artistName || 'Unknown Artist',
        role: 'primary',
        type: 'artist',
        image: [],
        url: item.artistLinkUrl || '',
      }],
    },
    image: [
      { quality: '500x500', url: artworkLarge },
      { quality: '150x150', url: artworkMedium },
    ].filter(i => i.url),
    downloadUrl: [],
    preview: item.previewUrl || '',
  };
}

export async function searchITunesTracks(query: string, limit = 20): Promise<Song[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(mapITunesToSong);
  } catch {
    return [];
  }
}

export async function searchITunesArtists(query: string, limit = 5) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=musicArtist&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((artist: ITunesResult) => ({
      id: `itunes-artist-${artist.artistId}`,
      title: artist.artistName || 'Unknown',
      description: artist.primaryGenreName || 'Artist',
      image: [], // iTunes doesn't return artist images in search
      url: artist.artistLinkUrl || ''
    }));
  } catch {
    return [];
  }
}

export async function getITunesTrack(itunesId: string): Promise<Song | null> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesId}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return mapITunesToSong(data.results[0]);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getITunesArtist(itunesId: string) {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesId}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.results?.[0];
    if (!artist) return null;

    return {
      id: `itunes-artist-${artist.artistId}`,
      name: artist.artistName,
      link: artist.artistLinkUrl || '',
      picture: '', // iTunes doesn't reliably return artist images
      picture_small: '',
      picture_medium: '',
      picture_big: '',
      picture_xl: '',
      nb_album: 0,
      nb_fan: 0,
      genres: artist.primaryGenreName ? [artist.primaryGenreName] : [],
      popularity: 0,
    };
  } catch {
    return null;
  }
}

export async function getITunesArtistTopTracks(itunesId: string, limit = 50): Promise<Song[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesId}&entity=song&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // The first result is the artist, the subsequent results are tracks
    return (data.results || [])
      .filter((item: ITunesResult) => item.wrapperType === 'track')
      .map(mapITunesToSong);
  } catch {
    return [];
  }
}

export async function getITunesArtistAlbums(itunesId: string, limit = 50) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesId}&entity=album&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    // First result is artist, subsequent are collections (albums)
    return (data.results || [])
      .filter((item: ITunesResult) => item.wrapperType === 'collection')
      .map((album: ITunesResult) => {
        const cover = album.artworkUrl100?.replace('100x100bb', '600x600bb') || '';
        return {
          id: `itunes-album-${album.collectionId}`,
          title: album.collectionName,
          cover: cover,
          cover_small: album.artworkUrl100 || '',
          cover_medium: album.artworkUrl100?.replace('100x100bb', '300x300bb') || '',
          cover_big: cover,
          cover_xl: cover,
          nb_tracks: album.trackCount || 0,
          artist: album.artistName || '',
          release_date: album.releaseDate || '',
          album_type: album.collectionType?.toLowerCase() || 'album',
        };
      });
  } catch {
    return [];
  }
}

export async function getITunesAlbum(itunesId: string) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesId}&entity=song`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    
    // First result is collection (album), subsequent are tracks
    const items = data.results || [];
    const albumItem = items.find((item: ITunesResult) => item.wrapperType === 'collection');
    if (!albumItem) return null;

    const tracks = items
      .filter((item: ITunesResult) => item.wrapperType === 'track')
      .map(mapITunesToSong);

    const cover = albumItem.artworkUrl100?.replace('100x100bb', '600x600bb') || '';

    return {
      id: `itunes-album-${albumItem.collectionId}`,
      title: albumItem.collectionName,
      cover: cover,
      cover_small: albumItem.artworkUrl100 || '',
      cover_medium: albumItem.artworkUrl100?.replace('100x100bb', '300x300bb') || '',
      cover_big: cover,
      cover_xl: cover,
      nb_tracks: albumItem.trackCount || 0,
      artist: albumItem.artistName || '',
      release_date: albumItem.releaseDate || '',
      album_type: albumItem.collectionType?.toLowerCase() || 'album',
      tracks: tracks
    };
  } catch {
    return null;
  }
}

export async function getITunesPreviewUrl(
  title: string,
  artist: string
): Promise<string | null> {
  try {
    const query = artist ? `${artist} ${title}` : title;
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.previewUrl || null;
  } catch {
    return null;
  }
}
