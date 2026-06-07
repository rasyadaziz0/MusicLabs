'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';
import { useToggleFollow } from '@/hooks/useFollow';
import { useAuth } from '@/context/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  targetUserId,
  isFollowing,
  isLoading = false,
  size = 'md',
}: FollowButtonProps) {
  const { user } = useAuth();
  const toggleFollow = useToggleFollow();
  const [isHovering, setIsHovering] = useState(false);

  // Don't render if it's the user's own profile or not logged in
  if (!user || user.id === targetUserId) return null;

  const isMutating = toggleFollow.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating || isLoading) return;

    toggleFollow.mutate({
      targetUserId,
      currentlyFollowing: isFollowing,
    });
  };

  const sizeClasses = size === 'sm'
    ? 'px-4 py-1.5 text-[12px] gap-1.5'
    : 'px-6 py-2 text-[13px] gap-2';

  const iconSize = size === 'sm' ? 13 : 15;

  // Determine visual state
  const showUnfollow = isFollowing && isHovering;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isMutating || isLoading}
      whileTap={{ scale: 0.95 }}
      className={`
        relative inline-flex items-center justify-center rounded-full font-semibold
        transition-all duration-200 select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses}
        ${isFollowing
          ? showUnfollow
            ? 'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20'
            : 'bg-white/[0.08] border border-white/15 text-white hover:bg-white/[0.12]'
          : 'bg-[#FA243C] border border-[#FA243C] text-white hover:bg-[#FA243C]/90 shadow-[0_0_20px_rgba(250,36,60,0.2)]'
        }
      `}
    >
      {isMutating || isLoading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : showUnfollow ? (
        <UserMinus size={iconSize} />
      ) : isFollowing ? (
        <UserCheck size={iconSize} />
      ) : (
        <UserPlus size={iconSize} />
      )}
      <span>
        {isMutating
          ? isFollowing ? 'Unfollowing...' : 'Following...'
          : showUnfollow
            ? 'Unfollow'
            : isFollowing
              ? 'Following'
              : 'Follow'
        }
      </span>
    </motion.button>
  );
}
