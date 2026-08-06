export type RepeatMode = 'none' | 'one' | 'all';

export interface IMobilePlayerControlsProps {
  duration: number | undefined;
  currentTime: number;
  seek: (time: number) => void;
  prevTrack: () => void;
  nextTrack: () => void;
  togglePlay: () => void;
  isResolving: boolean;
  isPlaying: boolean;
  volume: number;
  setVolume: (val: number) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (val: boolean) => void;
  linesLength: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  isQueueOpen?: boolean;
  setIsQueueOpen?: (val: boolean) => void;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (val: boolean) => void;
  activeDevice?: any;
  connectedDevices?: any[];
  isActivePlayer?: boolean;
}

export interface IMobileDeviceNode {
  tabInstanceId?: string;
  label?: string;
  isCurrentTab?: boolean;
  [key: string]: any;
}
