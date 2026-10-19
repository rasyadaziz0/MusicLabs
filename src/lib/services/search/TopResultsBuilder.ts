import * as SearchHelper from '@/lib/utils/search';
import { TopSearchResultItem } from '@/types/hooks/search';
import { RankedAlbumItem, RankedArtistItem, RankedSongItem } from './MusicSearchRanker';

export interface TopResultsOutcome {
  topResults: TopSearchResultItem[];
  topResult: TopSearchResultItem | null;
}

export class TopResultsBuilder {
  /**
   * Constructs the top 6 contextual search results grid based on scores and primary type.
   */
  public static build(
    rankedSongsWithScore: RankedSongItem[],
    rankedArtistsWithScore: RankedArtistItem[],
    rankedAlbumsWithScore: RankedAlbumItem[],
    trimmedQuery: string
  ): TopResultsOutcome {
    if (!trimmedQuery || trimmedQuery.length < 1) {
      return { topResults: [], topResult: null };
    }

    const topSongEntry = rankedSongsWithScore[0];
    const topArtistEntry = rankedArtistsWithScore[0];
    const topAlbumEntry = rankedAlbumsWithScore[0];

    if (!topSongEntry && !topArtistEntry && !topAlbumEntry) {
      return { topResults: [], topResult: null };
    }

    // Determine #1 top item with tie-breaker
    let primaryType: 'song' | 'artist' | 'album' = 'song';
    const songScore = topSongEntry?.score ?? -1;
    let artistScore = topArtistEntry?.score ?? -1;
    const albumScore = topAlbumEntry?.score ?? -1;

    // Tie-breaker: If user typed artist name exactly, give artist +8 bonus
    const normQ = SearchHelper.normalizeSearchText(trimmedQuery);
    const normTopArtist = SearchHelper.normalizeSearchText(topArtistEntry?.artist?.title || '');
    if (normTopArtist && normQ === normTopArtist) {
      artistScore += 8;
    }

    if (artistScore >= songScore && artistScore >= albumScore) {
      primaryType = 'artist';
    } else if (albumScore > songScore && albumScore > artistScore) {
      primaryType = 'album';
    } else {
      primaryType = 'song';
    }

    const results: TopSearchResultItem[] = [];
    const addedSongIds = new Set<string>();
    const addedArtistIds = new Set<string>();
    const addedAlbumIds = new Set<string>();

    if (primaryType === 'artist' && topArtistEntry) {
      results.push({ type: 'artist', data: topArtistEntry.artist });
      addedArtistIds.add(topArtistEntry.artist.id);

      // Add top songs from this artist
      const artistSongs = rankedSongsWithScore.filter((s) =>
        SearchHelper.isArtistMatch(s.song, topArtistEntry.artist.title)
      );
      for (const item of artistSongs.slice(0, 3)) {
        results.push({ type: 'song', data: item.song });
        addedSongIds.add(item.song.id);
      }

      // Add relevant album from this artist
      const artistAlbum = rankedAlbumsWithScore.find((a) =>
        SearchHelper.normalizeSearchText(a.album.artist || '').includes(
          SearchHelper.normalizeSearchText(topArtistEntry.artist.title)
        )
      );
      if (artistAlbum) {
        results.push({ type: 'album', data: artistAlbum.album });
        addedAlbumIds.add(artistAlbum.album.id);
      }

      // Fill remaining slots up to 6
      for (const item of rankedSongsWithScore) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    } else if (primaryType === 'album' && topAlbumEntry) {
      results.push({ type: 'album', data: topAlbumEntry.album });
      addedAlbumIds.add(topAlbumEntry.album.id);

      if (topArtistEntry && !addedArtistIds.has(topArtistEntry.artist.id)) {
        results.push({ type: 'artist', data: topArtistEntry.artist });
        addedArtistIds.add(topArtistEntry.artist.id);
      }

      for (const item of rankedSongsWithScore.slice(0, 4)) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    } else {
      // primaryType === 'song'
      if (topSongEntry) {
        results.push({ type: 'song', data: topSongEntry.song });
        addedSongIds.add(topSongEntry.song.id);
      }

      // Next best song
      const secondSong = rankedSongsWithScore[1];
      if (secondSong && !addedSongIds.has(secondSong.song.id)) {
        results.push({ type: 'song', data: secondSong.song });
        addedSongIds.add(secondSong.song.id);
      }

      // Artist of top song
      if (topArtistEntry && !addedArtistIds.has(topArtistEntry.artist.id)) {
        results.push({ type: 'artist', data: topArtistEntry.artist });
        addedArtistIds.add(topArtistEntry.artist.id);
      }

      // Album if high score
      if (topAlbumEntry && topAlbumEntry.score >= 85 && !addedAlbumIds.has(topAlbumEntry.album.id)) {
        results.push({ type: 'album', data: topAlbumEntry.album });
        addedAlbumIds.add(topAlbumEntry.album.id);
      }

      // Fill remaining slots
      for (const item of rankedSongsWithScore) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    }

    return { topResults: results, topResult: results[0] ?? null };
  }
}
