export type TabType = 'followers' | 'following';

export interface FollowListModalProps {
  userId: string;
  initialTab?: TabType;
  isOpen: boolean;
  onClose: () => void;
  followerCount: number;
  followingCount: number;
}
