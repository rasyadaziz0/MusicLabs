import { createClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

import { PlaylistRepository, PlaylistRecord } from './repositories/PlaylistRepository';
import { LikeRepository, LikedSongRow } from './repositories/LikeRepository';
import { HistoryRepository, WeeklyTrackPlay } from './repositories/HistoryRepository';

export const supabase = createClient();

// Instantiate the repositories
const playlistRepo = new PlaylistRepository(supabase);
const likeRepo = new LikeRepository(supabase);
const historyRepo = new HistoryRepository(supabase);

export type { PlaylistRecord, LikedSongRow, WeeklyTrackPlay };

// ── Playlist Repository Exports ─────────────────────────────
export const getUserPlaylists = (userId: string) => playlistRepo.getUserPlaylists(userId);
export const getPlaylistById = (playlistId: string) => playlistRepo.getPlaylistById(playlistId);
export const createPlaylist = (input: { userId: string; name: string; description?: string; coverUrl?: string; }) => playlistRepo.createPlaylist(input);
export const togglePinPlaylist = (playlistId: string, currentPinStatus: boolean) => playlistRepo.togglePinPlaylist(playlistId, currentPinStatus);
export const deletePlaylist = (playlistId: string) => playlistRepo.deletePlaylist(playlistId);
export const getPlaylistTrackIds = (playlistId: string) => playlistRepo.getPlaylistTrackIds(playlistId);
export const getPlaylistTracks = (playlistId: string) => playlistRepo.getPlaylistTracks(playlistId);
export const getAllPlaylistTracksForUser = (userId: string) => playlistRepo.getAllPlaylistTracksForUser(userId);
export const addTrackToPlaylist = (playlistId: string, trackId: string) => playlistRepo.addTrackToPlaylist(playlistId, trackId);
export const removeTrackFromPlaylist = (playlistId: string, trackId: string) => playlistRepo.removeTrackFromPlaylist(playlistId, trackId);
export const reorderPlaylistTracks = (playlistId: string, trackIdsInOrder: string[]) => playlistRepo.reorderPlaylistTracks(playlistId, trackIdsInOrder);

// The discover weekly ones took a client parameter in the old implementation
// Let's bind them to use the instance (the client is internal to the repo now)
export const getOrCreateDiscoverWeeklyPlaylist = (client: SupabaseClient, userId: string) => playlistRepo.getOrCreateDiscoverWeeklyPlaylist(userId);
export const updateDiscoverWeeklyTracks = (client: SupabaseClient, playlistId: string, trackIds: string[]) => playlistRepo.updateDiscoverWeeklyTracks(playlistId, trackIds);

// ── Like Repository Exports ─────────────────────────────────
export const getLikedSongs = (userId: string) => likeRepo.getLikedSongs(userId);
export const getLikedSongIds = (userId: string) => likeRepo.getLikedSongIds(userId);
export const getLikedSongsWithDetails = (userId: string) => likeRepo.getLikedSongsWithDetails(userId);
export const isTrackLiked = (userId: string, trackId: string) => likeRepo.isTrackLiked(userId, trackId);
export const toggleLikedSong = (userId: string, trackId: string) => likeRepo.toggleLikedSong(userId, trackId);

// ── History Repository Exports ──────────────────────────────
export const recordRecentPlay = (userId: string, trackId: string) => historyRepo.recordRecentPlay(userId, trackId);
export const getRecentPlays = (userId: string) => historyRepo.getRecentPlays(userId);
export const getMostPlayedSongs = (userId: string, limit = 20) => historyRepo.getMostPlayedSongs(userId, limit);
export const getOlderTopSongs = (
  userId: string,
  options?: { recentDays?: number; lookbackDays?: number; limit?: number }
) => historyRepo.getOlderTopSongs(userId, options);
export const getSongsPlayedBetweenHours = (
  userId: string,
  startHour: number,
  endHour: number,
  limit = 20
) => historyRepo.getSongsPlayedBetweenHours(userId, startHour, endHour, limit);
export const getListeningStats = (userId: string) => historyRepo.getListeningStats(userId);
export const getMonthlyTopTracks = (userId: string, year: number, month: number) => historyRepo.getMonthlyTopTracks(userId, year, month);

// Discover weekly helpers that took client parameter
export const getWeeklyListeningHistory = (client: SupabaseClient, userId: string, days = 7) => historyRepo.getWeeklyListeningHistory(userId, days);
export const getAllRecentTrackIds = (client: SupabaseClient, userId: string, days = 30) => historyRepo.getAllRecentTrackIds(userId, days);
