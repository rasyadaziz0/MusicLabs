import { PlaylistRecord, PlaylistTrackRow } from '@/types/models/Playlist';
import { Song } from '@/types/music';

export interface IPlaylistRepository {
  getUserPlaylists(userId: string): Promise<PlaylistRecord[]>;
  getPublicPlaylists(userId: string): Promise<PlaylistRecord[]>;
  getPlaylistById(playlistId: string): Promise<PlaylistRecord>;
  createPlaylist(input: {
    userId: string;
    name: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    isDiscoverWeekly?: boolean;
  }): Promise<PlaylistRecord>;
  updatePlaylist(playlistId: string, updates: Partial<PlaylistRecord>): Promise<void>;
  togglePinPlaylist(playlistId: string, currentPinStatus: boolean): Promise<boolean>;
  deletePlaylist(playlistId: string): Promise<boolean>;
  getPlaylistTrackIds(playlistId: string): Promise<PlaylistTrackRow[]>;
  getPlaylistTracks(playlistId: string): Promise<Song[]>;
  getAllPlaylistTracksForUser(userId: string): Promise<Song[]>;
  addTrackToPlaylist(playlistId: string, trackId: string): Promise<'SUCCESS' | 'ALREADY_EXISTS'>;
  removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
  reorderPlaylistTracks(playlistId: string, trackIdsInOrder: string[]): Promise<void>;
  getOrCreateDiscoverWeeklyPlaylist(
    userId: string
  ): Promise<{ playlist: PlaylistRecord; created: boolean }>;
  updateDiscoverWeeklyTracks(
    playlistId: string,
    trackIds: string[]
  ): Promise<void>;
}
