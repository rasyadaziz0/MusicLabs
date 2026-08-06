export interface DiscoverStatus {
  exists: boolean;
  playlistId?: string;
  generatedAt?: string;
  isStale?: boolean;
  listeningProgress?: {
    current: number;
    required: number;
    ready: boolean;
  };
}