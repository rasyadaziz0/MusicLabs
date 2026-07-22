import { Song } from '@/types/music';
import { ITunesClient } from './itunes/ITunesClient';
import { ITunesMapper } from './itunes/ITunesMapper';
import { ITunesResult } from './itunes/types';

// Backward compatibility helper
export const mapITunesToSong = ITunesMapper.toSong;

export async function searchITunesTracks(query: string, limit = 25, country = 'ID'): Promise<Song[]> {
  const fetchTunes = async (q: string, l: number) => {
    const qs = ITunesClient.buildQuery({ term: q, media: 'music', entity: 'song', limit: l, country });
    const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/search?${qs}`);
    return (data?.results || []).map(ITunesMapper.toSong);
  };

  try {
    const searchLimit = Math.max(limit, 50);
    let songs = await fetchTunes(query.trim(), searchLimit);
    const existingIds = new Set(songs.map((s) => s.id));

    if (query.includes('-')) {
      const parts = query.split('-');
      const titlePart = parts[parts.length - 1].trim();

      if (titlePart) {
        const fallbackSongs = await fetchTunes(titlePart, searchLimit);
        for (const song of fallbackSongs) {
          if (!existingIds.has(song.id)) {
            songs.push(song);
            existingIds.add(song.id);
          }
        }
      }
    } else if (songs.length < 10) {
      const words = query.split(' ').filter(Boolean);
      if (words.length > 2) {
        const titleGuess = words.slice(-2).join(' ');
        const fallbackSongs = await fetchTunes(titleGuess, searchLimit);
        for (const song of fallbackSongs) {
          if (!existingIds.has(song.id)) {
            songs.push(song);
            existingIds.add(song.id);
          }
        }
      }
    }

    return songs.slice(0, Math.max(limit, 50));
  } catch {
    return [];
  }
}

export async function searchITunesArtists(query: string, limit = 5, country = 'ID') {
  const qs = ITunesClient.buildQuery({ term: query, media: 'music', entity: 'musicArtist', limit, country });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/search?${qs}`);
  return (data?.results || []).map(ITunesMapper.toArtistSearch);
}

export async function searchITunesAlbums(query: string, limit = 10, country = 'ID') {
  const qs = ITunesClient.buildQuery({ term: query, media: 'music', entity: 'album', limit, country });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/search?${qs}`);
  return (data?.results || []).map(ITunesMapper.toAlbumSearch);
}

export async function getITunesTrack(itunesId: string): Promise<Song | null> {
  const qs = ITunesClient.buildQuery({ id: itunesId, country: 'ID' });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/lookup?${qs}`);
  
  if (data?.results && data.results.length > 0) {
    return ITunesMapper.toSong(data.results[0]);
  }
  return null;
}

export async function getITunesArtist(itunesId: string) {
  const isSearchId = itunesId.startsWith('search-') || itunesId.startsWith('itunes-search-') || !/^\d+$/.test(itunesId);

  if (isSearchId) {
    const term = decodeURIComponent(itunesId.replace(/^itunes-search-|^search-/, ''));
    const qs = ITunesClient.buildQuery({ term, entity: 'musicArtist', limit: 1, country: 'ID' });
    const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/search?${qs}`);
    const artist = data?.results?.[0];

    if (!artist) {
      return {
        id: `itunes-artist-${itunesId}`, name: term, link: '',
        picture: '', picture_small: '', picture_medium: '', picture_big: '', picture_xl: '',
        nb_album: 0, nb_fan: 0, genres: [], popularity: 0,
      };
    }
    return {
      id: `itunes-artist-${artist.artistId}`, name: artist.artistName, link: artist.artistLinkUrl || '',
      picture: '', picture_small: '', picture_medium: '', picture_big: '', picture_xl: '',
      nb_album: 0, nb_fan: 0, genres: artist.primaryGenreName ? [artist.primaryGenreName] : [], popularity: 0,
    };
  }

  const qs = ITunesClient.buildQuery({ id: itunesId, country: 'ID' });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/lookup?${qs}`);
  const artist = data?.results?.[0];
  if (!artist) return null;

  return {
    id: `itunes-artist-${artist.artistId}`, name: artist.artistName, link: artist.artistLinkUrl || '',
    picture: '', picture_small: '', picture_medium: '', picture_big: '', picture_xl: '',
    nb_album: 0, nb_fan: 0, genres: artist.primaryGenreName ? [artist.primaryGenreName] : [], popularity: 0,
  };
}

export async function getITunesArtistTopTracks(itunesId: string, limit = 50): Promise<Song[]> {
  const isSearchId = itunesId.startsWith('search-') || itunesId.startsWith('itunes-search-') || !/^\d+$/.test(itunesId);
  
  let path = `/lookup?id=${itunesId}&entity=song&limit=${limit}&country=ID`;
  if (isSearchId) {
    const term = decodeURIComponent(itunesId.replace(/^itunes-search-|^search-/, ''));
    const qs = ITunesClient.buildQuery({ term, entity: 'song', limit, country: 'ID' });
    path = `/search?${qs}`;
  }

  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(path);
  return (data?.results || [])
    .filter((item) => item.wrapperType === 'track')
    .map(ITunesMapper.toSong);
}

export async function getITunesArtistAlbums(itunesId: string, limit = 50) {
  const isSearchId = itunesId.startsWith('search-') || itunesId.startsWith('itunes-search-') || !/^\d+$/.test(itunesId);
  
  let path = `/lookup?id=${itunesId}&entity=album&limit=${limit}&country=ID`;
  if (isSearchId) {
    const term = decodeURIComponent(itunesId.replace(/^itunes-search-|^search-/, ''));
    const qs = ITunesClient.buildQuery({ term, entity: 'album', limit, country: 'ID' });
    path = `/search?${qs}`;
  }

  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(path);

  // First result is artist, subsequent are collections (albums)
  return (data?.results || [])
    .filter((item) => item.wrapperType === 'collection')
    .map(ITunesMapper.toAlbumSearch);
}

export async function getITunesAlbum(itunesId: string) {
  const qs = ITunesClient.buildQuery({ id: itunesId, entity: 'song', country: 'ID' });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/lookup?${qs}`);
  const items = data?.results || [];

  // First result is collection (album), subsequent are tracks
  const albumItem = items.find((item) => item.wrapperType === 'collection');
  if (!albumItem) return null;

  const tracks = items
    .filter((item) => item.wrapperType === 'track')
    .map(ITunesMapper.toSong);

  const albumResponse = ITunesMapper.toAlbumSearch(albumItem);
  return {
    ...albumResponse,
    artist: albumItem.artistName || '',
    tracks: tracks,
  };
}

export async function getITunesPreviewUrl(title: string, artist: string): Promise<string | null> {
  const query = artist ? `${artist} ${title}` : title;
  const qs = ITunesClient.buildQuery({ term: query, media: 'music', entity: 'song', limit: 1, country: 'ID' });
  const data = await ITunesClient.fetch<{ results: ITunesResult[] }>(`/search?${qs}`);
  return data?.results?.[0]?.previewUrl || null;
}
