'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useLyrics } from '@/hooks/useLyrics';
import {
  useAddTrackToPlaylist,
  useLibraryPlaylists,
  useLikedSongsIndex,
  useToggleLikedSong,
} from '@/hooks/useMusicLibrary';
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

const LYRICS_SYNC_OFFSET_SEC = 0.3;

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
  } = usePlayer();

  const { lines, isSynced, isLoading: isLyricsLoading } = useLyrics(currentTrack);
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

  const activeIndex = useMemo(() => {
    if (!isSynced || lines.length === 0) return -1;
    const lyricTime = Math.max(0, currentTime - LYRICS_SYNC_OFFSET_SEC);
    if (lyricTime < lines[0].time) return -1;
    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= lyricTime) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }, [currentTime, isSynced, lines]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !lyricsScrollRef.current) return;
    const el = lyricsScrollRef.current.querySelector(
      `[data-lyric-index="${activeIndex}"]`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !mobileLyricsScrollRef.current) return;
    const el = mobileLyricsScrollRef.current.querySelector(
      `[data-lyric-index="${activeIndex}"]`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, isOpen, isLyricsOpen]);

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
    if (!user) { await signInWithGoogle(); return; }
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
    if (!user) { await signInWithGoogle(); return; }
    if (!isLiked) toggleLikeMutation.mutate(currentTrack.id);
  };

  const handleMoreAction = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMoreMenuOpen((open) => !open);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    if (!user) { await signInWithGoogle(); return; }
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
    lines,
    isSynced,
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
  };
}

export type NowPlayingState = ReturnType<typeof useNowPlaying>;
