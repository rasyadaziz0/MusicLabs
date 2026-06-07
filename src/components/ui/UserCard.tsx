'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import FollowButton from '@/components/ui/FollowButton';
import { useFollowStatus } from '@/hooks/useFollow';

interface UserCardProps {
  userId: string;
  username: string | null;
  displayNameProfile?: string | null;
  bio?: string | null;
  avatarUrl: string | null;
  showFollowButton?: boolean;
  onClick?: () => void;
}

export default function UserCard({
  userId,
  username,
  displayNameProfile,
  bio,
  avatarUrl,
  showFollowButton = true,
  onClick,
}: UserCardProps) {
  const { data: isFollowing = false, isLoading: isFollowLoading } = useFollowStatus(
    showFollowButton ? userId : null
  );

  const displayName = displayNameProfile || username || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const content = (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors rounded-xl cursor-pointer">
      {/* Avatar */}
      <div className="relative w-11 h-11 flex-shrink-0 rounded-full overflow-hidden bg-white/5 ring-1 ring-white/10">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#FA243C]/10 flex items-center justify-center">
            <span className="text-white text-[13px] font-bold">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-white truncate group-hover:text-white/90">
          {displayName}
        </p>
        <p className="text-[12px] text-white/40 truncate">
          {username && displayNameProfile ? `@${username}` : 'Profile'}
        </p>
      </div>

      {/* Follow button */}
      {showFollowButton && (
        <div onClick={(e) => e.preventDefault()}>
          <FollowButton
            targetUserId={userId}
            isFollowing={isFollowing}
            isLoading={isFollowLoading}
            size="sm"
          />
        </div>
      )}
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return (
    <Link href={username ? `/@${username}` : `/user/${userId}`}>
      {content}
    </Link>
  );
}
