import { SocialFeedItem } from '@/types/models/Social';
import { Song } from '@/types/music';
import { FollowCounts, UserProfile } from '@/types/profile';

export interface ISocialRepository {
  followUser(followingId: string): Promise<boolean>;
  unfollowUser(followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getFollowCounts(userId: string): Promise<FollowCounts>;
  getFollowers(userId: string): Promise<UserProfile[]>;
  getFollowing(userId: string): Promise<UserProfile[]>;
  getRecentlyPlayedByFollows(userId: string): Promise<{ track: Song; played_at: string; user: UserProfile }[]>;
  getSocialFeed(): Promise<SocialFeedItem[]>;
}
