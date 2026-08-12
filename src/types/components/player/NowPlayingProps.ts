
export interface NowPlayingProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
}
