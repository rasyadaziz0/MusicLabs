import { Song } from '@/types/music';
import { ArtistParser } from '@/lib/utils/ArtistParser';
import { ITunesResult } from './types';

export class ITunesMapper {
  /**
   * Converts iTunes API response item to our internal Song format
   */
  static toSong(item: ITunesResult): Song {
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
      artists: (() => {
        const parsedArtists = ArtistParser.parse(
          item.artistName,
          'itunes-artist',
          item.artistId ? `itunes-artist-${item.artistId}` : null
        );
        return {
          primary: parsedArtists,
          featured: [],
          all: parsedArtists,
        };
      })(),
      image: [
        { quality: '500x500', url: artworkLarge },
        { quality: '150x150', url: artworkMedium },
      ].filter((i) => i.url),
      downloadUrl: [],
      preview: item.previewUrl || '',
      genre: item.primaryGenreName || '',
    };
  }

  /**
   * Converts iTunes API response item to our internal Artist search format
   */
  static toArtistSearch(artist: ITunesResult) {
    return {
      id: `itunes-artist-${artist.artistId}`,
      title: artist.artistName || 'Unknown',
      description: artist.primaryGenreName || 'Artist',
      image: [], // iTunes doesn't return artist images in search
      url: artist.artistLinkUrl || ''
    };
  }

  /**
   * Converts iTunes API response item to our internal Album format
   */
  static toAlbumSearch(album: ITunesResult) {
    const cover = album.artworkUrl100?.replace('100x100bb', '600x600bb') || '';
    return {
      id: `itunes-album-${album.collectionId}`,
      title: album.collectionName || 'Unknown Album',
      artist: album.artistName || 'Unknown Artist',
      artist_id: album.artistId ? `itunes-artist-${album.artistId}` : null,
      cover: cover,
      cover_small: album.artworkUrl100 || '',
      cover_medium: album.artworkUrl100?.replace('100x100bb', '300x300bb') || '',
      cover_big: cover,
      cover_xl: cover,
      nb_tracks: album.trackCount || 0,
      release_date: album.releaseDate || '',
      album_type: album.collectionType?.toLowerCase() || 'album',
    };
  }
}
