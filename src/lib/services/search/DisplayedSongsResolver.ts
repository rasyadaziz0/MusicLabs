import * as SearchHelper from '@/lib/utils/search';
import { SearchArtistResult } from '@/types/hooks/search';
import { Song } from '@/types/music';

export class DisplayedSongsResolver {
  /**
   * Resolves the list of displayed songs depending on selected artist filter and fallbacks.
   */
  public static resolve(params: {
    selectedArtist: SearchArtistResult | null;
    artistSongs: Song[];
    artistNameSongs: Song[];
    songsFromQuery: Song[];
    rankedSongs: Song[];
    fallbackSongs: Song[];
  }): Song[] {
    const {
      selectedArtist,
      artistSongs,
      artistNameSongs,
      songsFromQuery,
      rankedSongs,
      fallbackSongs,
    } = params;

    if (selectedArtist) {
      if (artistSongs.length > 0) return artistSongs;
      if (artistNameSongs.length > 0) return artistNameSongs;

      const filteredFromQuery = songsFromQuery.filter((song: Song) =>
        SearchHelper.isArtistMatch(song, selectedArtist.title)
      );
      if (filteredFromQuery.length > 0) return filteredFromQuery;
      return [];
    }

    if (rankedSongs.length > 0) return rankedSongs;
    return fallbackSongs;
  }
}
