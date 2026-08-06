export interface DesktopExtraControlsProps {
  currentTrack: any;
  hasTrack: boolean;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  isVolumeSliderOpen: boolean;
  setIsVolumeSliderOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
}
