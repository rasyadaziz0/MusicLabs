'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useRomanization } from '@/hooks/useRomanization';
import {
  useAddTrackToPlaylist,
  useLibraryPlaylists,
  useLikedSongsIndex,
  useToggleLikedSong,
} from '@/hooks/useMusicLibrary';
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { getEffectiveTime } from '@/lib/lyrics/lyricsOffsetStore';

export function useNowPlaying(isOpen: boolean) {
  const {
    currentTrack,
    isPlaying,
    isResolving,
    isPreview,
    currentTime,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    addToQueue,
    isRadio,
    radioMeta,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const trackId = currentTrack?.id ?? null;
  const { lines, isSynced, isLoading: isLyricsLoading } = useLyrics(currentTrack, duration);
  const romanizations = useRomanization(lines, trackId);
  const { user, signInWithGoogle } = useAuth();
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

  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    const effectiveTime = getEffectiveTime(currentTime, trackId);
    if (effectiveTime < lines[0].time) return -1;
    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= effectiveTime) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }, [currentTime, isSynced, lines, trackId]);



  useEffect(() => {
    if (!isOpen) {
      setIsLyricsOpen(false);
      setIsMoreMenuOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMoreMenuOpen || !moreMenuRef.current) return;
    const rect = moreMenuRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenMenuUpward(spaceBelow < 420 && spaceAbove > spaceBelow);
  }, [isMoreMenuOpen]);

  const handleToggleLike = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!currentTrack) return;
    if (!user) { setGuestGateAction('like this song'); setIsGuestGateOpen(true); return; }
    toggleLikeMutation.mutate(currentTrack.id);
  };

  const handleShareAction = async () => {
    if (!currentTrack) return;
    const payload = {
      title: currentTrack.name,
      text: `${currentTrack.artists.primary.map((a) => a.name).join(', ')} - ${currentTrack.name}`,
      url: currentTrack.url,
    };
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share(payload);
        setIsMoreMenuOpen(false);
        return;
      }
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        const cb = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
        if (cb?.writeText) await cb.writeText(currentTrack.url);
      }
      setIsMoreMenuOpen(false);
    } catch (error) {
      console.error('Gagal membuka aksi share:', error);
    }
  };

  const handleCopyLinkAction = async () => {
    if (!currentTrack) return;
    try {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        const cb = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
        if (cb?.writeText) await cb.writeText(currentTrack.url);
      }
      setIsMoreMenuOpen(false);
    } catch (error) {
      console.error('Gagal menyalin link lagu:', error);
    }
  };

  const handleAddToLibraryAction = async () => {
    if (!currentTrack) return;
    if (!user) { setGuestGateAction('add to your library'); setIsGuestGateOpen(true); return; }
    if (!isLiked) toggleLikeMutation.mutate(currentTrack.id);
  };

  const handleMoreAction = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMoreMenuOpen((open) => !open);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    if (!user) { setGuestGateAction('add to a playlist'); setIsGuestGateOpen(true); return; }
    setSelectedPlaylistId(playlistId);
    addToPlaylistMutation.mutate(
      { playlistId, trackId: currentTrack.id },
      {
        onSuccess: () => {
          setTimeout(() => setSelectedPlaylistId(null), 1200);
          setIsMoreMenuOpen(false);
        },
      },
    );
  };

  return {
    trackId,
    currentTrack,
    isPlaying,
    isResolving,
    isPreview,
    currentTime,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    addToQueue,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
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
    isRadio,
    radioMeta,
  };
}

export type NowPlayingState = ReturnType<typeof useNowPlaying>;
