import * as SearchHelper from '@/lib/utils/search';
import { RawSearchArtistResult, SearchArtistResult } from '@/types/hooks/search';
import { Song } from '@/types/music';

export class SearchDataNormalizer {
  /**
   * Normalizes raw artist search results and enriches with unique artists
   * found in the songs list whose names closely match the search query.
   */
  public static normalizeArtists(
    rawArtistsData: { results?: RawSearchArtistResult[] } | null | undefined,
    rawSongs: Song[],
    safeQuery: string
  ): SearchArtistResult[] {
    const normalizedArtists: SearchArtistResult[] = (rawArtistsData?.results ?? [])
      .map((artist: RawSearchArtistResult) => ({
        id: artist?.id,
        title: artist?.title || artist?.name || '',
        description: artist?.description || artist?.role || 'Artist',
        image: artist?.image || [],
      }))
      .filter((artist: SearchArtistResult) => Boolean(artist.id && artist.title));

    // Extract artists from matching songs if not already in artists list
    const existingArtistNames = new Set(
      normalizedArtists.map((a) => SearchHelper.normalizeSearchText(a.title))
    );

    for (const song of rawSongs) {
      const primaries = song.artists?.primary || [];
      for (const primary of primaries) {
        if (primary && primary.name) {
          const normArtist = SearchHelper.normalizeSearchText(primary.name);
          if (!existingArtistNames.has(normArtist)) {
            const score = SearchHelper.scoreArtistMatch(primary.name, safeQuery);
            if (score >= 65) {
              normalizedArtists.push({
                id: primary.id || `search-${encodeURIComponent(primary.name)}`,
                title: primary.name,
                description: 'Artist',
                image: song.image || [],
              });
              existingArtistNames.add(normArtist);
            }
          }
        }
      }
    }

    return normalizedArtists;
  }
}
