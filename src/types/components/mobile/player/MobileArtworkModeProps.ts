export interface MobileArtworkModeProps {
  currentTrack: any;
  coverUrl: string | null;
  isPlaying: boolean;
  isPreview: boolean;
  isLiked: boolean;
  toggleLikeMutation: any;
  handleToggleLike: (e?: any) => void;
  onClose: () => void;
}
