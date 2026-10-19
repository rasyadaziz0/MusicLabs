import * as SearchHelper from '@/lib/utils/search';
import { SearchArtistResult } from '@/types/hooks/search';
import { Song } from '@/types/music';

export interface RankedArtistItem {
  artist: SearchArtistResult;
  score: number;
  index: number;
}

export interface RankedSongItem {
  song: Song;
  score: number;
  index: number;
}

export interface RankedAlbumItem {
  album: any;
  score: number;
  index: number;
}

export class MusicSearchRanker {
  /**
   * Scores and ranks artists by fuzzy search relevance.
   */
  public static rankArtists(
    artists: SearchArtistResult[],
    query: string
  ): RankedArtistItem[] {
    if (!query) {
      return artists.map((artist, index) => ({ artist, score: 0, index }));
    }

    return artists
      .map((artist, index) => ({
        artist,
        score: SearchHelper.scoreArtistMatch(artist.title, query, index),
        index,
      }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }

  /**
   * Identifies if the top artist candidate has a decisive dominant score (>= 105).
   */
  public static detectDominantArtist(
    rankedArtists: RankedArtistItem[]
  ): SearchArtistResult | null {
    const topCandidate = rankedArtists[0];
    return topCandidate && topCandidate.score >= 105 ? topCandidate.artist : null;
  }

  /**
   * Merges primary song search results with dominant artist top tracks,
   * dedupes by song id, and ranks all songs with bonus score if matching dominant artist.
   */
  public static mergeAndRankSongs(
    songs: Song[],
    dominantArtistTopTracks: Song[],
    dominantArtist: SearchArtistResult | null,
    query: string
  ): RankedSongItem[] {
    const songMap = new Map<string, Song>();
    for (const s of songs) {
      if (s?.id) songMap.set(s.id, s);
    }
    for (const s of dominantArtistTopTracks) {
      if (s?.id && !songMap.has(s.id)) {
        songMap.set(s.id, s);
      }
    }

    const allSongs = Array.from(songMap.values());
    if (!query) {
      return allSongs.map((song, index) => ({ song, score: 0, index }));
    }

    return allSongs
      .map((song, index) => {
        let score = SearchHelper.scoreSongMatch(song, query, index);
        if (dominantArtist && SearchHelper.isArtistMatch(song, dominantArtist.title)) {
          score += 15;
        }
        return { song, score, index };
      })
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }

  /**
   * Scores and ranks albums by fuzzy match against query.
   */
  public static rankAlbums(albums: any[], query: string): RankedAlbumItem[] {
    if (!query) {
      return albums.map((album, index) => ({ album, score: 0, index }));
    }

    return albums
      .map((album, index) => ({
        album,
        score: SearchHelper.scoreAlbumMatch(album, query, index),
        index,
      }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }
}
