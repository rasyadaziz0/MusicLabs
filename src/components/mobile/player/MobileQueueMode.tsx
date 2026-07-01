'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { QueuePopupController } from '@/components/player/QueuePopupController';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Heart, MoreHorizontal, Shuffle, Repeat, Infinity as InfinityIcon, Disc, Menu } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface MobileQueueModeProps {
  currentTrack: any;
  coverUrl: string;
  artistNames: string;
  isLiked: boolean;
  handleToggleLike?: (e?: any) => void;
  onClose: () => void;
  isShuffled: boolean;
  repeatMode: string;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setIsDevicesOpen?: (val: boolean) => void;
}

// Exact Apple Music iOS Sortable Track Row
function AppleMusicQueueRow({ track, onClick }: { track: any; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1,
    position: isDragging ? 'relative' as const : undefined,
  };

  const imgUrl = getBestImageUrl(track.image);
  const trackArtist = track.artists?.primary?.map((a: any) => a.name).join(', ') || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className="flex items-center justify-between py-2 px-1 group active:bg-white/10 rounded-xl transition-all cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        <div className="w-11 h-11 rounded-lg overflow-hidden relative flex-shrink-0 bg-white/10 shadow-sm border border-white/5">
          {imgUrl && (
            <Image src={imgUrl} alt={track.name} fill sizes="44px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-white tracking-tight truncate leading-snug">
            {track.name}
          </p>
          <p className="text-[13px] text-white/55 tracking-tight truncate mt-0.5">
            {trackArtist}
          </p>
        </div>
      </div>

      {/* Drag Handle Apple Music iOS */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-2.5 text-white/30 hover:text-white/60 active:text-white transition-colors touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </svg>
      </div>
    </div>
  );
}

export function MobileQueueMode(props: MobileQueueModeProps) {
  const {
    currentTrack, coverUrl, artistNames, isLiked, handleToggleLike,
    isShuffled, repeatMode, toggleShuffle, cycleRepeatMode, setIsDevicesOpen
  } = props;

  const player = usePlayer();
  const controller = useMemo(() => new QueuePopupController(player), [player]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const albumOrPlaylistName = currentTrack?.album?.name || 'Your Library';

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden select-none px-2">
      {/* ── PINNED TOP HEADER SECTION (Does not scroll) ── */}
      <div className="flex-shrink-0 flex flex-col w-full pt-0.5 pb-1">
        
        {/* 1. Current Track Box (Apple Music iOS Sheet Header) */}
        <div className="flex items-center justify-between p-2.5 bg-white/[0.08] rounded-2xl border border-white/5 shadow-md">
          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
            <div className="w-[52px] h-[52px] rounded-xl overflow-hidden relative flex-shrink-0 shadow-sm border border-white/10 bg-white/5">
              {coverUrl && (
                <Image src={coverUrl} alt={currentTrack.name} fill sizes="52px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-bold text-white tracking-tight truncate">
                {currentTrack.name}
              </p>
              <p className="text-[13.5px] text-white/60 tracking-tight truncate mt-0.5 font-medium">
                {artistNames}
              </p>
            </div>
          </div>

          {/* Right Action Circles (Heart & More) */}
          <div className="flex items-center gap-2 flex-shrink-0 pl-1">
            <button
              onClick={handleToggleLike}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-85 transition-all text-white outline-none"
              title="Suka"
            >
              <Heart size={16} fill={isLiked ? '#ff3b30' : 'none'} color={isLiked ? '#ff3b30' : 'currentColor'} strokeWidth={2} />
            </button>
            <button
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-85 transition-all text-white/80 outline-none"
              title="Lainnya"
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 2. 4 Action Pills Row (Shuffle | Repeat | Autoplay | Audio Route) */}
        <div className="flex items-center gap-2.5 my-3.5 w-full">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`h-10 flex-1 rounded-full flex items-center justify-center transition-all active:scale-95 outline-none shadow-sm ${
              isShuffled ? 'bg-white/85 text-[#18261e] font-bold' : 'bg-white/15 text-white/90 hover:bg-white/20'
            }`}
          >
            <Shuffle size={18} strokeWidth={isShuffled ? 2.5 : 2} />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeatMode}
            className={`h-10 flex-1 rounded-full flex items-center justify-center transition-all active:scale-95 outline-none shadow-sm relative ${
              repeatMode !== 'none' ? 'bg-white/85 text-[#18261e] font-bold' : 'bg-white/15 text-white/90 hover:bg-white/20'
            }`}
          >
            <Repeat size={18} strokeWidth={repeatMode !== 'none' ? 2.5 : 2} />
            {repeatMode === 'one' && (
              <span className="absolute text-[8.5px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                1
              </span>
            )}
          </button>

          {/* Autoplay / Infinite */}
          <button
            onClick={() => (player as any).toggleAutoplay?.()}
            className={`h-10 flex-1 rounded-full flex items-center justify-center transition-all active:scale-95 outline-none shadow-sm ${
              (player as any).isAutoplayEnabled ? 'bg-white/85 text-[#18261e] font-bold' : 'bg-white/15 text-white/90 hover:bg-white/20'
            }`}
          >
            <InfinityIcon size={19} strokeWidth={(player as any).isAutoplayEnabled ? 2.5 : 2} />
          </button>

          {/* AirPlay Route Route */}
          <button
            onClick={() => setIsDevicesOpen?.(true)}
            className="h-10 flex-1 rounded-full flex items-center justify-center bg-white/15 text-white/90 hover:bg-white/20 transition-all active:scale-95 outline-none shadow-sm"
          >
            <Disc size={18} strokeWidth={2} />
          </button>
        </div>

        {/* 3. "Playing Next" Header Row */}
        <div className="flex items-center justify-between px-1.5 pt-1 pb-1.5">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="text-[17px] font-bold text-white tracking-tight leading-snug">
              Playing Next
            </h3>
            <p className="text-[13px] text-white/55 font-medium tracking-tight truncate mt-0.5">
              {`From ${albumOrPlaylistName}`}
            </p>
          </div>
          {controller.hasUpcomingTracks && (
            <button
              onClick={() => controller.clearQueue()}
              className="text-white/70 hover:text-white font-medium text-[15px] transition-colors active:opacity-50 px-2 py-1 outline-none"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* ── SCROLLABLE QUEUE TRACKS LIST ONLY ── */}
      <div className="flex-1 overflow-y-auto pb-4 pt-1 scrollbar-none">
        {/* 4. Queue Tracks DnD List */}
        <div className="flex flex-col gap-1">
          {!controller.hasUpcomingTracks ? (
            <div className="py-12 flex items-center justify-center">
              <p className="text-[14px] text-white/40 font-medium">
                No upcoming tracks
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={controller.handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <SortableContext
                items={controller.manualItems.map(t => t.uniqueId)}
                strategy={verticalListSortingStrategy}
              >
                {controller.manualItems.map((track) => (
                  <AppleMusicQueueRow
                    key={track.uniqueId}
                    track={track}
                    onClick={() => controller.playTrack(track)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Autoplay Section */}
          {controller.autoplayItems.length > 0 && (
            <div className="mt-5 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 px-1.5 pb-2 text-[12.5px] font-bold text-white/50 uppercase tracking-wider">
                <span>Autoplay</span>
                <InfinityIcon size={13} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {controller.autoplayItems.map((track) => (
                  <div
                    key={track.uniqueId}
                    onClick={() => controller.playTrack(track)}
                    className="flex items-center justify-between py-2 px-1 group active:bg-white/10 rounded-xl transition-all cursor-pointer select-none opacity-80 hover:opacity-100"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden relative flex-shrink-0 bg-white/10">
                        {getBestImageUrl(track.image) && (
                          <Image src={getBestImageUrl(track.image)!} alt={track.name} fill sizes="44px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-white tracking-tight truncate">
                          {track.name}
                        </p>
                        <p className="text-[13px] text-white/55 tracking-tight truncate mt-0.5">
                          {track.artists?.primary?.map((a: any) => a.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
