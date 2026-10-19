
export class FuzzyStringMatcher {

  public static normalizeSearchText(value: string): string {
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

  public static stripMusicMetadata(value: string): string {
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

  public static getEditDistance(a: string, b: string): number {
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
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );

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


  public static getBigramSimilarity(a: string, b: string): number {
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
  public static getBestTokenMatch(token: string, targetTokens: string[]): number {
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
        const dist = this.getEditDistance(token, target);
        if (dist <= maxEdits) {
          const typoScore = 1 - dist / Math.max(token.length, target.length);
          best = Math.max(best, 0.8 * typoScore);
        }
      }

      if (token.length >= 4 && target.length >= 4) {
        const biScore = this.getBigramSimilarity(token, target);
        if (biScore >= 0.75) {
          best = Math.max(best, 0.75 * biScore);
        }
      }
    }

    return best;
  }
}
