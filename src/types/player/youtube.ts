export type YouTubePlayerEvent = {
  data: number;
};

export type YouTubePlayer = {
  getDuration: () => number;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  loadVideoById: (videoId: string) => void;
  stopVideo: () => void;
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
};
