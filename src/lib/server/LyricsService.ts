import { BaseLyricsProvider, LyricsQuery, LyricsResult, CleanedQuery } from './lyrics/providers/BaseLyricsProvider';
import { NeteaseProvider } from './lyrics/providers/NeteaseProvider';
import { LrcLibProvider } from './lyrics/providers/LrcLibProvider';
import { OvhProvider } from './lyrics/providers/OvhProvider';

// Re-export types so existing consumers don't break
export type { LyricsResult, LyricsQuery };

export class LyricsService {
  private static instance: LyricsService;

  /** Minimum confidence thresholds */
  private static readonly MIN_CONFIDENCE_SYNCED = 45;
  private static readonly MIN_CONFIDENCE_PLAIN = 35;

  /** Provider instances */
  private readonly netease: NeteaseProvider;
  private readonly lrclib: LrcLibProvider;
  private readonly ovh: OvhProvider;

  private constructor() {
    this.netease = new NeteaseProvider();
    this.lrclib = new LrcLibProvider();
    this.ovh = new OvhProvider();
  }

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
    const cleaned = BaseLyricsProvider.prepareQuery(query);

    let fallbackSyncedLyrics: string | null = null;
    let fallbackSyncedConfidence = 0;
    let fallbackSyncedSource: LyricsResult['source'] | null = null;

    let fallbackPlainLyrics: string | null = null;
    let fallbackPlainConfidence = 0;

    // ── 1. Netease (YRC karaoke / LRC synced) ─────────────────
    const neteaseResult = await this.netease.search(cleaned);

    if (neteaseResult) {
      if (neteaseResult.type === 'yrc') {
        // YRC = per-word karaoke — best quality, return immediately
        return { synced: true, type: 'yrc', lyrics: neteaseResult.lyrics, source: 'netease' };
      }
      // Netease LRC — save as synced fallback, LRClib may have better timing
      fallbackSyncedLyrics = neteaseResult.lyrics;
      fallbackSyncedConfidence = neteaseResult.confidence;
      fallbackSyncedSource = 'netease';
    }

    // ── 2. LRCLib (exact + fuzzy) ─────────────────────────────
    const lrclibResult = await this.lrclib.search(cleaned);

    if (lrclibResult) {
      if (lrclibResult.synced) {
        return { synced: true, type: 'lrc', lyrics: lrclibResult.lyrics, source: 'lrclib' };
      }
      // Plain text fallback from LRCLib
      if (lrclibResult.plainLyrics && !fallbackPlainLyrics) {
        fallbackPlainLyrics = lrclibResult.plainLyrics;
        fallbackPlainConfidence = lrclibResult.plainConfidence ?? lrclibResult.confidence;
      }
    }

    // ── Return synced fallback if available ──────────────────────
    if (fallbackSyncedLyrics && fallbackSyncedConfidence >= LyricsService.MIN_CONFIDENCE_SYNCED) {
      return { synced: true, type: 'lrc', lyrics: fallbackSyncedLyrics, source: fallbackSyncedSource || 'netease' };
    }

    // ── Return plain fallback if good enough ──────────────────
    if (fallbackPlainLyrics && fallbackPlainConfidence >= LyricsService.MIN_CONFIDENCE_PLAIN) {
      return { synced: false, type: 'lrc', lyrics: fallbackPlainLyrics, source: 'lrclib' };
    }

    // ── 3. lyrics.ovh (last resort — plain only) ──────────────
    const ovhResult = await this.ovh.search(cleaned);

    if (ovhResult) {
      return { synced: false, type: 'lrc', lyrics: ovhResult.lyrics, source: 'ovh' };
    }

    return null;
  }
}
