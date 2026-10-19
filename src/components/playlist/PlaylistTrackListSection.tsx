'use client';

import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import { useTranslation } from '@/context/LanguageContext';
import { PlaylistPresenter } from '@/lib/playlist/PlaylistPresenter';
import { Song } from '@/types/music';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface PlaylistTrackListSectionProps {
  presenter: PlaylistPresenter;
  isLoading: boolean;
  onPlayTrack: (song: Song, playlist?: Song[]) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onRemoveTrack: (trackId: string) => void;
}

export function PlaylistTrackListSection({
  presenter,
  isLoading,
  onPlayTrack,
  onReorder,
  onRemoveTrack,
}: PlaylistTrackListSectionProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-14 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!presenter.hasTracks) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center mt-8">
        <h2 className="text-xl font-bold mb-2">{t('library.playlist_empty')}</h2>
        <p className="text-sm text-white/50">
          {t('library.playlist_empty_desc')}
        </p>
      </div>
    );
  }

  return (
    <AppleMusicTrackList
      tracks={presenter.tracks}
      onPlayTrack={onPlayTrack}
      showHeart={false}
      showAlbum={true}
      isReorderable={presenter.canEdit}
      onReorder={onReorder}
      renderTrackOptions={(song, closeMenu) => (
        <>
          <TrackLikeButton track={song} asMenuItem />
          <div className="w-full">
            <AddToQueueButton track={song} showText />
          </div>
          <div className="w-full">
            <AddToPlaylistButton track={song} asMenuItem />
          </div>

          <div className="h-px bg-white/10 my-1 mx-2" />

          {presenter.canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTrack(song.id);
                closeMenu();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <Trash2 size={16} />
              Remove from Playlist
            </button>
          )}
        </>
      )}
    />
  );
}
