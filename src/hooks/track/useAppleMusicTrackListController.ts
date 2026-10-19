import { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AppleMusicTrackListPresenter } from '@/lib/track/AppleMusicTrackListPresenter';

export interface UseAppleMusicTrackListControllerParams {
  tracks: Song[];
  isReorderable?: boolean;
  onPlayTrack: (track: Song, allTracks: Song[], index?: number) => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

export function useAppleMusicTrackListController({
  tracks,
  isReorderable = false,
  onPlayTrack,
  onReorder,
}: UseAppleMusicTrackListControllerParams) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    track: Song | null;
    x: number;
    y: number;
    isOpen: boolean;
  }>({ track: null, x: 0, y: 0, isOpen: false });

  const { currentTrack, isPlaying } = usePlayer();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
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

  const handleContextMenu = (e: React.MouseEvent, song: Song) => {
    e.preventDefault();
    setContextMenu({ track: song, x: e.clientX, y: e.clientY, isOpen: true });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const handleTouchStart = (e: React.TouchEvent, song: Song) => {
    if (isReorderable) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      suppressClickRef.current = true;
      setContextMenu({ track: song, x: touch.clientX, y: touch.clientY, isOpen: true });
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 500);
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

  const handleTrackClick = (song: Song, index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onPlayTrack(song, tracks, index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id && onReorder) {
      const oldIndex = tracks.findIndex(
        (t, idx) => AppleMusicTrackListPresenter.getTrackKey(t, idx) === active.id || t.id === active.id
      );
      const newIndex = tracks.findIndex(
        (t, idx) => AppleMusicTrackListPresenter.getTrackKey(t, idx) === over.id || t.id === over.id
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  const toggleTrackMenu = (songId: string) => {
    setActiveMenuId((prev) => (prev === songId ? null : songId));
  };

  const closeTrackMenu = () => {
    setActiveMenuId(null);
  };

  return {
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
  };
}
