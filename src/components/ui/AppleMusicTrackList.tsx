'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MoreHorizontal } from 'lucide-react';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { EqualizerIcon } from '@/components/ui/EqualizerIcon';
import { TrackContextMenu } from './TrackContextMenu';
import { useTranslation } from '@/context/LanguageContext';
import { Song } from '@/types/music';
import { AppleMusicTrackListPresenter } from '@/lib/track/AppleMusicTrackListPresenter';
import { useAppleMusicTrackListController } from '@/hooks/track/useAppleMusicTrackListController';

export interface AppleMusicTrackListProps {
  tracks: Song[];
  onPlayTrack: (track: Song, allTracks: Song[], index?: number) => void;
  showHeart?: boolean;
  showAlbum?: boolean;
  hideHeader?: boolean;
  renderTrackOptions?: (track: Song, closeMenu: () => void) => ReactNode;
  className?: string;
  isReorderable?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

interface SortableTrackItemProps {
  song: Song;
  index: number;
  children: (dragProps: { attributes: ReturnType<typeof useSortable>['attributes']; listeners: ReturnType<typeof useSortable>['listeners'] }) => ReactNode;
  isReorderable: boolean;
}

function SortableTrackItem({ song, index, children, isReorderable }: SortableTrackItemProps) {
  const sortableId = AppleMusicTrackListPresenter.getTrackKey(song, index);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    disabled: !isReorderable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

export function AppleMusicTrackList({
  tracks,
  onPlayTrack,
  showHeart = false,
  showAlbum = true,
  hideHeader = false,
  renderTrackOptions,
  className = 'space-y-1 mt-12 w-full',
  isReorderable = false,
  onReorder,
}: AppleMusicTrackListProps) {
  const { t } = useTranslation();
  const {
    sensors,
    currentTrack,
    isPlaying,
    activeMenuId,
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTrackClick,
    handleDragEnd,
    toggleTrackMenu,
    closeTrackMenu,
  } = useAppleMusicTrackListController({
    tracks,
    isReorderable,
    onPlayTrack,
    onReorder,
  });

  if (tracks.length === 0) return null;

  const totalDuration = AppleMusicTrackListPresenter.calculateTotalDuration(tracks);
  const summaryText = AppleMusicTrackListPresenter.formatSummary(tracks.length, totalDuration, t);
  const sortableIds = tracks.map((t, index) => AppleMusicTrackListPresenter.getTrackKey(t, index));

  return (
    <section className={className}>
      {/* Table Header */}
      {!hideHeader && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-[13px] font-semibold text-white/50 uppercase tracking-wider mb-2">
          {showHeart && <div className="w-6 flex-shrink-0" />}
          <div className="flex-1 min-w-0">{t('tracklist.song')}</div>
          <div className="hidden md:block w-1/4 min-w-0">{t('tracklist.artist')}</div>
          {showAlbum && <div className="hidden md:block w-1/4 min-w-0">{t('tracklist.album')}</div>}
          <div className="w-12 md:w-16 flex-shrink-0 text-right">{t('tracklist.time')}</div>
          {renderTrackOptions && <div className="w-8 flex-shrink-0" />}
        </div>
      )}

      {/* Tracks with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {tracks.map((song, index) => {
              const isCurrent = AppleMusicTrackListPresenter.isCurrentTrack(currentTrack?.id, song.id);
              const uniqueKey = AppleMusicTrackListPresenter.getTrackKey(song, index);
              const coverUrl = AppleMusicTrackListPresenter.getBestCoverUrl(song);
              const durationFormatted = AppleMusicTrackListPresenter.formatTrackDuration(song.duration);

              return (
                <SortableTrackItem key={uniqueKey} song={song} index={index} isReorderable={isReorderable}>
                  {({ attributes, listeners }) => (
                    <div
                      onClick={() => handleTrackClick(song, index)}
                      onContextMenu={(e) => handleContextMenu(e, song)}
                      onTouchStart={(e) => handleTouchStart(e, song)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                      className={`group flex items-center gap-4 rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-[#D80F1D] text-white' : 'hover:bg-white/10'
                      }`}
                      {...(isReorderable ? { ...attributes, ...listeners } : {})}
                    >
                      {showHeart && (
                        <div
                          className={`w-6 flex-shrink-0 flex justify-center ${
                            isCurrent ? 'text-white' : 'text-[#FA243C]'
                          }`}
                        >
                          <Heart size={12} fill="currentColor" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded bg-white/10 overflow-hidden shadow-sm">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt={song.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                          )}

                          {isCurrent && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <EqualizerIcon isPlaying={isPlaying} color="red" />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm font-medium text-white">{song.name}</span>
                      </div>

                      <div
                        className={`hidden md:block w-1/4 min-w-0 truncate text-sm transition-colors ${
                          isCurrent ? 'text-white' : 'text-white/70'
                        } pointer-events-auto relative z-10`}
                      >
                        {song.artists.primary.map((a, i) => (
                          <span key={a.id} onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={AppleMusicTrackListPresenter.getArtistLink(a)}
                              className="hover:underline hover:text-white transition-colors"
                            >
                              {a.name}
                            </Link>
                            {i < song.artists.primary.length - 1 && ', '}
                          </span>
                        ))}
                      </div>

                      {showAlbum && (
                        <div
                          className={`hidden md:block w-1/4 min-w-0 truncate text-sm transition-colors ${
                            isCurrent ? 'text-white' : 'text-white/70'
                          } pointer-events-auto relative z-10`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {song.album.id ? (
                            <Link
                              href={`/album/${song.album.id}`}
                              className="hover:underline hover:text-white transition-colors"
                            >
                              {song.album.name}
                            </Link>
                          ) : (
                            song.album.name
                          )}
                        </div>
                      )}

                      <div
                        className={`w-12 md:w-16 flex-shrink-0 text-right text-xs ${
                          isCurrent ? 'text-white' : 'text-white/50 group-hover:text-white/70'
                        }`}
                      >
                        {durationFormatted}
                      </div>

                      {renderTrackOptions && (
                        <div className="w-8 flex-shrink-0 relative flex items-center justify-center">
                          <button
                            className={`transition-all hover:text-white md:opacity-0 md:group-hover:opacity-100 ${
                              activeMenuId === song.id ? '!opacity-100 text-white' : 'opacity-100 text-white/50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrackMenu(song.id);
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeMenuId === song.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 py-1 flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderTrackOptions(song, closeTrackMenu)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SortableTrackItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Summary Footer */}
      <div className="mt-12 pt-6 border-t border-white/5 text-sm text-white/50 px-4 pb-12">
        {summaryText}
      </div>

      <TrackContextMenu
        track={contextMenu.track}
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={closeContextMenu}
      />
    </section>
  );
}
