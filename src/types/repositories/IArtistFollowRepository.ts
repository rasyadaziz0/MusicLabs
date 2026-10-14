import { ArtistMetadata, FollowedArtist } from '@/types/models/ArtistFollow';

export interface IArtistFollowRepository {
  followArtist(artistId: string, metadata: ArtistMetadata): Promise<boolean>;
  unfollowArtist(artistId: string): Promise<boolean>;
  isFollowing(artistId: string): Promise<boolean>;
  getFollowedArtists(limit?: number): Promise<FollowedArtist[]>;
  getFollowedArtistIds(): Promise<string[]>;
  getFollowerCount(artistId: string): Promise<number>;
  updateArtistMetadata(artistId: string, metadata: ArtistMetadata): Promise<void>;
  updateStationAvailability(artistId: string, hasStation: boolean): Promise<void>;
}
