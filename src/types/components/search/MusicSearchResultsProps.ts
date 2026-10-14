import { SearchArtistResult, TopSearchResultItem } from '@/types/hooks/search';
import { Song } from '@/types/music';

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
  topResult?: TopSearchResultItem | null;
  topResults?: TopSearchResultItem[];
}
