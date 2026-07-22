import { TextMatcher } from '../../TextMatcher';
import { BaseLyricsProvider, CleanedQuery, ProviderResult } from './BaseLyricsProvider';

// ── LRCLib-specific types ─────────────────────────────────────────

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
  trackName?: string;
  artistName?: string;
}

/**
 * LrcLibProvider — fetches lyrics from lrclib.net.
 *
 * Two search strategies:
 * 1. **Exact match** (`/api/get`) — uses title + artist + duration for a precise hit.
 * 2. **Fuzzy search** (`/api/search`) — broader search with confidence scoring.
 *
 * Returns LRC (synced) or plain text lyrics.
 */
export class LrcLibProvider extends BaseLyricsProvider {
  readonly name = 'LRCLib';
  readonly source = 'lrclib' as const;

  /** Minimum confidence thresholds */
  private static readonly MIN_CONFIDENCE_SYNCED = 45;
  private static readonly MIN_CONFIDENCE_PLAIN = 35;

  async search(query: CleanedQuery): Promise<ProviderResult | null> {
    const { cleanTitle, cleanArtist, primaryArtist, cleanAlbum, durationSec } = query;

    // ── 1. Exact match (/api/get) ──────────────────────────────
    const exact = await this.searchExact(cleanTitle, cleanArtist, primaryArtist, cleanAlbum, durationSec);

    if (exact) {
      if (exact.syncedLyrics) {
        return {
          synced: true,
          type: 'lrc',
          lyrics: exact.syncedLyrics,
          confidence: 90, // Exact match = high confidence
        };
      }
      if (exact.plainLyrics) {
        return {
          synced: false,
          type: 'lrc',
          lyrics: '',
          confidence: 80,
          plainLyrics: exact.plainLyrics,
          plainConfidence: 80,
        };
      }
    }

    // ── 2. Fuzzy search (/api/search) ──────────────────────────
    return this.searchFuzzy(cleanTitle, cleanArtist, primaryArtist, durationSec);
  }

  // ── Exact Match (/api/get) ────────────────────────────────────

  private async searchExact(
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
      let res = await fetch(url, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });

      // Retry with primary artist
      if (!res.ok && primaryArtist !== cleanArtist) {
        params.set('artist_name', primaryArtist);
        url = `https://lrclib.net/api/get?${params.toString()}`;
        res = await fetch(url, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });
      }

      if (res.ok) {
        return (await res.json()) as LrcLibTrack;
      }
    } catch (err: unknown) {
      this.logError('exact search', err);
    }
    return null;
  }

  // ── Fuzzy Search (/api/search) ────────────────────────────────

  private async searchFuzzy(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    durationSec: number | null,
  ): Promise<ProviderResult | null> {
    try {
      let url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      let res = await fetch(url, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });
      let searchData = (await res.json()) as LrcLibTrack[];

      // Retry with primary artist
      if ((!searchData || searchData.length === 0) && primaryArtist !== cleanArtist) {
        url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
        res = await fetch(url, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });
        searchData = (await res.json()) as LrcLibTrack[];
      }

      if (!searchData || searchData.length === 0) return null;

      // Score and rank synced candidates
      const syncedBest = this.rankCandidates(
        searchData.filter(t => t.syncedLyrics),
        cleanTitle, cleanArtist, durationSec,
        LrcLibProvider.MIN_CONFIDENCE_SYNCED,
      );

      if (syncedBest) {
        return {
          synced: true,
          type: 'lrc',
          lyrics: syncedBest.track.syncedLyrics!,
          confidence: syncedBest.score,
        };
      }

      // Score plain-text candidates
      const plainBest = this.rankCandidates(
        searchData.filter(t => t.plainLyrics),
        cleanTitle, cleanArtist, durationSec,
        LrcLibProvider.MIN_CONFIDENCE_PLAIN,
      );

      if (plainBest) {
        return {
          synced: false,
          type: 'lrc',
          lyrics: '',
          confidence: plainBest.score,
          plainLyrics: plainBest.track.plainLyrics!,
          plainConfidence: plainBest.score,
        };
      }
    } catch (err: unknown) {
      this.logError('fuzzy search', err);
    }
    return null;
  }

  // ── Candidate Ranking ─────────────────────────────────────────

  /** Rank LRCLib candidates by match score */
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
}
