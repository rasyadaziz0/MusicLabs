import { recordRecentPlay } from '@/lib/supabase/music';
import { Song } from '@/types/music';

export class PlaybackHistoryRecorder {
  private userId: string | null = null;
  private lastRecordedTrackId: string | null = null;

  public setUserId(userId: string | null): void {
    this.userId = userId;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public recordPlay(track: Song): void {
    if (this.userId && this.lastRecordedTrackId !== track.id) {
      this.lastRecordedTrackId = track.id;
      recordRecentPlay(this.userId, track.id).catch(console.error);
    }
  }

  public reset(): void {
    this.lastRecordedTrackId = null;
  }
}
