export interface DesktopTrackInfoProps {
  currentTrack: any;
  hasTrack: boolean;
  isRadio: boolean;
  radioMeta: any;
  isResolving: boolean;
  currentTime: number;
  duration: number;
  seek: (val: number) => void;
  setIsNowPlayingOpen: (open: boolean) => void;
  isVolumeSliderOpen?: boolean;
}
