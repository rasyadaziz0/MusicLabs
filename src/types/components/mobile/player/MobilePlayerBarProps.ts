export interface MobilePlayerBarProps {
  currentTrack: any;
  isPlaying: boolean;
  isResolving: boolean;
  isGuestPreview: boolean;
  isRadio: boolean;
  radioMeta: any;
  togglePlay: () => void;
  nextTrack: () => void;
  setIsNowPlayingOpen: (open: boolean) => void;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
}
