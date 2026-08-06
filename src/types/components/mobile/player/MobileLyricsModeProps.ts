export interface MobileLyricsModeProps {
  currentTrack: any;
  coverUrl: string | null;
  artistNames: string;
  isLiked: boolean;
  toggleLikeMutation: any;
  handleToggleLike: (e?: any) => void;
  lines: any[];
  activeIndex: number;
  isSynced: boolean;
  isLyricsLoading: boolean;
  mobileLyricsScrollRef: any;
  seek: (time: number) => void;
  currentTime: number;
  romanizations?: Map<number, string>;
  trackId: string | null;
}
