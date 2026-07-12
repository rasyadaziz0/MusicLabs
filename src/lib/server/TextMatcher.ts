/**
 * TextMatcher — utility class for fuzzy string matching.
 *
 * Provides normalized word-set comparison, Jaccard similarity,
 * word containment checks, and composite confidence scoring
 * tuned for matching song titles and artist names.
 */
export class TextMatcher {
  /** Normalize string: strip diacritics, lowercase */
  static normKey(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /** Remove noise words/brackets that confuse matching */
  static cleanForMatch(str: string): string {
    return str
      .replace(/\(.*?\)|\[.*?\]/g, '')           // (Deluxe), [Remastered], etc.
      .replace(/\s*[-–—]\s*(single|ep)\s*$/i, '') // - Single, - EP
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Extract primary artist (before feat/ft/& separators) */
  static extractPrimaryArtist(artist: string): string {
    return artist.split(/[,&/]| feat\.? | ft\.? /i)[0].trim();
  }

  /** Split string into a Set of lowercase words */
  private static wordSet(str: string): Set<string> {
    const normalized = this.normKey(str);
    return new Set(
      normalized.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0)
    );
  }

  /**
   * Jaccard similarity: |A ∩ B| / |A ∪ B|
   * @returns 0..1 where 1 = identical word sets
   */
  static jaccardSimilarity(a: string, b: string): number {
    const setA = this.wordSet(a);
    const setB = this.wordSet(b);
    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
  }

  /**
   * Check if ≥90% of the shorter string's words appear in the longer one.
   * Handles "Love Story" vs "Love Story (Taylor's Version)" gracefully.
   */
  static containsAllWords(shorter: string, longer: string): boolean {
    const shortWords = this.wordSet(shorter);
    const longWords = this.wordSet(longer);
    if (shortWords.size === 0) return false;

    let matches = 0;
    for (const word of shortWords) {
      if (longWords.has(word)) matches++;
    }
    return matches / shortWords.size >= 0.9;
  }

  /**
   * Compute a 0..100 confidence score for a candidate song match.
   *
   * Scoring breakdown:
   * - Title:    0–50 pts (Jaccard 40 + containment bonus 10)
   * - Artist:   0–35 pts (full Jaccard 25 + primary artist 10)
   * - Duration: 0–15 pts (±2s = 15, ±5s = 10, ±10s = 5, >30s = -10)
   */
  static computeMatchScore(
    candidateTitle: string,
    candidateArtist: string,
    candidateDurationMs: number | null,
    targetTitle: string,
    targetArtist: string,
    targetDurationSec: number | null,
  ): number {
    let score = 0;

    // ── Title scoring (0-50) ──
    const titleJaccard = this.jaccardSimilarity(candidateTitle, targetTitle);
    score += titleJaccard * 40;

    if (titleJaccard < 1 && (
      this.containsAllWords(targetTitle, candidateTitle) ||
      this.containsAllWords(candidateTitle, targetTitle)
    )) {
      score += 10;
    }

    // ── Artist scoring (0-35) ──
    const artistJaccard = this.jaccardSimilarity(candidateArtist, targetArtist);
    score += artistJaccard * 25;

    const candidatePrimary = this.extractPrimaryArtist(candidateArtist);
    const targetPrimary = this.extractPrimaryArtist(targetArtist);
    score += this.jaccardSimilarity(candidatePrimary, targetPrimary) * 10;

    // ── Duration scoring (0-15) ──
    if (candidateDurationMs != null && targetDurationSec != null && targetDurationSec > 0) {
      const candidateSec = candidateDurationMs / 1000;
      const diff = Math.abs(candidateSec - targetDurationSec);
      if (diff <= 2) score += 15;
      else if (diff <= 5) score += 10;
      else if (diff <= 10) score += 5;
      else if (diff > 30) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }
}
