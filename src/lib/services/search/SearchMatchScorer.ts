import { Song } from '@/types/music';
import { FuzzyStringMatcher } from './FuzzyStringMatcher';

interface VariantPattern {
  pattern: RegExp;
  penalty: number;
  keyword: string;
}

/**
 * SearchMatchScorer
 * Scores songs, artists, and albums against search queries with token synergy and variant penalties.
 */
export class SearchMatchScorer {
  private static readonly LOW_PRIORITY_VARIANT_PATTERNS: VariantPattern[] = [
    { pattern: /\bkaraoke\b/i, penalty: 50, keyword: 'karaoke' },
    { pattern: /\btribute\s+to\b|\bmade\s+famous\s+by\b/i, penalty: 55, keyword: 'tribute' },
    { pattern: /\binstrumental\b/i, penalty: 45, keyword: 'instrumental' },
    { pattern: /\b8\s*-?\s*bit\b|\blullaby\b/i, penalty: 40, keyword: 'lullaby' },
    { pattern: /\bsped\s+up\b|\bnightcore\b/i, penalty: 28, keyword: 'sped up' },
    { pattern: /\bslowed\b|\breverb\b/i, penalty: 25, keyword: 'slowed' },
    { pattern: /\bcover\b/i, penalty: 25, keyword: 'cover' },
    { pattern: /\bremix\b/i, penalty: 14, keyword: 'remix' },
    { pattern: /\blive\b/i, penalty: 10, keyword: 'live' },
  ];

  /**
   * Evaluates penalty for non-studio versions (karaoke, instrumental, sped up, live, etc.)
   */
  public static getVariantPenalty(title: string, artistText: string, rawQuery: string): number {
    const normQuery = FuzzyStringMatcher.normalizeSearchText(rawQuery);
    const combined = `${title} ${artistText}`.toLowerCase();
    let penalty = 0;

    for (const { pattern, penalty: p, keyword } of this.LOW_PRIORITY_VARIANT_PATTERNS) {
      if (pattern.test(combined)) {
        if (!normQuery.includes(keyword)) {
          penalty += p;
        }
      }
    }

    return penalty;
  }

  /**
   * Evaluates match score for a song against a query with cross-field token synergy.
   */
  public static scoreSongMatch(song: Song, query: string, apiIndex: number = 0): number {
    const normQuery = FuzzyStringMatcher.normalizeSearchText(query);
    if (!normQuery) return 0;

    const rawTitle = song.name || '';
    const cleanTitle = FuzzyStringMatcher.normalizeSearchText(FuzzyStringMatcher.stripMusicMetadata(rawTitle));
    const fullTitle = FuzzyStringMatcher.normalizeSearchText(rawTitle);

    const artistNames = [
      ...song.artists.primary,
      ...song.artists.featured,
      ...song.artists.all,
    ]
      .map((a) => FuzzyStringMatcher.normalizeSearchText(a.name))
      .filter(Boolean);
    const allArtistsText = artistNames.join(' ');
    const albumText = FuzzyStringMatcher.normalizeSearchText(song.album?.name || '');

    let baseScore = 0;

    // Exact matches
    if (fullTitle === normQuery) baseScore = Math.max(baseScore, 160);
    if (cleanTitle === normQuery) baseScore = Math.max(baseScore, 150);

    // Starts with
    if (cleanTitle.startsWith(normQuery)) baseScore = Math.max(baseScore, 110);
    else if (fullTitle.startsWith(normQuery)) baseScore = Math.max(baseScore, 100);

    // Substring
    if (cleanTitle.includes(normQuery)) baseScore = Math.max(baseScore, 85);
    else if (fullTitle.includes(normQuery)) baseScore = Math.max(baseScore, 75);

    // Artist exact / startsWith
    for (const artistName of artistNames) {
      if (artistName === normQuery) baseScore = Math.max(baseScore, 120);
      else if (artistName.startsWith(normQuery)) baseScore = Math.max(baseScore, 90);
      else if (artistName.includes(normQuery)) baseScore = Math.max(baseScore, 65);
    }

    // Cross-Field Token Synergy (Artist + Song Combined)
    const queryWords = normQuery.split(' ').filter(Boolean);
    if (queryWords.length >= 2) {
      const titleTokens = `${cleanTitle} ${fullTitle}`.split(' ').filter(Boolean);
      const artistTokens = allArtistsText.split(' ').filter(Boolean);
      const albumTokens = albumText.split(' ').filter(Boolean);

      let matchedInTitle = 0;
      let matchedInArtist = 0;
      let matchedTotal = 0;

      for (const word of queryWords) {
        const matchTitle = FuzzyStringMatcher.getBestTokenMatch(word, titleTokens);
        const matchArtist = Math.max(
          FuzzyStringMatcher.getBestTokenMatch(word, artistTokens),
          FuzzyStringMatcher.getBestTokenMatch(word, albumTokens) * 0.8
        );

        if (matchTitle >= 0.7) matchedInTitle++;
        if (matchArtist >= 0.7) matchedInArtist++;
        if (matchTitle >= 0.7 || matchArtist >= 0.7) matchedTotal++;
      }

      const combinedCoverage = matchedTotal / queryWords.length;
      if (combinedCoverage >= 0.72 && matchedInTitle >= 1 && matchedInArtist >= 1) {
        const synergyScore =
          125 + combinedCoverage * 45 + (combinedCoverage === 1.0 ? 15 : 0);
        baseScore = Math.max(baseScore, synergyScore);
      } else if (combinedCoverage >= 0.6) {
        const partialScore = 70 + combinedCoverage * 35;
        baseScore = Math.max(baseScore, partialScore);
      }
    } else if (queryWords.length === 1 && baseScore === 0) {
      // Single word token fuzzy match
      const titleTokens = cleanTitle.split(' ').filter(Boolean);
      const artistTokens = allArtistsText.split(' ').filter(Boolean);
      const bestTitle = FuzzyStringMatcher.getBestTokenMatch(queryWords[0], titleTokens);
      const bestArtist = FuzzyStringMatcher.getBestTokenMatch(queryWords[0], artistTokens);
      const bestToken = Math.max(bestTitle, bestArtist);

      if (bestToken >= 0.8) {
        baseScore = Math.max(baseScore, 75 * bestToken);
      }
    }

    // Penalize non-studio variants
    const penalty = this.getVariantPenalty(rawTitle, allArtistsText, query);
    const finalScore = Math.max(0, baseScore - penalty - apiIndex * 0.5);

    return Math.round(finalScore * 10) / 10;
  }

  /**
   * Evaluates match score for an artist against a query.
   */
  public static scoreArtistMatch(
    artist: { title?: string; name?: string } | string,
    query: string,
    apiIndex: number = 0
  ): number {
    const rawName = typeof artist === 'string' ? artist : artist.title || artist.name || '';
    const normQuery = FuzzyStringMatcher.normalizeSearchText(query);
    const normName = FuzzyStringMatcher.normalizeSearchText(rawName);

    if (!normQuery || !normName) return 0;

    let score = 0;

    if (normName === normQuery) {
      score = 140;
    } else if (normName.startsWith(normQuery)) {
      score = 105;
    } else if (normName.includes(normQuery)) {
      score = 75;
    } else {
      const queryWords = normQuery.split(' ').filter(Boolean);
      const nameTokens = normName.split(' ').filter(Boolean);

      let totalMatch = 0;
      for (const qWord of queryWords) {
        totalMatch += FuzzyStringMatcher.getBestTokenMatch(qWord, nameTokens);
      }
      const coverage = totalMatch / queryWords.length;
      if (coverage >= 0.75) {
        score = 85 * coverage;
      } else {
        const bi = FuzzyStringMatcher.getBigramSimilarity(normName, normQuery);
        if (bi >= 0.7) {
          score = 70 * bi;
        }
      }
    }

    const finalScore = Math.max(0, score - apiIndex * 0.5);
    return Math.round(finalScore * 10) / 10;
  }

  /**
   * Evaluates match score for an album against a query.
   */
  public static scoreAlbumMatch(
    album: { title?: string; name?: string; artist?: string; nb_tracks?: number },
    query: string,
    apiIndex: number = 0
  ): number {
    const rawTitle = album.title || album.name || '';
    const cleanTitle = FuzzyStringMatcher.normalizeSearchText(FuzzyStringMatcher.stripMusicMetadata(rawTitle));
    const fullTitle = FuzzyStringMatcher.normalizeSearchText(rawTitle);
    const normQuery = FuzzyStringMatcher.normalizeSearchText(query);
    const normArtist = FuzzyStringMatcher.normalizeSearchText(album.artist || '');

    if (!normQuery) return 0;

    let baseScore = 0;

    if (fullTitle === normQuery) baseScore = 150;
    else if (cleanTitle === normQuery) baseScore = 140;
    else if (cleanTitle.startsWith(normQuery)) baseScore = 100;
    else if (cleanTitle.includes(normQuery)) baseScore = 75;

    const queryWords = normQuery.split(' ').filter(Boolean);
    if (queryWords.length >= 2) {
      const titleTokens = cleanTitle.split(' ').filter(Boolean);
      const artistTokens = normArtist.split(' ').filter(Boolean);

      let inTitle = 0;
      let inArtist = 0;
      for (const w of queryWords) {
        if (FuzzyStringMatcher.getBestTokenMatch(w, titleTokens) >= 0.7) inTitle++;
        if (FuzzyStringMatcher.getBestTokenMatch(w, artistTokens) >= 0.7) inArtist++;
      }
      const coverage = (inTitle + inArtist) / queryWords.length;
      if (coverage >= 0.75 && inTitle >= 1) {
        baseScore = Math.max(baseScore, 120 + coverage * 35);
      }
    }

    // Full album boost (+6)
    if (
      (album.nb_tracks || 0) >= 4 &&
      !rawTitle.toLowerCase().includes('- single') &&
      baseScore > 50
    ) {
      baseScore += 6;
    }

    const finalScore = Math.max(0, baseScore - apiIndex * 0.5);
    return Math.round(finalScore * 10) / 10;
  }

  /**
   * Legacy getMatchScore helper for backwards compatibility
   */
  public static getMatchScore(text: string, query: string): number {
    if (!text || !query) return 0;
    const normText = FuzzyStringMatcher.normalizeSearchText(text);
    const normQuery = FuzzyStringMatcher.normalizeSearchText(query);
    if (normText === normQuery) return 120;
    if (normText.startsWith(normQuery)) return 80;
    if (normText.includes(normQuery)) return 50;

    const queryWords = normQuery.split(' ').filter(Boolean);
    let matched = 0;
    for (const w of queryWords) {
      if (normText.includes(w)) matched++;
    }
    return matched > 0 ? matched * 10 : 0;
  }

  /**
   * Checks if any artist name on the song matches the target artist name.
   */
  public static isArtistMatch(song: Song, artistName: string): boolean {
    const target = FuzzyStringMatcher.normalizeSearchText(artistName);
    if (!target) return false;

    const names = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
      .map((a) => FuzzyStringMatcher.normalizeSearchText(a.name))
      .filter(Boolean);

    return names.some(
      (name) =>
        name === target ||
        name.startsWith(target) ||
        target.startsWith(name) ||
        name.includes(target)
    );
  }
}
