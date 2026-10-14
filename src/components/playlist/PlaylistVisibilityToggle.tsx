'use client';

import { useTogglePlaylistVisibility } from '@/hooks/playlist/useTogglePlaylistVisibility';
import { Globe, Lock } from 'lucide-react';
import React from 'react';

interface PlaylistVisibilityToggleProps {
  playlistId: string;
  isPublic?: boolean;
  asMenuItem?: boolean;
  onToggleSuccess?: () => void;
}

export function PlaylistVisibilityToggle({
  playlistId,
  isPublic = false,
  asMenuItem = true,
  onToggleSuccess,
}: PlaylistVisibilityToggleProps) {
  const toggleMutation = useTogglePlaylistVisibility();

  const handleToggle = () => {
    toggleMutation.mutate(
      { playlistId, currentPublicStatus: isPublic },
      {
        onSuccess: () => {
          onToggleSuccess?.();
        },
      }
    );
  };

  if (asMenuItem) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Globe size={15} className="text-[#22C55E]" />
          ) : (
            <Lock size={15} className="text-white/60 group-hover:text-white" />
          )}
          <span>{isPublic ? 'Public Playlist' : 'Private Playlist'}</span>
        </div>

        {/* Toggle Switch Pill */}
        <div
          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
            isPublic ? 'bg-[#22C55E]/40 border border-[#22C55E]/60' : 'bg-white/10 border border-white/20'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
              isPublic ? 'translate-x-4 bg-[#22C55E]' : 'translate-x-0 bg-white/70'
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={toggleMutation.isPending}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        isPublic
          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20'
          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {isPublic ? <Globe size={14} /> : <Lock size={14} />}
      <span>{isPublic ? 'Public' : 'Private'}</span>
    </button>
  );
}
