import YTMusic from 'ytmusic-api';
import { Song } from '@/types/music';
import { ArtistParser } from '@/lib/utils/ArtistParser';

type YTMusicSong = {
  videoId?: string;
  name?: string;
  artist?: { name?: string; artistId?: string | null };
  album?: { name?: string; albumId?: string } | null;
  duration?: number | null;
  thumbnails?: Array<{ url?: string; width?: number; height?: number }>;
};

type YTMusicArtist = {
  artistId?: string | null;
  name?: string;
  thumbnails?: Array<{ url?: string; width?: number; height?: number }>;
};

type SearchArtistResult = {
  id: string;
  title: string;
  description: string;
  image: Array<{ quality: string; url: string }>;
};


let ytmusicClientPromise: Promise<YTMusic> | null = null;

export async function getYtMusicClient() {
  if (!ytmusicClientPromise) {
    ytmusicClientPromise = (async () => {
      const client = new YTMusic();
      await client.initialize();
      return client;
    })();
  }
  return ytmusicClientPromise;
}

function toImageList(
  thumbnails: Array<{ url?: string; width?: number; height?: number }> = []
) {
  const sanitizeThumbUrl = (url: string) => url.replace(/[)\]}>\s]+$/g, '');

  return thumbnails
    .filter((item) => item?.url)
    .map((item) => ({
      quality: `${item.width ?? 0}x${item.height ?? 0}`,
      url: sanitizeThumbUrl(item.url as string),
    }));
}

export function mapYtSongToAppSong(song: YTMusicSong): Song | null {
  if (!song?.videoId) return null;

  const artistName = song.artist?.name || 'Unknown Artist';
  const artistId = song.artist?.artistId || `artist-${song.videoId}`;
  const albumName = song.album?.name || 'Single';
  const albumId = song.album?.albumId || `album-${song.videoId}`;
  const images = toImageList(song.thumbnails);

  return {
    id: song.videoId,
    name: song.name || 'Unknown Title',
    type: 'song',
    year: '',
    releaseDate: null,
    duration: typeof song.duration === 'number' ? song.duration : 0,
    label: 'YouTube Music',
    explicitContent: false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: `https://music.youtube.com/watch?v=${song.videoId}`,
    copyright: '',
    album: {
      id: albumId,
      name: albumName,
      url: `https://music.youtube.com/browse/${albumId}`,
    },
    artists: (() => {
      const parsed = ArtistParser.parse(
        song.artist?.name || 'Unknown Artist',
        'artist',
        song.artist?.artistId || `artist-${song.videoId}`,
        images
      );
      return { primary: parsed, featured: [], all: parsed };
    })(),
    image: images,
    downloadUrl: [
      {
        quality: '320kbps',
        // Keep audio URL on same origin; server route resolves latest stream from Piped.
        url: `/api/audio/${song.videoId}`,
      },
    ],
  };
}

export function mapYoutubeApiToAppSong(item: any): Song | null {
  if (!item?.id?.videoId) return null;

  const videoId = item.id.videoId;
  const artistName = item.snippet?.channelTitle || 'Unknown Artist';
  const title = item.snippet?.title || 'Unknown Title';
  const thumbnailUrl = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';

  const images = thumbnailUrl ? [{ quality: '500x500', url: thumbnailUrl }] : [];

  return {
    id: videoId,
    name: title,
    type: 'song',
    year: '',
    releaseDate: null,
    duration: 0,
    label: 'YouTube',
    explicitContent: false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    copyright: '',
    album: { id: `album-${videoId}`, name: 'Single', url: '' },
    artists: (() => {
      const parsed = ArtistParser.parse(
        artistName,
        'artist',
        `artist-${videoId}`,
        images
      );
      return { primary: parsed, featured: [], all: parsed };
    })(),
    image: images,
    downloadUrl: [
      {
        quality: '320kbps',
        url: `/api/audio/${videoId}`,
      },
    ],
  };
}

export function mapUpNextToAppSong(item: any): Song | null {
  if (!item?.videoId) return null;

  const videoId = item.videoId;
  // Some upNext items return an array for artists, some a string.
  let artistName = 'Unknown Artist';
  if (Array.isArray(item.artists)) {
    artistName = item.artists.map((a: any) => a.name).join(', ');
  } else if (typeof item.artists === 'string') {
    artistName = item.artists;
  }

  const title = item.title || 'Unknown Title';
  const thumbnail = item.thumbnail || item.thumbnails?.[0]?.url || '';
  const images = thumbnail ? [{ quality: '500x500', url: thumbnail }] : [];
  
  // Parse duration string (e.g., "3:24" to seconds)
  let durationInSeconds = 0;
  if (typeof item.duration === 'string') {
    const parts = item.duration.split(':').map(Number);
    if (parts.length === 2) {
      durationInSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  } else if (typeof item.duration === 'number') {
    durationInSeconds = item.duration;
  }

  return {
    id: videoId,
    name: title,
    type: 'song',
    year: '',
    releaseDate: null,
    duration: durationInSeconds,
    label: 'YouTube Music',
    explicitContent: false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: `https://music.youtube.com/watch?v=${videoId}`,
    copyright: '',
    album: { id: `album-${videoId}`, name: 'Single', url: '' },
    artists: (() => {
      const parsed = ArtistParser.parse(
        item.artists || artistName,
        'artist',
        `artist-${videoId}`,
        images
      );
      return { primary: parsed, featured: [], all: parsed };
    })(),
    image: images,
    downloadUrl: [
      {
        quality: '320kbps',
        url: `/api/audio/${videoId}`,
      },
    ],
  };
}

export function mapYtArtistToSearchArtist(artist: YTMusicArtist): SearchArtistResult | null {
  if (!artist?.artistId || !artist?.name) return null;

  return {
    id: artist.artistId,
    title: artist.name,
    description: 'Artist',
    image: toImageList(artist.thumbnails),
  };
}



