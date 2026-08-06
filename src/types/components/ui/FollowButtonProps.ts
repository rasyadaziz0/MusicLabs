export interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}
