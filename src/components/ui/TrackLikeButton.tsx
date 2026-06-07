'use client';

import { Heart, Loader2 } from 'lucide-react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongsIndex, useToggleLikedSong } from '@/hooks/useMusicLibrary';

interface TrackLikeButtonProps {
  track: Song;
  className?: string;
  asMenuItem?: boolean;
}

export default function TrackLikeButton({ track, className, asMenuItem }: TrackLikeButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const { likedSet } = useLikedSongsIndex();
  const toggleMutation = useToggleLikedSong();
  const isLiked = likedSet.has(track.id);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    toggleMutation.mutate(track.id);
  };

  if (asMenuItem) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={toggleMutation.isPending}
        className={cn(
          'w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/10 disabled:opacity-60 flex items-center justify-between group',
          isLiked ? 'text-primary' : 'text-white',
          className
        )}
      >
        <span>{isLiked ? 'Remove from Liked Songs' : 'Favourite'}</span>
        {toggleMutation.isPending ? (
          <Loader2 size={15} className="animate-spin text-white/40" />
        ) : (
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? '' : 'text-white/40 group-hover:text-white/80 transition-colors'} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:text-white disabled:opacity-60',
        isLiked && 'text-primary',
        className
      )}
      title={isLiked ? 'Remove from liked songs' : 'Save to liked songs'}
      aria-label={isLiked ? 'Remove from liked songs' : 'Save to liked songs'}
    >
      {toggleMutation.isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
      )}
    </button>
  );
}
