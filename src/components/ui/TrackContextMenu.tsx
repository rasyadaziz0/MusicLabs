'use client';

import React from 'react';
import Image from 'next/image';
import {
  PlaySquare,
  ListPlus,
  Heart,
  ChevronRight,
  Radio,
  Disc3,
  Mic2,
  Share,
  Link2,
  Code,
} from 'lucide-react';
import { Song } from '@/types/music';
import { useTranslation } from '@/context/LanguageContext';
import { ContextMenu } from './context-menu/ContextMenu';
import { ContextMenuItem, ContextMenuDivider } from './context-menu/ContextMenuItem';
import { PlaylistSubMenu } from './context-menu/PlaylistSubMenu';
import { TrackSleepTimerMenu } from './context-menu/TrackSleepTimerMenu';
import { TrackContextMenuPresenter } from '@/lib/track/TrackContextMenuPresenter';
import { useTrackContextMenuController } from '@/hooks/track/useTrackContextMenuController';

export interface TrackContextMenuProps {
  track: Song | null;
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  showPlayerControls?: boolean;
}

export function TrackContextMenu({
  track,
  isOpen,
  position,
  onClose,
  showPlayerControls,
}: TrackContextMenuProps) {
  const { t } = useTranslation();
  const controller = useTrackContextMenuController({ track, isOpen, onClose });

  if (!track) return null;

  const hasAlbum = TrackContextMenuPresenter.hasAlbum(track);
  const hasArtist = TrackContextMenuPresenter.hasArtist(track);
  const flyOutDirection = TrackContextMenuPresenter.getFlyoutDirection(position);
  const coverUrl = TrackContextMenuPresenter.getCoverImage(track);
  const artistNames = TrackContextMenuPresenter.getArtistNames(track);

  const renderMenuItems = () => {
    if (controller.showPlaylists && controller.isMobile) {
      return (
        <PlaylistSubMenu
          track={track}
          onClose={onClose}
          onBack={() => controller.setShowPlaylists(false)}
        />
      );
    }

    return (
      <div className="py-1">
        <ContextMenuItem
          icon={<PlaySquare size={15} />}
          label={t('context_menu.play_next')}
          onClick={controller.handlePlayNext}
        />
        <ContextMenuItem
          icon={<ListPlus size={15} />}
          label={t('context_menu.play_last')}
          onClick={controller.handleAddToQueue}
        />

        <ContextMenuDivider />

        <ContextMenuItem
          icon={<Heart size={15} fill={controller.isLiked ? 'currentColor' : 'none'} />}
          label={controller.isLiked ? t('context_menu.remove_from_library') : t('context_menu.add_to_library')}
          onClick={(e) => {
            e.stopPropagation();
            controller.handleToggleLike();
          }}
          danger={controller.isLiked}
        />

        <div
          className="relative"
          onMouseEnter={() => !controller.isMobile && controller.setShowPlaylists(true)}
          onMouseLeave={() => !controller.isMobile && controller.setShowPlaylists(false)}
        >
          <ContextMenuItem
            icon={<ListPlus size={15} />}
            label={t('context_menu.add_to_playlist')}
            onClick={(e) => {
              e.stopPropagation();
              if (controller.isMobile) controller.setShowPlaylists(true);
            }}
            rightElement={!controller.isMobile && <ChevronRight size={14} />}
            className={!controller.isMobile && controller.showPlaylists ? 'bg-white/10' : ''}
          />
          {!controller.isMobile && controller.showPlaylists && (
            <div
              className={`absolute top-0 ${
                flyOutDirection === 'left' ? 'right-full mr-1' : 'left-full ml-1'
              } w-56 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <PlaylistSubMenu
                track={track}
                onClose={onClose}
                onBack={() => controller.setShowPlaylists(false)}
                hideHeader
              />
            </div>
          )}
        </div>

        <ContextMenuItem
          icon={<Radio size={15} />}
          label={t('context_menu.create_station')}
          onClick={controller.handleCreateStation}
        />

        <ContextMenuDivider />

        {hasAlbum && (
          <ContextMenuItem
            icon={<Disc3 size={15} />}
            label={t('context_menu.go_to_album')}
            onClick={controller.handleGoToAlbum}
          />
        )}
        {hasArtist && (
          <ContextMenuItem
            icon={<Mic2 size={15} />}
            label={t('context_menu.go_to_artist')}
            onClick={controller.handleGoToArtist}
          />
        )}

        <ContextMenuDivider />

        <ContextMenuItem
          icon={<Share size={15} />}
          label={t('context_menu.share')}
          onClick={controller.handleShare}
        />
        <ContextMenuItem
          icon={<Link2 size={15} />}
          label={t('context_menu.copy_link')}
          onClick={controller.handleCopyLink}
        />
        <ContextMenuItem
          icon={<Code size={15} />}
          label={t('context_menu.copy_embed_code')}
          onClick={controller.handleCopyEmbedCode}
        />

        {showPlayerControls && (
          <TrackSleepTimerMenu
            sleepTimerEndTime={controller.sleepTimerEndTime}
            onSetTimer={controller.setSleepTimer}
            onClearTimer={controller.clearSleepTimer}
            onClose={onClose}
          />
        )}
      </div>
    );
  };

  const mobileHeader = (
    <div className="px-5 pb-4 pt-2 flex items-center gap-4 border-b border-white/10">
      <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={track.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-white truncate">{track.name}</h3>
        <p className="text-sm text-white/50 truncate">{artistNames}</p>
      </div>
    </div>
  );

  return (
    <ContextMenu
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      mobileHeader={mobileHeader}
    >
      {renderMenuItems()}
    </ContextMenu>
  );
}
