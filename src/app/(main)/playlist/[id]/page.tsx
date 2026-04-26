'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { getPlaylistById } from '@/lib/supabase/music';
import { usePlaylistTracks, useRemoveTrackFromPlaylist } from '@/hooks/useMusicLibrary';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';

export default function PlaylistPage() {
  const { id } = useParams();
  const { playTrack } = usePlayer();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const removeTrackMutation = useRemoveTrackFromPlaylist();

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
    <>
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-8 md:mb-10 text-center md:text-left mt-4 md:mt-0">
        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl bg-white/5 border border-white/10 flex-shrink-0 mx-auto md:mx-0">
          {coverUrl ? (
            <Image src={coverUrl} alt={playlist?.name || 'Playlist cover'} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
              <Plus size={64} className="text-white/20" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-muted mb-2">Playlist</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tighter">{playlist?.name}</h1>
          {playlist?.description && (
            <p className="mb-4 max-w-2xl text-sm text-muted">{playlist.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-white">{playlist?.user_id ? 'You' : 'Unknown'}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">{playlistTracks.length} songs</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center md:justify-start gap-6 mb-10">
        <button 
          onClick={() => playlistTracks.length > 0 && playTrack(playlistTracks[0], playlistTracks)}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
      </div>

      {isTracksLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : playlistTracks.length > 0 ? (
        <div className="space-y-1">
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-2 md:px-4 py-2 text-sm font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-4">
          <span className="w-8 text-center">#</span>
          <span>Title</span>
          <span className="hidden md:block">Album</span>
          <span className="hidden sm:flex w-20 justify-center">Save</span>
          <span className="hidden lg:flex w-20 justify-center">Manage</span>
          <span className="w-12 flex justify-end"><Clock size={16} /></span>
        </div>

        {playlistTracks.map((song, index) => (
          <div 
            key={song.id}
            onClick={() => playTrack(song, playlistTracks)}
            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-2 md:px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer items-center"
          >
            <span className="w-8 text-center text-muted group-hover:text-white font-medium">
              {index + 1}
            </span>
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image 
                  src={song.image.find(i => i.quality === '150x150')?.url || song.image[0].url} 
                  alt={song.name} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold truncate">{song.name}</p>
                <p className="text-xs text-muted truncate">{song.artists.primary.map(a => a.name).join(', ')}</p>
              </div>
            </div>
            <div className="hidden md:block text-sm text-muted truncate">
              {song.album.name}
            </div>
            <div className="hidden items-center justify-center gap-2 sm:flex">
              <TrackLikeButton track={song} />
              <AddToPlaylistButton track={song} />
            </div>
            <div className="hidden justify-center lg:flex">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeTrackMutation.mutate({ playlistId: playlistId!, trackId: song.id });
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:text-red-300"
                title="Remove from playlist"
                aria-label="Remove from playlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="w-12 text-right text-xs text-muted font-medium">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold">Playlist masih kosong</h2>
          <p className="mt-2 text-sm text-muted">
            Tambahin lagu dari halaman search, liked songs, atau player bar.
          </p>
        </div>
      )}
    </>
  );
}
