import { PlaylistRecord } from '@/types/models/Playlist';

export interface IPlaylistLikeRepository {
  isLiked(userId: string, playlistId: string): Promise<boolean>;
  toggleLike(userId: string, playlistId: string): Promise<boolean>;
  getLikeCount(playlistId: string): Promise<number>;
  getLikedPlaylists(userId: string): Promise<PlaylistRecord[]>;
  getLikedPlaylistIds(userId: string): Promise<string[]>;
}
