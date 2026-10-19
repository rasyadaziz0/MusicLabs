import { getEffectiveTime } from '@/lib/lyrics/lyricsOffsetStore';
import { LrcLine } from '@/types/utils/lrc';

export class LyricSyncEngine {
  /**
   * Performs an efficient binary search to find the active synchronized lyric line index
   * based on the current playback time and track-specific latency offset.
   */
  public static findActiveIndex(
    lines: LrcLine[],
    currentTime: number,
    trackId: string | null,
    isSynced: boolean
  ): number {
    if (!isSynced || !lines || lines.length === 0) return -1;

    const effectiveTime = getEffectiveTime(currentTime, trackId);
    if (effectiveTime < lines[0].time) return -1;

    let lo = 0;
    let hi = lines.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= effectiveTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    return lo;
  }
}
