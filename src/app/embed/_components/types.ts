/**
 * Shared types for all embed players.
 */

/** YouTube IFrame Player instance interface. */
export type YouTubePlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById?: (videoId: string) => void;
  destroy: () => void;
};

/** Simplified track shape used inside embed players. */
export interface EmbedPlaylistTrack {
  id: string;
  name: string;
  artistName: string;
  coverUrl: string;
  duration: number;
}
