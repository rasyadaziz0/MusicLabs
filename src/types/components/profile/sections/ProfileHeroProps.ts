import { UserProfile } from '@/types/profile';

export interface ProfileHeroProps {
  user: any;
  profile: UserProfile | null;
  stats: {
    playlistCount: number;
    likedCount: number;
    followerCount: number;
    followingCount: number;
  };
  handleSignOut: () => void;
  setFollowModalTab: (tab: 'followers' | 'following') => void;
  setFollowModalOpen: (open: boolean) => void;
}
