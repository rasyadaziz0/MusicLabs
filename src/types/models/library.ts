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
