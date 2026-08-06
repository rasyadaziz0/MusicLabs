import { LikedSongRow } from '@/types/models/Like';
import { Song } from '@/types/music';

export interface ILikeRepository {
  getLikedSongs(userId: string): Promise<LikedSongRow[]>;
  getLikedSongIds(userId: string): Promise<string[]>;
  getLikedSongsWithDetails(userId: string): Promise<Song[]>;
  isTrackLiked(userId: string, trackId: string): Promise<boolean>;
  toggleLikedSong(userId: string, trackId: string): Promise<boolean>;
}
