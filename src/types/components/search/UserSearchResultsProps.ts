import { UserProfile } from '@/types/profile';

export interface UserSearchResultsProps {
  isUsersLoading: boolean;
  usersData: UserProfile[] | undefined;
  query: string;
}
