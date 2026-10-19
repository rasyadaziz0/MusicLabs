import { Song } from '@/types/music';
import { FuzzyStringMatcher } from '@/lib/services/search/FuzzyStringMatcher';
import { SearchMatchScorer } from '@/lib/services/search/SearchMatchScorer';

export { FuzzyStringMatcher, SearchMatchScorer };

/**
 * Normalizes text for search matching (diacritics, accents, symbols).
 */
export function normalizeSearchText(value: string): string {
  return FuzzyStringMatcher.normalizeSearchText(value);
}

/**
 * Strips secondary music metadata in parentheses, brackets, or after dashes.
 */
export function stripMusicMetadata(value: string): string {
  return FuzzyStringMatcher.stripMusicMetadata(value);
}

/**
 * Bounded Damerau-Levenshtein distance supporting insertions, deletions, substitutions, and transpositions.
 */
export function getEditDistance(a: string, b: string): number {
  return FuzzyStringMatcher.getEditDistance(a, b);
}

/**
 * Character Bigram Dice Similarity for handling concatenated or space-less words.
 */
export function getBigramSimilarity(a: string, b: string): number {
  return FuzzyStringMatcher.getBigramSimilarity(a, b);
}

/**
 * Determines the best match score for a token against target tokens with typo tolerance.
 */
export function getBestTokenMatch(token: string, targetTokens: string[]): number {
  return FuzzyStringMatcher.getBestTokenMatch(token, targetTokens);
}

/**
 * Penalty patterns for non-studio versions when not explicitly searched by user.
 */
export function getVariantPenalty(title: string, artistText: string, rawQuery: string): number {
  return SearchMatchScorer.getVariantPenalty(title, artistText, rawQuery);
}

/**
 * Evaluates match score for a song against a query with cross-field token synergy.
 */
export function scoreSongMatch(song: Song, query: string, apiIndex: number = 0): number {
  return SearchMatchScorer.scoreSongMatch(song, query, apiIndex);
}

/**
 * Evaluates match score for an artist against a query.
 */
export function scoreArtistMatch(
  artist: { title?: string; name?: string } | string,
  query: string,
  apiIndex: number = 0
): number {
  return SearchMatchScorer.scoreArtistMatch(artist, query, apiIndex);
}

/**
 * Evaluates match score for an album against a query.
 */
export function scoreAlbumMatch(
  album: { title?: string; name?: string; artist?: string; nb_tracks?: number },
  query: string,
  apiIndex: number = 0
): number {
  return SearchMatchScorer.scoreAlbumMatch(album, query, apiIndex);
}

/**
 * Legacy getMatchScore helper for backwards compatibility.
 */
export function getMatchScore(text: string, query: string): number {
  return SearchMatchScorer.getMatchScore(text, query);
}

/**
 * Checks if any artist name on the song matches the target artist name.
 */
export function isArtistMatch(song: Song, artistName: string): boolean {
  return SearchMatchScorer.isArtistMatch(song, artistName);
}

/**
 * Composite helper object maintaining backwards compatibility.
 */
export const SearchHelper = {
  normalizeSearchText,
  stripMusicMetadata,
  getEditDistance,
  getBigramSimilarity,
  getBestTokenMatch,
  getVariantPenalty,
  scoreSongMatch,
  scoreArtistMatch,
  scoreAlbumMatch,
  getMatchScore,
  isArtistMatch,
};
