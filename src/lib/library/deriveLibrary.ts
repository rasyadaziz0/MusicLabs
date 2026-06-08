import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

export interface LibraryArtist {
  id: string;
  name: string;
  imageUrl?: string;
  songCount: number;
  primarySong: Song;
}

export interface LibraryAlbum {
  id: string;
  name: string;
  artistName: string;
  imageUrl?: string;
  year?: string;
  songCount: number;
  primarySong: Song;
}

function dedupeSongs(songs: Song[]) {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (!song?.id || seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

export function buildLibrarySongs(...songGroups: Song[][]): Song[] {
  return dedupeSongs(songGroups.flat());
}

export function buildLibraryArtists(songs: Song[]): LibraryArtist[] {
  const artistMap = new Map<string, LibraryArtist>();

  for (const song of dedupeSongs(songs)) {
    for (const artist of song.artists?.primary ?? []) {
      const key = artist.id || artist.name.trim().toLowerCase();
      if (!key) continue;

      const existing = artistMap.get(key);
      if (existing) {
        existing.songCount += 1;
        continue;
      }

      artistMap.set(key, {
        id: artist.id || key,
        name: artist.name,
        imageUrl: getBestImageUrl(artist.image),
        songCount: 1,
        primarySong: song,
      });
    }
  }

  return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildLibraryAlbums(songs: Song[]): LibraryAlbum[] {
  const albumMap = new Map<string, LibraryAlbum>();

  for (const song of dedupeSongs(songs)) {
    const album = song.album;
    if (!album?.name) continue;

    const artistName = song.artists?.primary?.[0]?.name ?? 'Unknown Artist';
    const key = album.id || `${album.name.toLowerCase()}::${artistName.toLowerCase()}`;
    const existing = albumMap.get(key);

    if (existing) {
      existing.songCount += 1;
      continue;
    }

    albumMap.set(key, {
      id: album.id || key,
      name: album.name,
      artistName,
      imageUrl: getBestImageUrl(song.image),
      year: song.year,
      songCount: 1,
      primarySong: song,
    });
  }

  return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
