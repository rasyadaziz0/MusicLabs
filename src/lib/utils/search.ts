import { Song } from '@/types/music';

/**
 * Normalizes text for search matching:
 * - Strips diacritics / accents (e.g. é -> e, ROSÉ -> rose)
 * - Expands & to 'and'
 * - Replaces $ with 's' (e.g. Ke$ha, A$AP)
 * - Replaces non-alphanumeric unicode with spaces
 * - Collapses multiple spaces and converts to lowercase
 */
export function normalizeSearchText(value: string): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\$/g, 's')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips secondary music metadata in parentheses, brackets, or after dashes:
 * e.g. "(feat. ...)", "[Remastered ...]", "(Official Audio)", "- Single"
 */
export function stripMusicMetadata(value: string): string {
  if (!value) return '';
  return value
    .replace(
      /\s*[\(\[][^\)\]]*(?:feat|ft\.|with|remaster|official|audio|video|lyrics|version|deluxe|edit|edition|mono|stereo|bonus|acoustic|live)[^\)\]]*[\)\]]/gi,
      ''
    )
    .replace(
      /\s*-\s*(?:single|ep|remaster(?:ed)?|deluxe|bonus|official|lyrics|audio).*$/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bounded Damerau-Levenshtein distance supporting insertions, deletions,
 * substitutions, and adjacent character transpositions.
 */
export function getEditDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d: number[][] = [];
  for (let i = 0; i <= al; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[al][bl];
}

/**
 * Character Bigram Dice Similarity for handling concatenated or space-less words
 * e.g. "blackpink" vs "black pink"
 */
export function getBigramSimilarity(a: string, b: string): number {
  const s1 = a.replace(/\s+/g, '');
  const s2 = b.replace(/\s+/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bi = str.slice(i, i + 2);
      bigrams.set(bi, (bigrams.get(bi) || 0) + 1);
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  for (const [bi, count1] of bg1.entries()) {
    const count2 = bg2.get(bi) || 0;
    intersection += Math.min(count1, count2);
  }

  const total = s1.length - 1 + (s2.length - 1);
  return (2 * intersection) / total;
}

/**
 * Determines the best match score for a token against target tokens with typo tolerance.
 */
export function getBestTokenMatch(token: string, targetTokens: string[]): number {
  if (!token || targetTokens.length === 0) return 0;

  let best = 0;
  const maxEdits = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;

  for (const target of targetTokens) {
    if (token === target) return 1.0;

    if (target.startsWith(token) || token.startsWith(target)) {
      const prefixScore =
        Math.min(token.length, target.length) / Math.max(token.length, target.length);
      best = Math.max(best, 0.85 * prefixScore);
      continue;
    }

    if (maxEdits > 0 && Math.abs(token.length - target.length) <= maxEdits) {
      const dist = getEditDistance(token, target);
      if (dist <= maxEdits) {
        const typoScore = 1 - dist / Math.max(token.length, target.length);
        best = Math.max(best, 0.8 * typoScore);
      }
    }

    if (token.length >= 4 && target.length >= 4) {
      const biScore = getBigramSimilarity(token, target);
      if (biScore >= 0.75) {
        best = Math.max(best, 0.75 * biScore);
      }
    }
  }

  return best;
}

/**
 * Penalty patterns for non-studio versions when not explicitly searched by user
 */
const LOW_PRIORITY_VARIANT_PATTERNS: Array<{ pattern: RegExp; penalty: number; keyword: string }> = [
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

export function getVariantPenalty(title: string, artistText: string, rawQuery: string): number {
  const normQuery = normalizeSearchText(rawQuery);
  const combined = `${title} ${artistText}`.toLowerCase();
  let penalty = 0;

  for (const { pattern, penalty: p, keyword } of LOW_PRIORITY_VARIANT_PATTERNS) {
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
export function scoreSongMatch(song: Song, query: string, apiIndex: number = 0): number {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return 0;

  const rawTitle = song.name || '';
  const cleanTitle = normalizeSearchText(stripMusicMetadata(rawTitle));
  const fullTitle = normalizeSearchText(rawTitle);

  const artistNames = [
    ...song.artists.primary,
    ...song.artists.featured,
    ...song.artists.all,
  ]
    .map((a) => normalizeSearchText(a.name))
    .filter(Boolean);
  const allArtistsText = artistNames.join(' ');
  const albumText = normalizeSearchText(song.album?.name || '');

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
      const matchTitle = getBestTokenMatch(word, titleTokens);
      const matchArtist = Math.max(
        getBestTokenMatch(word, artistTokens),
        getBestTokenMatch(word, albumTokens) * 0.8
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
    const bestTitle = getBestTokenMatch(queryWords[0], titleTokens);
    const bestArtist = getBestTokenMatch(queryWords[0], artistTokens);
    const bestToken = Math.max(bestTitle, bestArtist);

    if (bestToken >= 0.8) {
      baseScore = Math.max(baseScore, 75 * bestToken);
    }
  }

  // Penalize non-studio variants
  const penalty = getVariantPenalty(rawTitle, allArtistsText, query);
  const finalScore = Math.max(0, baseScore - penalty - apiIndex * 0.5);

  return Math.round(finalScore * 10) / 10;
}

/**
 * Evaluates match score for an artist against a query.
 */
export function scoreArtistMatch(
  artist: { title?: string; name?: string } | string,
  query: string,
  apiIndex: number = 0
): number {
  const rawName = typeof artist === 'string' ? artist : artist.title || artist.name || '';
  const normQuery = normalizeSearchText(query);
  const normName = normalizeSearchText(rawName);

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
      totalMatch += getBestTokenMatch(qWord, nameTokens);
    }
    const coverage = totalMatch / queryWords.length;
    if (coverage >= 0.75) {
      score = 85 * coverage;
    } else {
      const bi = getBigramSimilarity(normName, normQuery);
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
export function scoreAlbumMatch(
  album: { title?: string; name?: string; artist?: string; nb_tracks?: number },
  query: string,
  apiIndex: number = 0
): number {
  const rawTitle = album.title || album.name || '';
  const cleanTitle = normalizeSearchText(stripMusicMetadata(rawTitle));
  const fullTitle = normalizeSearchText(rawTitle);
  const normQuery = normalizeSearchText(query);
  const normArtist = normalizeSearchText(album.artist || '');

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
      if (getBestTokenMatch(w, titleTokens) >= 0.7) inTitle++;
      if (getBestTokenMatch(w, artistTokens) >= 0.7) inArtist++;
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
export function getMatchScore(text: string, query: string): number {
  if (!text || !query) return 0;
  const normText = normalizeSearchText(text);
  const normQuery = normalizeSearchText(query);
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

export function isArtistMatch(song: Song, artistName: string): boolean {
  const target = normalizeSearchText(artistName);
  if (!target) return false;

  const names = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
    .map((a) => normalizeSearchText(a.name))
    .filter(Boolean);

  return names.some(
    (name) =>
      name === target ||
      name.startsWith(target) ||
      target.startsWith(name) ||
      name.includes(target)
  );
}

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


