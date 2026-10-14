'use client';

import { usePlaylistLike } from '@/hooks/playlist/usePlaylistLike';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import React from 'react';

interface PlaylistLikeButtonProps {
  playlistId: string;
  isOwner?: boolean;
  showCount?: boolean;
  className?: string;
  size?: number;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

export function PlaylistLikeButton({
  playlistId,
  isOwner = false,
  showCount = true,
  className = '',
  size = 20,
}: PlaylistLikeButtonProps) {
  const { isLiked, likeCount, toggleLike, isMutating } = usePlaylistLike(playlistId, isOwner);

  // If owner, don't show like button (or show read-only count badge if needed)
  if (isOwner) {
    if (!showCount || likeCount <= 0) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium ${className}`}>
        <Heart size={size - 4} className="text-[#FA243C]" fill="currentColor" />
        <span>{formatCount(likeCount)}</span>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLike();
      }}
      disabled={isMutating}
      whileTap={{ scale: 0.9 }}
      aria-label={isLiked ? 'Unlike playlist' : 'Like playlist'}
      aria-pressed={isLiked}
      className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 select-none ${
        isLiked
          ? 'bg-[#FA243C]/10 border-[#FA243C]/30 text-[#FA243C] hover:bg-[#FA243C]/20'
          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20'
      } ${className}`}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.35, 0.9, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        <Heart
          size={size}
          className={`transition-colors duration-200 ${
            isLiked ? 'text-[#FA243C] fill-[#FA243C]' : 'text-current group-hover:scale-105'
          }`}
          fill={isLiked ? 'currentColor' : 'none'}
          strokeWidth={isLiked ? 2.5 : 2}
        />
      </motion.div>

      {showCount && (
        <span
          className={`text-xs font-medium tracking-tight transition-colors duration-200 ${
            isLiked ? 'text-[#FA243C]' : 'text-white/60 group-hover:text-white/80'
          }`}
        >
          {formatCount(likeCount)}
        </span>
      )}
    </motion.button>
  );
}
