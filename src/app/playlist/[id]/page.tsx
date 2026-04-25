'use client';

import MainLayout from '@/components/layout/MainLayout';
import { usePlayer } from '@/context/PlayerContext';
import { supabase } from '@/lib/supabase/client';
import { getSong } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock, MoreHorizontal, Heart, Plus } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlaylistPage() {
  const { id } = useParams();
  const { playTrack } = usePlayer();
  const [playlistTracks, setPlaylistTracks] = useState<Song[]>([]);

  const { data: playlist, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const fetchTracks = async () => {
      if (!id) return;
      try {
        const { data: trackData, error } = await supabase
          .from('playlist_tracks')
          .select('track_id')
          .eq('playlist_id', id)
          .order('position', { ascending: true });

        if (error) {
          console.error('Error fetching tracks:', error.message, error);
          return;
        }

        if (trackData) {
          const songs = await Promise.all(
            trackData.map(async (t) => {
              try {
                const res = await getSong(t.track_id);
                return res[0];
              } catch (e) {
                return null;
              }
            })
          );
          setPlaylistTracks(songs.filter((s): s is Song => s !== null));
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      }
    };

    fetchTracks();
  }, [id]);

  if (isPlaylistLoading) return <MainLayout><div>Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row items-end gap-8 mb-10">
        <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl bg-white/5 border border-white/10 flex-shrink-0">
          {playlist?.cover_url ? (
            <Image src={playlist.cover_url} alt={playlist.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-void">
              <Plus size={64} className="text-white/20" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-muted mb-2">Playlist</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tighter">{playlist?.name}</h1>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-white">{playlist?.user_id ? 'You' : 'System'}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">{playlistTracks.length} songs</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => playlistTracks.length > 0 && playTrack(playlistTracks[0], playlistTracks)}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
        >
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
        <button className="text-muted hover:text-white transition-colors">
          <Heart size={32} />
        </button>
        <button className="text-muted hover:text-white transition-colors">
          <MoreHorizontal size={32} />
        </button>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-sm font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-4">
          <span className="w-8 text-center">#</span>
          <span>Title</span>
          <span className="hidden md:block">Album</span>
          <span className="w-12 flex justify-end"><Clock size={16} /></span>
        </div>

        {playlistTracks.map((song, index) => (
          <div 
            key={song.id}
            onClick={() => playTrack(song, playlistTracks)}
            className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer items-center"
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
            <div className="w-12 text-right text-xs text-muted font-medium">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
