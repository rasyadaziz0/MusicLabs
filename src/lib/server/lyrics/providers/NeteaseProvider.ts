import { TextMatcher } from '../../TextMatcher';
import { BaseLyricsProvider, CleanedQuery, ProviderResult } from './BaseLyricsProvider';

/**
 * NeteaseProvider — fetches lyrics from Netease Music (music.163.com).
 *
 * Supports two lyric formats:
 * - **YRC** (per-word karaoke timing) — highest quality, returned immediately.
 * - **LRC** (per-line sync) — returned as a synced fallback.
 *
 * Also includes an iTunes fallback for alternate/translated titles.
 */
export class NeteaseProvider extends BaseLyricsProvider {
  readonly name = 'Netease';
  readonly source = 'netease' as const;

  /** Minimum confidence for accepting a match */
  private static readonly MIN_CONFIDENCE = 45;

  async search(query: CleanedQuery): Promise<ProviderResult | null> {
    try {
      const { cleanTitle, cleanArtist, primaryArtist, durationSec } = query;

      // Try full artist first
      let result = await this.fetchLyrics(
        cleanTitle + ' ' + cleanArtist, cleanTitle, cleanArtist, durationSec
      );

      // Retry with primary artist only
      if (!result && primaryArtist !== cleanArtist) {
        result = await this.fetchLyrics(
          cleanTitle + ' ' + primaryArtist, cleanTitle, cleanArtist, durationSec
        );
      }

      // Fallback: try iTunes for translated/alternate title
      if (!result) {
        result = await this.tryItunesTitleFallback(cleanTitle, cleanArtist, primaryArtist, durationSec);
      }

      return result;
    } catch (err: unknown) {
      this.logError('search', err);
      return null;
    }
  }

  // ── Core Netease Fetch ────────────────────────────────────────

  private async fetchLyrics(
    searchQuery: string,
    searchTitle: string,
    targetArtist: string,
    targetDurationSec: number | null,
  ): Promise<ProviderResult | null> {
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(searchQuery)}&type=1&limit=15`;
    const res = await fetch(url, {
      headers: { 'Referer': 'https://music.163.com' },
      signal: this.timeoutSignal(15000),
      next: { revalidate: 86400 },
    });
    const data = await res.json();

    if (!data?.result?.songs?.length) return null;

    // Score each candidate and pick the best
    const bestMatch = this.findBestMatch(data.result.songs, searchTitle, targetArtist, targetDurationSec);
    if (!bestMatch) return null;

    // Fetch lyrics for the best match
    return this.fetchLyricsById(bestMatch.song.id, bestMatch.score);
  }

  // ── Match Scoring ─────────────────────────────────────────────

  private findBestMatch(
    songs: any[],
    searchTitle: string,
    targetArtist: string,
    targetDurationSec: number | null,
  ): { song: any; score: number } | null {
    let bestSong: any = null;
    let bestScore = 0;

    for (const s of songs) {
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

    if (!bestSong || bestScore < NeteaseProvider.MIN_CONFIDENCE) return null;
    return { song: bestSong, score: bestScore };
  }

  // ── Lyrics Retrieval ──────────────────────────────────────────

  private async fetchLyricsById(songId: number, confidence: number): Promise<ProviderResult | null> {
    const lyricUrl = `https://music.163.com/api/song/lyric/v1?id=${songId}&lv=-1&kv=-1&tv=-1&yv=-1`;
    const lyricRes = await fetch(lyricUrl, {
      headers: { 'Referer': 'https://music.163.com' },
      signal: this.timeoutSignal(10000),
      next: { revalidate: 86400 },
    });
    const lyricData = await lyricRes.json();

    // Try YRC (karaoke) first — best quality
    const yrc = lyricData?.yrc?.lyric;
    if (yrc) {
      const wordLines = yrc.split('\n').filter((l: string) => /\(\d+,\d+,\d+\)/.test(l));
      if (wordLines.length >= 3) {
        return { synced: true, type: 'yrc', lyrics: yrc, confidence };
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
        return { synced: true, type: 'lrc', lyrics: lrc, confidence };
      }
    }

    return null;
  }

  // ── iTunes Title Fallback ─────────────────────────────────────

  /** Try finding an alternate title via iTunes for Netease re-search */
  private async tryItunesTitleFallback(
    cleanTitle: string,
    cleanArtist: string,
    primaryArtist: string,
    durationSec: number | null,
  ): Promise<ProviderResult | null> {
    try {
      let itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
      let itunesRes = await fetch(itunesUrl, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });
      let itunesData = await itunesRes.json();

      if (!itunesData.results?.length && primaryArtist !== cleanArtist) {
        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
        itunesRes = await fetch(itunesUrl, { signal: this.timeoutSignal(15000), next: { revalidate: 86400 } });
        itunesData = await itunesRes.json();
      }

      const fallbackTrackName = itunesData.results?.[0]?.trackName;

      if (
        fallbackTrackName &&
        TextMatcher.normKey(TextMatcher.cleanForMatch(fallbackTrackName)) !== TextMatcher.normKey(cleanTitle)
      ) {
        return this.fetchLyrics(fallbackTrackName + ' ' + cleanArtist, fallbackTrackName, cleanArtist, durationSec);
      }
    } catch (e) {
      this.logError('iTunes fallback', e);
    }
    return null;
  }
}
