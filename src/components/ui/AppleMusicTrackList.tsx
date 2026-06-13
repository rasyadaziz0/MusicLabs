import { useState, useEffect, ReactNode, useRef } from 'react';
import Image from 'next/image';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Heart, MoreHorizontal, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { TrackContextMenu } from './TrackContextMenu';
import { EqualizerIcon } from '@/components/ui/EqualizerIcon';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

export interface AppleMusicTrackListProps {
  tracks: Song[];
  onPlayTrack: (track: Song, allTracks: Song[]) => void;
  showHeart?: boolean;
  showAlbum?: boolean;
  hideHeader?: boolean;
  renderTrackOptions?: (track: Song, closeMenu: () => void) => ReactNode;
  className?: string;
  isReorderable?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

function SortableTrackItem({
  song,
  index,
  children,
  isReorderable
}: {
  song: Song,
  index: number,
  children: (dragProps: any) => React.ReactNode,
  isReorderable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.uniqueId || `${song.id}-${index}`, disabled: !isReorderable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : undefined,
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
  className = "space-y-1 mt-12 w-full",
  isReorderable = false,
  onReorder,
}: AppleMusicTrackListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ track: Song | null, x: number, y: number, isOpen: boolean }>({ track: null, x: 0, y: 0, isOpen: false });
  const { currentTrack, isPlaying } = usePlayer();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const suppressClickRef = useRef<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  if (tracks.length === 0) return null;

  const totalDuration = tracks.reduce((acc, song) => acc + song.duration, 0);

  const handleContextMenu = (e: React.MouseEvent, song: Song) => {
    e.preventDefault();
    setContextMenu({ track: song, x: e.clientX, y: e.clientY, isOpen: true });
  };

  const handleTouchStart = (e: React.TouchEvent, song: Song) => {
    if (isReorderable) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      suppressClickRef.current = true;
      setContextMenu({ track: song, x: touch.clientX, y: touch.clientY, isOpen: true });
      // Clear flag after a short delay so normal clicks work again later
      setTimeout(() => { suppressClickRef.current = false; }, 500);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isReorderable || !touchStartPos.current || !longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTrackClick = (song: Song, allTracks: Song[]) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onPlayTrack(song, allTracks);
  };

  return (
    <section className={className}>
      {/* Table Header */}
      {!hideHeader && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 text-[13px] font-semibold text-white/50 uppercase tracking-wider mb-2">
          {showHeart && <div className="w-6 flex-shrink-0"></div>}
          <div className="flex-1 min-w-0">Song</div>
          <div className="hidden md:block w-1/4 min-w-0">Artist</div>
          {showAlbum && <div className="hidden md:block w-1/4 min-w-0">Album</div>}
          <div className="w-12 md:w-16 flex-shrink-0 text-right">Time</div>
          {renderTrackOptions && <div className="w-8 flex-shrink-0"></div>}
        </div>
      )}

      {/* Tracks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event;
          if (active && over && active.id !== over.id && onReorder) {
            const oldIndex = tracks.findIndex((t) => t.id === active.id);
            const newIndex = tracks.findIndex((t) => t.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              onReorder(oldIndex, newIndex);
            }
          }
        }}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={tracks.map((t, index) => t.uniqueId || `${t.id}-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {tracks.map((song, index) => {
              const isCurrentTrack = currentTrack?.id === song.id;
              const uniqueKey = song.uniqueId || `${song.id}-${index}`;

              return (
                <SortableTrackItem key={uniqueKey} song={song} index={index} isReorderable={isReorderable}>
                  {({ attributes, listeners }) => (
                    <div
                      onClick={() => handleTrackClick(song, tracks)}
                      onContextMenu={(e) => handleContextMenu(e, song)}
                      onTouchStart={(e) => handleTouchStart(e, song)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                      className={`group flex items-center gap-4 rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${isCurrentTrack
                        ? 'bg-[#D80F1D] text-white'
                        : 'hover:bg-white/10'
                        }`}
                      {...(isReorderable ? { ...attributes, ...listeners } : {})}
                    >

                      {showHeart && (
                        <div className={`w-6 flex-shrink-0 flex justify-center ${isCurrentTrack ? 'text-white' : 'text-[#FA243C]'}`}>
                          <Heart size={12} fill="currentColor" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded bg-white/10 overflow-hidden shadow-sm">
                          {getBestImageUrl(song.image) ? (
                            <Image
                              src={getBestImageUrl(song.image)!}
                              alt={song.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                          )}

                          {isCurrentTrack && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <EqualizerIcon isPlaying={isPlaying} color="red" />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm font-medium text-white">
                          {song.name}
                        </span>
                      </div>

                      <div className={`hidden md:block w-1/4 min-w-0 truncate text-sm transition-colors ${isCurrentTrack ? 'text-white' : 'text-white/70'} pointer-events-auto relative z-10`}>
                        {song.artists.primary.map((a, i) => (
                          <span
                            key={a.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/artist/${a.id}`}
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
                          className={`hidden md:block w-1/4 min-w-0 truncate text-sm transition-colors ${isCurrentTrack ? 'text-white' : 'text-white/70'} pointer-events-auto relative z-10`}
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

                      <div className={`w-12 md:w-16 flex-shrink-0 text-right text-xs ${isCurrentTrack ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </div>

                      {renderTrackOptions && (
                        <div className="w-8 flex-shrink-0 relative flex items-center justify-center">
                          <button
                            className={`transition-all hover:text-white md:opacity-0 md:group-hover:opacity-100 ${activeMenuId === song.id ? '!opacity-100 text-white' : 'opacity-100 text-white/50'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === song.id ? null : song.id);
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeMenuId === song.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 py-1 flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderTrackOptions(song, () => setActiveMenuId(null))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SortableTrackItem>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-12 pt-6 border-t border-white/5 text-sm text-white/50 px-4 pb-12">
        {tracks.length} {tracks.length === 1 ? 'lagu' : 'lagu'}, {(() => {
          const totalMins = Math.floor(totalDuration / 60);
          const hours = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          if (hours > 0) {
            return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`.trim();
          }
          return `${mins} menit`;
        })()}
      </div>

      <TrackContextMenu
        track={contextMenu.track}
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}
