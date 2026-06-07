'use client';

import UserCard from '@/components/ui/UserCard';
import { UserProfile } from '@/lib/supabase/social';

interface UserSearchResultsProps {
  isUsersLoading: boolean;
  usersData: UserProfile[] | undefined;
  query: string;
}

export function UserSearchResults({ isUsersLoading, usersData, query }: UserSearchResultsProps) {
  if (isUsersLoading) {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (usersData && usersData.length > 0) {
    return (
      <div className="space-y-2 mt-4">
        {usersData.map((userProfile) => (
          <UserCard
            key={userProfile.id}
            userId={userProfile.id}
            username={userProfile.username}
            displayNameProfile={userProfile.display_name}
            bio={userProfile.bio}
            avatarUrl={userProfile.avatar_url}
            showFollowButton={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <p className="text-xl text-white/50 font-medium">No users found for &quot;{query}&quot;</p>
    </div>
  );
}
