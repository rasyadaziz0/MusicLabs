export interface MobileQueueModeProps {
  currentTrack: any;
  coverUrl: string;
  artistNames: string;
  isLiked: boolean;
  handleToggleLike?: (e?: any) => void;
  onClose: () => void;
  isShuffled: boolean;
  repeatMode: string;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setIsDevicesOpen?: (val: boolean) => void;
}
