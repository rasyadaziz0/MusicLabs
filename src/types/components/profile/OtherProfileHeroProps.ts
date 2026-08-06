export interface OtherProfileHeroProps {
  userId: string;
  profile: any;
  followerCount: number;
  followingCount: number;
  playlistCount?: number;
  isFollowing: boolean;
  isFollowStatusLoading: boolean;
  openFollowModal: (tab: 'followers' | 'following') => void;
}
