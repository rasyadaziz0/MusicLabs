import { Song } from '@/types/music';

export interface ArtistMetadata {
  name: string;
  imageUrl?: string | null;
}

export interface FollowedArtist {
  id: string;              // artist_follows.id (UUID)
  userId: string;          // profiles.id (UUID)
  artistId: string;        // External Music API ID (e.g., "itunes-artist-123" or "123")
  artistName: string;
  artistImageUrl: string | null;
  hasStation: boolean | null;
  followedAt: string;
}

export interface ArtistStation {
  artist: {
    id: string;
    name: string;
    image: string | null;
  };
  tracks: Song[];
  hasStation: boolean;
  isLive?: boolean;
  liveTitle?: string;
  videoId?: string;
}

export interface ArtistStationCardData {
  artistId: string;
  artistName: string;
  artistImage: string | null;
  trackCount: number;
  isLoading?: boolean;
}
