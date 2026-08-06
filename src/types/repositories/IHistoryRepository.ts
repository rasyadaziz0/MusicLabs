import { Song } from '@/types/music';
import { WeeklyTrackPlay } from '@/types/models/History';

export interface IHistoryRepository {
  recordRecentPlay(userId: string, trackId: string): Promise<void>;
  getRecentPlays(userId: string): Promise<Song[]>;
  getListeningStats(userId: string): Promise<{ totalPlays: number }>;
  getMonthlyTopTracks(userId: string, year: number, month: number): Promise<{ topTracks: { track_id: string; play_count: number; }[]; totals: { total_plays: number; unique_tracks: number; }; }>;
  getWeeklyListeningHistory(userId: string): Promise<WeeklyTrackPlay[]>;
  getAllRecentTrackIds(userId: string, days?: number): Promise<Set<string>>;
  getMostPlayedSongs(userId: string, limit?: number): Promise<Song[]>;
  getOlderTopSongs(userId: string, options?: { recentDays?: number; lookbackDays?: number; limit?: number; }): Promise<Song[]>;
  getSongsPlayedBetweenHours(userId: string, startHour: number, endHour: number, limit?: number): Promise<Song[]>;
  clearHistory(userId: string): Promise<void>;
}
