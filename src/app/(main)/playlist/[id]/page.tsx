'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { getPlaylistById } from '@/lib/supabase/music';
import { usePlaylistTracks, useRemoveTrackFromPlaylist, useTogglePinPlaylist, useDeletePlaylist, useReorderPlaylistTracks } from '@/hooks/useMusicLibrary';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { UserProfile } from '@/types/profile';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pin, MoreHorizontal, Share, Edit2, UserPlus, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import { formatDistanceToNow } from 'date-fns';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import CollaboratorModal from '@/components/playlist/CollaboratorModal';
import { usePlaylistCollaborators } from '@/hooks/useCollaborators';
import { uploadImage } from '@/lib/utils/uploadImage';
import { PlaylistRepository } from '@/lib/supabase/repositories/PlaylistRepository';

export default function PlaylistPage() {
  const { id } = useParams();
  const router = useRouter();
  const { playTrack, shufflePlay } = usePlayer();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const removeTrackMutation = useRemoveTrackFromPlaylist();
  const togglePinMutation = useTogglePinPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const reorderMutation = useReorderPlaylistTracks();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: collaborators = [] } = usePlaylistCollaborators(playlistId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!playlistId) return;

    const channel = supabase
      .channel(`playlist_tracks_changes_${playlistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlist_tracks', filter: `playlist_id=eq.${playlistId}` },
        () => {
          // Refetch tracks when a change occurs
          queryClient.invalidateQueries({ queryKey: ['playlistTracks', playlistId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playlistId, queryClient]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

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

  const { data: ownerProfile } = useQuery({
    queryKey: ['user-profile', playlist?.user_id],
    queryFn: async () => {
      return ProfileRepository.getInstance().getProfile(playlist!.user_id);
    },
    enabled: Boolean(playlist?.user_id),
  });

  const canEdit = playlistId ? (playlist?.user_id === user?.id || collaborators.some(c => c.user_id === user?.id)) : false;

  if (isPlaylistLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 mb-8">
          <div className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] lg:w-[300px] lg:h-[300px] rounded-xl animate-shimmer flex-shrink-0" />
          <div className="flex flex-col gap-3 w-full max-w-xl mt-4 md:mt-0 text-center md:text-left items-center md:items-start">
            <div className="h-8 md:h-12 w-3/4 rounded-lg animate-shimmer" />
            <div className="h-5 md:h-6 w-1/2 rounded-md animate-shimmer" />
            <div className="h-4 md:h-5 w-1/3 rounded-md animate-shimmer mt-2" />
            <div className="flex items-center justify-center md:justify-start gap-4 mt-6 w-full">
              <div className="h-12 w-32 rounded-full animate-shimmer" />
              <div className="h-12 w-12 rounded-full animate-shimmer" />
            </div>
          </div>
        </div>
        <div className="space-y-4 w-full mt-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-14 rounded-lg animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const coverUrl = playlist?.cover_url || getBestImageUrl(playlistTracks[0]?.image ?? []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      {/* Hero Section */}
      <AppleMusicHeader
        title={playlist?.name || 'Unknown Playlist'}
        subtitle={playlist?.user_id ? `${playlist.user_id === user?.id ? (user?.user_metadata?.name || 'You') : (ownerProfile?.display_name || ownerProfile?.username || 'Unknown User')}${collaborators.length > 0 ? ` & ${collaborators.length} collaborators` : ''}` : 'Unknown'}
        description={playlist ? `Updated ${formatDistanceToNow(new Date(playlist.updated_at || playlist.created_at || new Date()), { addSuffix: true })}` : ''}
        cover={
          <div className="relative w-full h-full group">
            {coverUrl ? (
              <Image src={coverUrl} alt={playlist?.name || 'Playlist cover'} fill priority className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
                <Plus size={64} className="text-white/20" />
              </div>
            )}
          </div>
        }
        onPlay={() => playlistTracks.length > 0 && playTrack(playlistTracks[0], playlistTracks)}
        onShuffle={() => playlistTracks.length > 0 && shufflePlay(playlistTracks)}
        backHref="/library"
        topRightActions={
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 flex flex-col overflow-hidden">
                <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3">
                  <Share size={16} /> Share Playlist
                </button>

                {playlist?.user_id === user?.id && (
                  <>
                    <button onClick={() => {
                      setIsCollaboratorModalOpen(true);
                      setIsMenuOpen(false);
                    }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3">
                      <UserPlus size={16} /> Manage Collaborators
                    </button>

                    <button onClick={() => {
                      router.push(`/playlist/${playlist.id}/edit`);
                      setIsMenuOpen(false);
                    }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3">
                      <Edit2 size={16} /> Edit Playlist
                    </button>

                    <button onClick={() => {
                      togglePinMutation.mutate({ playlistId: playlist.id, currentPinStatus: !!playlist.is_pinned });
                      setIsMenuOpen(false);
                    }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3">
                      <Pin size={16} className={playlist.is_pinned ? "text-primary" : ""} fill={playlist.is_pinned ? "currentColor" : "none"} />
                      {playlist.is_pinned ? "Unpin Playlist" : "Pin Playlist"}
                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button onClick={() => {
                      if (confirm('Are you sure you want to delete this playlist?')) {
                        deletePlaylistMutation.mutate(playlist.id, {
                          onSuccess: () => router.push('/library/playlists')
                        });
                      }
                      setIsMenuOpen(false);
                    }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-3">
                      <Trash2 size={16} /> Delete Playlist
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Tracklist */}
      {isTracksLoading ? (
        <div className="space-y-4 w-full">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : playlistTracks.length > 0 ? (
        <AppleMusicTrackList
          tracks={playlistTracks}
          onPlayTrack={playTrack}
          showHeart={false}
          showAlbum={true}
          isReorderable={canEdit}
          onReorder={(oldIndex, newIndex) => {
            if (oldIndex === newIndex) return;
            const newTracks = [...playlistTracks];
            const [moved] = newTracks.splice(oldIndex, 1);
            newTracks.splice(newIndex, 0, moved);
            reorderMutation.mutate({
              playlistId: playlistId!,
              trackIdsInOrder: newTracks.map(t => t.id)
            });
          }}
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

              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrackMutation.mutate({ playlistId: playlistId!, trackId: song.id });
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
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center mt-8">
          <h2 className="text-xl font-bold mb-2">Playlist is empty</h2>
          <p className="text-sm text-white/50">
            Find and add songs from the search page or your library.
          </p>
        </div>
      )}

      <CollaboratorModal
        playlistId={playlistId!}
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
      />
    </div>
  );
}
