export interface UserCardProps {
  userId: string;
  username: string | null;
  displayNameProfile?: string | null;
  bio?: string | null;
  avatarUrl: string | null;
  showFollowButton?: boolean;
  onClick?: () => void;
}
