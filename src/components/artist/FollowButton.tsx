'use client';

import { useArtistFollow } from '@/hooks/useArtistFollow';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

interface FollowButtonProps {
  artistId: string;
  artistName: string;
  artistImage?: string | null;
  className?: string;
}

export function FollowButton({
  artistId,
  artistName,
  artistImage,
  className = '',
}: FollowButtonProps) {
  const { isFollowing, isMutating, toggleFollow } = useArtistFollow({
    artistId,
    artistName,
    artistImageUrl: artistImage,
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
    toggleFollow();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isMutating}
      aria-label={isFollowing ? `Unfollow ${artistName}` : `Follow ${artistName}`}
      aria-pressed={isFollowing}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 select-none h-8 px-4 text-xs md:h-9 md:px-5 md:text-[13px] ${
        isFollowing
          ? isHovered
            ? 'bg-transparent border border-[#FA243C] text-[#FA243C] hover:bg-[#FA243C]/10'
            : 'bg-[#FA243C] border border-[#FA243C] text-white shadow-lg shadow-[#FA243C]/25'
          : 'bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50'
      } ${isMutating ? 'opacity-70 pointer-events-none' : ''} ${className}`}
    >
      {isMutating ? (
        <Loader2 className="animate-spin" size={14} />
      ) : isFollowing ? (
        isHovered ? (
          <>
            <X size={14} className="flex-shrink-0" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <Check size={14} className="flex-shrink-0" />
            <span>Following</span>
          </>
        )
      ) : (
        <>
          <UserPlus size={14} className="flex-shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key="follow"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Follow
            </motion.span>
          </AnimatePresence>
        </>
      )}
    </motion.button>
  );
}
