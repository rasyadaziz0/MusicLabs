import { Song } from '../music';

export interface SearchArtistResult {
  id: string;
  title: string;
  description?: string;
  image?: { quality: string; url: string }[];
}

export interface RawSearchArtistResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  role?: string;
  image?: { quality: string; url: string }[];
}

export type TopSearchResultItem =
  | { type: 'song'; data: Song }
  | { type: 'artist'; data: SearchArtistResult }
  | { type: 'album'; data: any };
