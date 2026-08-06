import { EmbedPlaylistTrack } from '@/types/components/embed';

export interface EmbedPlaylistPlayerState {
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isLoading: boolean;
  error: string | null;
  useNativePreview: boolean; // True if using iTunes preview
  currentTrack: EmbedPlaylistTrack | null;
}

export interface EmbedPlaylistPlayerControllerOptions {
  tracks: EmbedPlaylistTrack[];
  isLoggedIn: boolean;
  onStateChange: (state: Partial<EmbedPlaylistPlayerState>) => void;
}

export interface EmbedPlayerState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  isLoading: boolean;
  error: string | null;
}

export interface EmbedPlayerControllerOptions {
  trackName: string;
  artistName: string;
  duration: number;
  isLoggedIn: boolean;
  previewUrl?: string;
  onStateChange: (state: Partial<EmbedPlayerState>) => void;
}
