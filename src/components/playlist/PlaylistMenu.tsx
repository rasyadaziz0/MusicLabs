'use client';

import { PlaylistLikeButton } from '@/components/playlist/PlaylistLikeButton';
import { PlaylistVisibilityToggle } from '@/components/playlist/PlaylistVisibilityToggle';
import { PlaylistPresenter } from '@/lib/playlist/PlaylistPresenter';
import { Code, Edit2, Link2, MoreHorizontal, Pin, Share, Trash2, UserPlus } from 'lucide-react';
import React, { RefObject } from 'react';

interface PlaylistMenuProps {
  presenter: PlaylistPresenter;
  isMenuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onCopyEmbedCode: () => void;
  onManageCollaborators: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onVisibilityToggleSuccess: () => void;
}

export function PlaylistMenu({
  presenter,
  isMenuOpen,
  menuRef,
  onToggleMenu,
  onShare,
  onCopyLink,
  onCopyEmbedCode,
  onManageCollaborators,
  onEdit,
  onTogglePin,
  onDelete,
  onVisibilityToggleSuccess,
}: PlaylistMenuProps) {
  if (!presenter.playlist) return null;

  return (
    <div className="flex items-center gap-2">
      <PlaylistLikeButton
        playlistId={presenter.playlist.id}
        isOwner={presenter.isOwner}
        showCount={true}
      />

      <div className="relative" ref={menuRef}>
        <button
          onClick={onToggleMenu}
          className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#252525]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 flex flex-col overflow-hidden">
            <button
              onClick={onShare}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <span>Share</span>
              <Share size={15} className="text-white/60" />
            </button>

            <div className="my-1 border-t border-white/10 mx-3" />

            <button
              onClick={onCopyLink}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <span>Copy Link</span>
              <Link2 size={15} className="text-white/60" />
            </button>

            <div className="my-1 border-t border-white/10 mx-3" />

            <button
              onClick={onCopyEmbedCode}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group"
            >
              <span>Copy Embed Code</span>
              <Code size={15} className="text-white/60 group-hover:text-white transition-colors" />
            </button>

            {presenter.isOwner && (
              <>
                <div className="my-1 border-t border-white/10 mx-3" />

                <PlaylistVisibilityToggle
                  playlistId={presenter.playlist.id}
                  isPublic={presenter.isPublic}
                  onToggleSuccess={onVisibilityToggleSuccess}
                />

                <button
                  onClick={onManageCollaborators}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Manage Collaborators</span>
                  <UserPlus size={15} className="text-white/60" />
                </button>

                <button
                  onClick={onEdit}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Edit Playlist</span>
                  <Edit2 size={15} className="text-white/60" />
                </button>

                <button
                  onClick={onTogglePin}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>{presenter.isPinned ? 'Unpin Playlist' : 'Pin Playlist'}</span>
                  <Pin size={15} className="text-white/60" />
                </button>

                <div className="my-1 border-t border-white/10 mx-3" />

                <button
                  onClick={onDelete}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Delete Playlist</span>
                  <Trash2 size={15} className="text-red-500/80" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
