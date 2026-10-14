'use client';

import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useDeletePlaylist } from '@/hooks/library/useDeletePlaylist';
import { usePlaylistTracks } from '@/hooks/library/usePlaylistTracks';
import { useRemoveTrackFromPlaylist } from '@/hooks/library/useRemoveTrackFromPlaylist';
import { useReorderPlaylistTracks } from '@/hooks/library/useReorderPlaylistTracks';
import { useTogglePinPlaylist } from '@/hooks/library/useTogglePinPlaylist';
import { usePlaylistCollaborators } from '@/hooks/useCollaborators';
import { PlaylistPresenter } from '@/lib/playlist/PlaylistPresenter';
import { supabase } from '@/lib/supabase/client';
import { getPlaylistById } from '@/lib/supabase/music';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { Song } from '@/types/music';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gooeyToast as toast } from 'goey-toast';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export function usePlaylistController() {
  const { id } = useParams();
  const router = useRouter();
  const { playTrack, shufflePlay } = usePlayer();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const playlistId = Array.isArray(id) ? id[0] : id;

  // Mutations
  const removeTrackMutation = useRemoveTrackFromPlaylist();
  const togglePinMutation = useTogglePinPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const reorderMutation = useReorderPlaylistTracks();

  // Local UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!playlistId) return;

    const channel = supabase
      .channel(`playlist_tracks_changes_${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_tracks',
          filter: `playlist_id=eq.${playlistId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['playlistTracks', playlistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playlistId, queryClient]);

  // Queries
  const { data: playlist, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      return getPlaylistById(playlistId!);
    },
    enabled: Boolean(playlistId),
  });

  const { data: playlistTracks = [], isLoading: isTracksLoading } = usePlaylistTracks(
    playlistId ?? null
  );

  const { data: collaborators = [] } = usePlaylistCollaborators(playlistId);

  const { data: ownerProfile } = useQuery({
    queryKey: ['user-profile', playlist?.user_id],
    queryFn: async () => {
      return ProfileRepository.getInstance().getProfile(playlist!.user_id);
    },
    enabled: Boolean(playlist?.user_id),
  });

  // OOP Presenter instance
  const presenter = useMemo(
    () =>
      new PlaylistPresenter(
        playlist,
        playlistTracks,
        ownerProfile,
        collaborators,
        user
      ),
    [playlist, playlistTracks, ownerProfile, collaborators, user]
  );

  // Action Handlers
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

  const handleCopyEmbedCode = () => {
    if (!playlist) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const iframeSnippet = presenter.getEmbedSnippet(origin);
    navigator.clipboard.writeText(iframeSnippet);
    toast.success('Embed code copied', {
      description: presenter.isPublic
        ? 'Paste into any website to embed this playlist.'
        : 'Note: Only public playlists can be embedded.',
    });
    setIsMenuOpen(false);
  };

  const handleTogglePin = () => {
    if (!playlist) return;
    togglePinMutation.mutate({
      playlistId: playlist.id,
      currentPinStatus: presenter.isPinned,
    });
    setIsMenuOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (playlist) {
      deletePlaylistMutation.mutate(playlist.id);
      setIsDeleteDialogOpen(false);
      router.push('/library');
    }
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex || !playlistId) return;
    const newTracks = [...playlistTracks];
    const [moved] = newTracks.splice(oldIndex, 1);
    newTracks.splice(newIndex, 0, moved);
    reorderMutation.mutate({
      playlistId,
      trackIdsInOrder: newTracks.map((t) => t.id),
    });
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!playlistId) return;
    removeTrackMutation.mutate({ playlistId, trackId });
  };

  const handlePlay = () => {
    if (presenter.hasTracks && presenter.firstTrack) {
      playTrack(presenter.firstTrack, presenter.tracks);
    }
  };

  const handleShuffle = () => {
    if (presenter.hasTracks) {
      shufflePlay(presenter.tracks);
    }
  };

  const handlePlayTrack = (song: Song, tracks?: Song[]) => {
    playTrack(song, tracks || presenter.tracks);
  };

  const navigateToEdit = () => {
    if (playlist) {
      router.push(`/playlist/${playlist.id}/edit`);
      setIsMenuOpen(false);
    }
  };

  return {
    playlistId,
    presenter,
    isLoading: isPlaylistLoading,
    isTracksLoading,
    isMenuOpen,
    isCollaboratorModalOpen,
    isDeleteDialogOpen,
    menuRef,
    actions: {
      setIsMenuOpen,
      setIsCollaboratorModalOpen,
      setIsDeleteDialogOpen,
      handleShare,
      handleCopyLink,
      handleCopyEmbedCode,
      handleTogglePin,
      handleDeleteConfirm,
      handleReorder,
      handleRemoveTrack,
      handlePlay,
      handleShuffle,
      handlePlayTrack,
      navigateToEdit,
    },
  };
}
