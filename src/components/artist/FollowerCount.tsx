'use client';

import { useArtistFollow } from '@/hooks/useArtistFollow';
import { motion } from 'framer-motion';

interface FollowerCountProps {
  artistId: string;
  artistName: string;
  className?: string;
}

function formatFollowers(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) {
    const formatted = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
  return `${formatted}M`;
}

export function FollowerCount({ artistId, artistName, className = '' }: FollowerCountProps) {
  const { followerCount, isLoading } = useArtistFollow({
    artistId,
    artistName,
  });

  if (isLoading && followerCount === 0) {
    return (
      <div className={`h-4 w-20 bg-white/10 rounded animate-pulse ${className}`} />
    );
  }

  return (
    <motion.span
      key={followerCount}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`text-xs md:text-sm text-white/60 font-medium ${className}`}
      aria-label={`${followerCount} followers`}
    >
      {formatFollowers(followerCount)} {followerCount === 1 ? 'follower' : 'followers'}
    </motion.span>
  );
}
