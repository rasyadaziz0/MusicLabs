'use client';

import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useAddTrackToPlaylist } from '@/hooks/library/useAddTrackToPlaylist';
import { useLibraryPlaylists } from '@/hooks/library/useLibraryPlaylists';
import { useLikedSongsIndex } from '@/hooks/library/useLikedSongsIndex';
import { useToggleLikedSong } from '@/hooks/library/useToggleLikedSong';
import { useLyrics } from '@/hooks/useLyrics';
import { useRomanization } from '@/hooks/useRomanization';
import { LyricSyncEngine } from '@/lib/lyrics/LyricSyncEngine';
import { TrackShareService } from '@/lib/services/TrackShareService';
import { MenuPositionCalculator } from '@/lib/utils/MenuPositionCalculator';
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

export function useNowPlaying(isOpen: boolean) {
  const player = usePlayer();
  const { currentTrack, duration, currentTime } = player;

  const trackId = currentTrack?.id ?? null;
  const isStation = Boolean(
    currentTrack?.isStation ||
    currentTrack?.label === 'YouTube Live Station' ||
    currentTrack?.album?.name === 'Live Station'
  );

  const { lines, isSynced, isLoading: isLyricsLoading } = useLyrics(currentTrack, duration);
  const romanizations = useRomanization(lines, trackId);
  const { user } = useAuth();
  const { likedSet } = useLikedSongsIndex();
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();
  const toggleLikeMutation = useToggleLikedSong();
  const addToPlaylistMutation = useAddTrackToPlaylist();

  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const mobileLyricsScrollRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isLiked = currentTrack ? likedSet.has(currentTrack.id) : false;

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [openMenuUpward, setOpenMenuUpward] = useState(false);
  const [isGuestGateOpen, setIsGuestGateOpen] = useState(false);
  const [guestGateAction, setGuestGateAction] = useState('use this feature');

  // Lyric sync index calculation via LyricSyncEngine
  const activeIndex = useMemo(
    () => LyricSyncEngine.findActiveIndex(lines, currentTime, trackId, isSynced),
    [currentTime, isSynced, lines, trackId]
  );

  // Close menus when NowPlaying modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLyricsOpen(false);
      setIsMoreMenuOpen(false);
    }
  }, [isOpen]);

  // Click outside listener for moreMenu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Viewport position calculation via MenuPositionCalculator
  useEffect(() => {
    if (!isMoreMenuOpen || !moreMenuRef.current) return;
    setOpenMenuUpward(MenuPositionCalculator.shouldOpenUpward(moreMenuRef.current));
  }, [isMoreMenuOpen]);

  // Auth gate guard helper
  const requireAuth = (action: string): boolean => {
    if (!user) {
      setGuestGateAction(action);
      setIsGuestGateOpen(true);
      return false;
    }
    return true;
  };

  const handleToggleLike = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!currentTrack || !requireAuth('like this song')) return;
    toggleLikeMutation.mutate(currentTrack.id);
  };

  const handleShareAction = async () => {
    if (!currentTrack) return;
    await TrackShareService.getInstance().shareTrack(currentTrack);
    setIsMoreMenuOpen(false);
  };

  const handleCopyLinkAction = async () => {
    if (!currentTrack) return;
    await TrackShareService.getInstance().copyTrackLink(currentTrack);
    setIsMoreMenuOpen(false);
  };

  const handleAddToLibraryAction = async () => {
    if (!currentTrack || !requireAuth('add to your library')) return;
    if (!isLiked) toggleLikeMutation.mutate(currentTrack.id);
  };

  const handleMoreAction = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMoreMenuOpen((open) => !open);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack || !requireAuth('add to a playlist')) return;
    setSelectedPlaylistId(playlistId);
    addToPlaylistMutation.mutate(
      { playlistId, trackId: currentTrack.id },
      {
        onSuccess: () => {
          setTimeout(() => setSelectedPlaylistId(null), 1200);
          setIsMoreMenuOpen(false);
        },
      }
    );
  };

  return {
    trackId,
    currentTrack,
    isPlaying: player.isPlaying,
    isResolving: player.isResolving,
    isPreview: player.isPreview,
    currentTime,
    duration,
    volume: player.volume,
    togglePlay: player.togglePlay,
    nextTrack: player.nextTrack,
    prevTrack: player.prevTrack,
    seek: player.seek,
    setVolume: player.setVolume,
    addToQueue: player.addToQueue,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    toggleShuffle: player.toggleShuffle,
    cycleRepeatMode: player.cycleRepeatMode,
    lines,
    isSynced,
    romanizations,
    isLyricsLoading,
    activeIndex,
    isLiked,
    playlists,
    isPlaylistsLoading,
    toggleLikeMutation,
    addToPlaylistMutation,
    isLyricsOpen,
    isMoreMenuOpen,
    selectedPlaylistId,
    openMenuUpward,
    setIsLyricsOpen,
    setIsMoreMenuOpen,
    lyricsScrollRef,
    mobileLyricsScrollRef,
    moreMenuRef,
    handleToggleLike,
    handleShareAction,
    handleCopyLinkAction,
    handleAddToLibraryAction,
    handleMoreAction,
    handleAddToPlaylist,
    isGuestGateOpen,
    guestGateAction,
    setIsGuestGateOpen,
    isRadio: player.isRadio,
    radioMeta: player.radioMeta,
    isStation,
  };
}

export type NowPlayingState = ReturnType<typeof useNowPlaying>;
