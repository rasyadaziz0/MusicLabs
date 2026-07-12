import { TextMatcher } from './TextMatcher';

// ── Types ──────────────────────────────────────────────────────────

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
  trackName?: string;
  artistName?: string;
}

export interface LyricsResult {
  synced: boolean;
  type: 'yrc' | 'lrc';
  lyrics: string;
  source: 'netease' | 'lrclib' | 'ovh';
}

interface LyricsQuery {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number | null;
}

// ── LyricsService ──────────────────────────────────────────────────

/**
 * Service class encapsulating all lyrics-fetching logic.
 *
 * Provider cascade (ordered by quality):
 *   1. Netease (music.163.com) — YRC karaoke / LRC synced
 *   2. LRClib.net /api/get     — exact match by title+artist+duration
 *   3. LRClib.net /api/search  — fuzzy search with confidence scoring
 *   4. lyrics.ovh              — plain lyrics (last resort)
 *
 * Uses Singleton pattern for consistency with existing repositories.
 */
export class LyricsService {
  private static instance: LyricsService;

  /** Minimum confidence thresholds */
  private static readonly MIN_CONFIDENCE_SYNCED = 45;
  private static readonly MIN_CONFIDENCE_PLAIN = 35;

  private constructor() {}

  static getInstance(): LyricsService {
    if (!LyricsService.instance) {
      LyricsService.instance = new LyricsService();
    }
    return LyricsService.instance;
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Find lyrics for a given track, trying each provider in cascade.
   * @returns LyricsResult on success, or null if nothing found.
   */
  async findLyrics(query: LyricsQuery): Promise<LyricsResult | null> {
    const cleanTitle = TextMatcher.cleanForMatch(query.title);
    const cleanArtist = TextMatcher.cleanForMatch(query.artist);
    const cleanAlbum = query.album ? TextMatcher.cleanForMatch(query.album) : '';
    const primaryArtist = TextMatcher.extractPrimaryArtist(cleanArtist);
    const durationSec = query.durationSec ?? null;

    let fallbackPlainLyrics: string | null = null;
    let fallbackPlainConfidence = 0;

    // ── 1. Netease (YRC karaoke / LRC synced) ─────────────────
    const neteaseResult = await this.searchNetease(cleanTitle, cleanArtist, primaryArtist, durationSec);

    if (neteaseResult) {
      if (neteaseResult.type === 'yrc') {
        // YRC = per-word karaoke — best quality, return immediately
        return { synced: true, type: 'yrc', lyrics: neteaseResult.lyrics, source: 'netease' };
      }
      // Netease LRC — save as fallback, LRClib may have better timing
      fallbackPlainLyrics = neteaseResult.lyrics;
      fallbackPlainConfidence = neteaseResult.confidence;
    }

    // ── 2. LRClib exact match (/api/get) ──────────────────────
    const lrclibExact = await this.searchLrcLibExact(cleanTitle, cleanArtist, primaryArtist, cleanAlbum, durationSec);

    if (lrclibExact) {
      if (lrclibExact.syncedLyrics) {
        return { synced: true, type: 'lrc', lyrics: lrclibExact.syncedLyrics, source: 'lrclib' };
      }
      if (lrclibExact.plainLyrics && !fallbackPlainLyrics) {
        fallbackPlainLyrics = lrclibExact.plainLyrics;
        fallbackPlainConfidence = 80; // Exact match — high confidence
      }
    }

    // ── 3. LRClib fuzzy search (/api/search) ──────────────────
    const lrclibFuzzy = await this.searchLrcLibFuzzy(cleanTitle, cleanArtist, primaryArtist, durationSec);

    if (lrclibFuzzy) {
      if (lrclibFuzzy.synced) {
        return { synced: true, type: 'lrc', lyrics: lrclibFuzzy.lyrics, source: 'lrclib' };
      }
      if (lrclibFuzzy.plainLyrics && !fallbackPlainLyrics) {
        fallbackPlainLyrics = lrclibFuzzy.plainLyrics;
        fallbackPlainConfidence = lrclibFuzzy.confidence;
      }
    }

    // ── Return plain fallback if good enough ──────────────────
    if (fallbackPlainLyrics && fallbackPlainConfidence >= LyricsService.MIN_CONFIDENCE_PLAIN) {
      return { synced: false, type: 'lrc', lyrics: fallbackPlainLyrics, source: 'lrclib' };
    }

    // ── 4. lyrics.ovh (last resort — plain only) ──────────────
    const ovhResult = await this.searchOvh(cleanTitle, cleanArtist, primaryArtist);

    if (ovhResult) {
      return { synced: false, type: 'lrc', lyrics: ovhResult, source: 'ovh' };
    }

    return null;
  }

  // ── Provider: Netease ───────────────────────────────────────────

  private async searchNetease(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    durationSec: number | null,
  ): Promise<{ type: 'yrc' | 'lrc'; lyrics: string; confidence: number } | null> {
    try {
      // Try full artist first
      let result = await this.fetchNeteaseLrc(
        cleanTitle + ' ' + cleanArtist, cleanTitle, cleanArtist, durationSec
      );

      // Retry with primary artist only
      if (!result && primaryArtist !== cleanArtist) {
        result = await this.fetchNeteaseLrc(
          cleanTitle + ' ' + primaryArtist, cleanTitle, cleanArtist, durationSec
        );
      }

      // Fallback: try iTunes for translated/alternate title
      if (!result) {
        result = await this.tryItunesTitleFallback(cleanTitle, cleanArtist, primaryArtist, durationSec);
      }

      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        console.warn('Netease search timed out (>15s)');
      } else {
        console.error('Netease search failed:', err);
      }
      return null;
    }
  }

  private async fetchNeteaseLrc(
    searchQuery: string,
    searchTitle: string,
    targetArtist: string,
    targetDurationSec: number | null,
  ): Promise<{ type: 'yrc' | 'lrc'; lyrics: string; confidence: number } | null> {
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(searchQuery)}&type=1&limit=15`;
    const res = await fetch(url, {
      headers: { 'Referer': 'https://music.163.com' },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 86400 },
    });
    const data = await res.json();

    if (!data?.result?.songs?.length) return null;

    // Score each candidate and pick the best
    let bestSong: any = null;
    let bestScore = 0;

    for (const s of data.result.songs) {
      const candidateTitle = s.name || '';
      const candidateArtist = (s.artists || []).map((a: any) => a.name).join(', ');
      const candidateDurationMs = s.duration || s.dt || null;

      const score = TextMatcher.computeMatchScore(
        candidateTitle, candidateArtist, candidateDurationMs,
        searchTitle, targetArtist, targetDurationSec,
      );

      if (score > bestScore) {
        bestScore = score;
        bestSong = s;
      }
    }

    if (!bestSong || bestScore < LyricsService.MIN_CONFIDENCE_SYNCED) return null;

    // Fetch lyrics for the best match
    const lyricUrl = `https://music.163.com/api/song/lyric/v1?id=${bestSong.id}&lv=-1&kv=-1&tv=-1&yv=-1`;
    const lyricRes = await fetch(lyricUrl, {
      headers: { 'Referer': 'https://music.163.com' },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 86400 },
    });
    const lyricData = await lyricRes.json();

    // Try YRC (karaoke) first
    const yrc = lyricData?.yrc?.lyric;
    if (yrc) {
      const wordLines = yrc.split('\n').filter((l: string) => /\(\d+,\d+,\d+\)/.test(l));
      if (wordLines.length >= 3) {
        return { type: 'yrc', lyrics: yrc, confidence: bestScore };
      }
    }

    // Try standard LRC
    const lrc = lyricData?.lrc?.lyric;
    if (lrc) {
      const timestampedLines = lrc.split('\n').filter((line: string) => {
        const match = line.match(/\[\d{2}:\d{2}\.\d{2,3}\]/);
        const content = line.replace(/\[.*?\]/g, '').trim();
        return match && content.length > 0;
      });

      if (timestampedLines.length >= 3) {
        return { type: 'lrc', lyrics: lrc, confidence: bestScore };
      }
    }

    return null;
  }

  /** Try finding an alternate title via iTunes for Netease re-search */
  private async tryItunesTitleFallback(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    durationSec: number | null,
  ): Promise<{ type: 'yrc' | 'lrc'; lyrics: string; confidence: number } | null> {
    try {
      let itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
      let itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
      let itunesData = await itunesRes.json();

      if (!itunesData.results?.length && primaryArtist !== cleanArtist) {
        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
        itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
        itunesData = await itunesRes.json();
      }

      const fallbackTrackName = itunesData.results?.[0]?.trackName;

      if (fallbackTrackName && TextMatcher.normKey(TextMatcher.cleanForMatch(fallbackTrackName)) !== TextMatcher.normKey(cleanTitle)) {
        return this.fetchNeteaseLrc(fallbackTrackName + ' ' + cleanArtist, fallbackTrackName, cleanArtist, durationSec);
      }
    } catch (e) {
      console.error('iTunes fallback failed:', e);
    }
    return null;
  }

  // ── Provider: LRClib ────────────────────────────────────────────

  /** Exact match via /api/get (title + artist + duration) */
  private async searchLrcLibExact(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    cleanAlbum: string,
    durationSec: number | null,
  ): Promise<LrcLibTrack | null> {
    if (!durationSec) return null;

    try {
      const params = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
        duration: String(durationSec),
      });
      if (cleanAlbum) params.append('album_name', cleanAlbum);

      let url = `https://lrclib.net/api/get?${params.toString()}`;
      let res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });

      // Retry with primary artist
      if (!res.ok && primaryArtist !== cleanArtist) {
        params.set('artist_name', primaryArtist);
        url = `https://lrclib.net/api/get?${params.toString()}`;
        res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
      }

      if (res.ok) {
        return (await res.json()) as LrcLibTrack;
      }
    } catch (err: unknown) {
      this.logProviderError('lrclib-exact', err);
    }
    return null;
  }

  /** Fuzzy search via /api/search with confidence scoring */
  private async searchLrcLibFuzzy(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    durationSec: number | null,
  ): Promise<{ synced: boolean; lyrics: string; plainLyrics?: string; confidence: number } | null> {
    try {
      let url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      let res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
      let searchData = (await res.json()) as LrcLibTrack[];

      // Retry with primary artist
      if ((!searchData || searchData.length === 0) && primaryArtist !== cleanArtist) {
        url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
        res = await fetch(url, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
        searchData = (await res.json()) as LrcLibTrack[];
      }

      if (!searchData || searchData.length === 0) return null;

      // Score and rank synced candidates
      const syncedBest = this.rankCandidates(
        searchData.filter(t => t.syncedLyrics),
        cleanTitle, cleanArtist, durationSec,
        LyricsService.MIN_CONFIDENCE_SYNCED,
      );

      if (syncedBest) {
        return { synced: true, lyrics: syncedBest.track.syncedLyrics!, confidence: syncedBest.score };
      }

      // Score plain-text candidates
      const plainBest = this.rankCandidates(
        searchData.filter(t => t.plainLyrics),
        cleanTitle, cleanArtist, durationSec,
        LyricsService.MIN_CONFIDENCE_PLAIN,
      );

      if (plainBest) {
        return { synced: false, lyrics: '', plainLyrics: plainBest.track.plainLyrics!, confidence: plainBest.score };
      }
    } catch (err: unknown) {
      this.logProviderError('lrclib-fuzzy', err);
    }
    return null;
  }

  /** Rank LRClib candidates by match score */
  private rankCandidates(
    candidates: LrcLibTrack[],
    targetTitle: string,
    targetArtist: string,
    targetDurationSec: number | null,
    minConfidence: number,
  ): { track: LrcLibTrack; score: number } | null {
    const scored = candidates
      .map(track => {
        const candidateDurationMs = track.duration != null
          ? Number(track.duration) * 1000 // LRClib duration is in seconds
          : null;

        const score = TextMatcher.computeMatchScore(
          track.trackName || '', track.artistName || '', candidateDurationMs,
          targetTitle, targetArtist, targetDurationSec,
        );

        return { track, score };
      })
      .filter(entry => entry.score >= minConfidence)
      .sort((a, b) => b.score - a.score);

    return scored[0] ?? null;
  }

  // ── Provider: lyrics.ovh ────────────────────────────────────────

  private async searchOvh(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
  ): Promise<string | null> {
    try {
      let url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      let res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });

      if (!res.ok && primaryArtist !== cleanArtist) {
        url = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTitle)}`;
        res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) return data.lyrics;
      }
    } catch (err: unknown) {
      this.logProviderError('ovh', err);
    }
    return null;
  }

  // ── Utilities ───────────────────────────────────────────────────

  private logProviderError(provider: string, err: unknown): void {
    if (err instanceof Error && err.name === 'TimeoutError') {
      console.warn(`${provider} timed out`);
    } else {
      console.error(`${provider} failed:`, err);
    }
  }
}
