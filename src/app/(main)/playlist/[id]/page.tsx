'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { getPlaylistById } from '@/lib/supabase/music';
import { usePlaylistTracks, useRemoveTrackFromPlaylist, useTogglePinPlaylist, useDeletePlaylist } from '@/hooks/useMusicLibrary';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Pin, MoreHorizontal, Share, Edit2 } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import { AppleMusicHeader } from '@/components/ui/AppleMusicHeader';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';

export default function PlaylistPage() {
  const { id } = useParams();
  const router = useRouter();
  const { playTrack, shufflePlay } = usePlayer();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const removeTrackMutation = useRemoveTrackFromPlaylist();
  const togglePinMutation = useTogglePinPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
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

  if (isPlaylistLoading) return <><div>Loading...</div></>;

  const coverUrl = playlist?.cover_url || getBestImageUrl(playlistTracks[0]?.image ?? []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      {/* Hero Section */}
      <AppleMusicHeader
        title={playlist?.name || 'Loading...'}
        subtitle={playlist?.user_id ? 'Rasyad azizan' : 'Unknown'}
        description="Updated 2 Weeks Ago"
        cover={
          coverUrl ? (
            <Image src={coverUrl} alt={playlist?.name || 'Playlist cover'} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
              <Plus size={64} className="text-white/20" />
            </div>
          )
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
                
                {playlist?.user_id && (
                  <>
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
          showStar={false}
          showAlbum={true}
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
    </div>
  );
}
