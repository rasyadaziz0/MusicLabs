'use client';

import React, { useState } from 'react';
import { Heart, MoreHorizontal, Loader2 } from 'lucide-react';
import { Song } from '@/types/music';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongsIndex, useToggleLikedSong } from '@/hooks/useMusicLibrary';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';

interface TrackHeaderActionsProps {
  /** Serialized Song JSON passed from server component */
  trackJson: string;
}

export default function TrackHeaderActions({ trackJson }: TrackHeaderActionsProps) {
  const { user, signInWithGoogle } = useAuth();
  const { likedSet } = useLikedSongsIndex();
  const toggleLikeMutation = useToggleLikedSong();
  
  const track: Song = JSON.parse(trackJson);
  const isLiked = likedSet.has(track.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    toggleLikeMutation.mutate(track.id);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      x: Math.max(10, rect.right - 220),
      y: rect.bottom + 8,
    });
    setMenuOpen(true);
  };

  return (
    <div className="flex items-center gap-3 z-20">
      <button
        onClick={handleToggleLike}
        disabled={toggleLikeMutation.isPending}
        title={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
        aria-label={isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
        className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white shadow-lg shadow-black/30"
      >
        {toggleLikeMutation.isPending ? (
          <Loader2 size={18} className="animate-spin text-white/40" />
        ) : (
          <Heart
            size={18}
            fill={isLiked ? '#FA243C' : 'none'}
            className={`transition-colors ${
              isLiked ? 'text-[#FA243C]' : 'text-white/80 hover:text-white'
            }`}
          />
        )}
      </button>

      <button
        onClick={handleOpenMenu}
        title="More options (Add to Playlist, Queue, Share)"
        aria-label="More options"
        className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white shadow-lg shadow-black/30"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Context Menu Modal / Dropdown */}
      <TrackContextMenu
        track={track}
        isOpen={menuOpen}
        position={menuPos}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
