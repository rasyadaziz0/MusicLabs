'use client';

import CollaboratorModal from '@/components/playlist/CollaboratorModal';
import { PlaylistMenu } from '@/components/playlist/PlaylistMenu';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { PlaylistTrackListSection } from '@/components/playlist/PlaylistTrackListSection';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePlaylistController } from '@/hooks/library/usePlaylistController';
import { Plus } from 'lucide-react';
import Image from 'next/image';

export default function PlaylistPage() {
  const {
    playlistId,
    presenter,
    isLoading,
    isTracksLoading,
    isMenuOpen,
    isCollaboratorModalOpen,
    isDeleteDialogOpen,
    menuRef,
    actions,
  } = usePlaylistController();

  if (isLoading) {
    return <PlaylistSkeleton />;
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      {/* Hero Section */}
      <AppleMusicHeader
        title={presenter.name}
        subtitle={presenter.subtitle}
        description={presenter.description}
        cover={
          <div className="relative w-full h-full group">
            {presenter.coverUrl ? (
              <Image
                src={presenter.coverUrl}
                alt={presenter.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
                <Plus size={64} className="text-white/20" />
              </div>
            )}
          </div>
        }
        onPlay={actions.handlePlay}
        onShuffle={actions.handleShuffle}
        backHref="/library"
        topRightActions={
          <PlaylistMenu
            presenter={presenter}
            isMenuOpen={isMenuOpen}
            menuRef={menuRef}
            onToggleMenu={() => actions.setIsMenuOpen(!isMenuOpen)}
            onShare={actions.handleShare}
            onCopyLink={actions.handleCopyLink}
            onCopyEmbedCode={actions.handleCopyEmbedCode}
            onManageCollaborators={() => actions.setIsCollaboratorModalOpen(true)}
            onEdit={actions.navigateToEdit}
            onTogglePin={actions.handleTogglePin}
            onDelete={() => actions.setIsDeleteDialogOpen(true)}
            onVisibilityToggleSuccess={() => actions.setIsMenuOpen(false)}
          />
        }
      />

      {/* Tracklist */}
      <PlaylistTrackListSection
        presenter={presenter}
        isLoading={isTracksLoading}
        onPlayTrack={actions.handlePlayTrack}
        onReorder={actions.handleReorder}
        onRemoveTrack={actions.handleRemoveTrack}
      />

      {playlistId && (
        <CollaboratorModal
          playlistId={playlistId}
          isOpen={isCollaboratorModalOpen}
          onClose={() => actions.setIsCollaboratorModalOpen(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => actions.setIsDeleteDialogOpen(false)}
        onConfirm={actions.handleDeleteConfirm}
        title="Delete Playlist"
        description={
          presenter.playlist
            ? `Are you sure you want to delete "${presenter.playlist.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this playlist?'
        }
        confirmText="Delete"
      />
    </div>
  );
}
