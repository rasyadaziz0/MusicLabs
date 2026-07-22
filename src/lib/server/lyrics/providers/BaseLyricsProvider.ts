import { TextMatcher } from '../../TextMatcher';

// ── Shared Types ──────────────────────────────────────────────────

export interface LyricsQuery {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number | null;
}

export interface LyricsResult {
  synced: boolean;
  type: 'yrc' | 'lrc';
  lyrics: string;
  source: 'netease' | 'lrclib' | 'ovh';
}

/** Internal result returned by each provider */
export interface ProviderResult {
  synced: boolean;
  type: 'yrc' | 'lrc';
  lyrics: string;
  confidence: number;
  /** Optional plain-text fallback (e.g. LRCLib may return plain when no synced) */
  plainLyrics?: string;
  plainConfidence?: number;
}

/** Cleaned/preprocessed query passed to providers */
export interface CleanedQuery {
  cleanTitle: string;
  cleanArtist: string;
  primaryArtist: string;
  cleanAlbum: string;
  durationSec: number | null;
}

// ── Abstract Base Class ───────────────────────────────────────────

/**
 * BaseLyricsProvider — abstract class that all lyrics providers must extend.
 *
 * Provides a consistent interface for searching lyrics and shared utility
 * methods for error logging and timeout handling.
 */
export abstract class BaseLyricsProvider {
  /** Human-readable name for logging */
  abstract readonly name: string;

  /** The source identifier used in LyricsResult */
  abstract readonly source: LyricsResult['source'];

  /**
   * Search for lyrics matching the given query.
   * Implementations should handle their own retries (e.g. primary vs full artist).
   */
  abstract search(query: CleanedQuery): Promise<ProviderResult | null>;

  // ── Shared Utilities ──────────────────────────────────────────

  /** Log provider errors consistently */
  protected logError(context: string, err: unknown): void {
    if (err instanceof Error && err.name === 'TimeoutError') {
      console.warn(`[${this.name}] ${context} timed out`);
    } else {
      console.error(`[${this.name}] ${context} failed:`, err);
    }
  }

  /** Create an AbortSignal with a timeout in ms */
  protected timeoutSignal(ms: number = 15000): AbortSignal {
    return AbortSignal.timeout(ms);
  }

  /**
   * Prepare a LyricsQuery into a CleanedQuery for provider consumption.
   * This is a static helper so the orchestrator can call it once.
   */
  static prepareQuery(query: LyricsQuery): CleanedQuery {
    const cleanTitle = TextMatcher.cleanForMatch(query.title);
    const cleanArtist = TextMatcher.cleanForMatch(query.artist);
    const cleanAlbum = query.album ? TextMatcher.cleanForMatch(query.album) : '';
    const primaryArtist = TextMatcher.extractPrimaryArtist(cleanArtist);
    const durationSec = query.durationSec ?? null;

    return { cleanTitle, cleanArtist, primaryArtist, cleanAlbum, durationSec };
  }
}
