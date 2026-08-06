export interface DesktopPlaybackControlsProps {
  hasTrack: boolean;
  isPlaying: boolean;
  isResolving: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}
