import { Song } from '@/types/music';
import { SearchArtistResult } from '@/types/hooks/search';

export interface MusicSearchResultsProps {
  isLoading: boolean;
  rankedArtists: SearchArtistResult[];
  rankedAlbums: any[];
  displayedSongs: Song[];
  query: string;
  isArtistSongsLoading: boolean;
  isArtistNameSongsLoading: boolean;
  selectedArtist: SearchArtistResult | null;
  rankedSongsLength: number;
  topResult?: { type: 'song'; data: Song } | { type: 'artist'; data: SearchArtistResult } | null;
}
