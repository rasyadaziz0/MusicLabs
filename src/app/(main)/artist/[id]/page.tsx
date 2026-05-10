'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl, getArtistAlbums } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import Image from 'next/image';
import { Play, MoreHorizontal, Plus } from 'lucide-react';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';
import AddToQueueButton from '@/components/library/AddToQueueButton';

interface ArtistInfo {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  nb_album: number;
  nb_fan: number;
}

async function fetchArtistInfo(numericId: string): Promise<ArtistInfo | null> {
  const res = await fetch(`/api/artists/${numericId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function fetchArtistTopTracks(numericId: string): Promise<Song[]> {
  const res = await fetch(`/api/artists/${numericId}/top?limit=100`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.songs ?? [];
}

export default function ArtistPage() {
  const params = useParams();
  const rawId = params.id as string;
  // Strip "dz-artist-" prefix if present
  const numericId = rawId.replace(/dz-artist-/, '');

  const { playTrack } = usePlayer();

  const { data: artist, isLoading: isArtistLoading } = useQuery({
    queryKey: ['artist-info', numericId],
    queryFn: () => fetchArtistInfo(numericId),
    enabled: !!numericId,
  });

  const { data: topTracks = [], isLoading: isTracksLoading } = useQuery({
    queryKey: ['artist-top-tracks', numericId],
    queryFn: () => fetchArtistTopTracks(numericId),
    enabled: !!numericId,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ['artist-albums', numericId],
    queryFn: () => getArtistAlbums(numericId, 50),
    enabled: !!numericId,
  });

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  if (isArtistLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[340px] bg-white/5 rounded-2xl" />
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted">Artist not found.</p>
      </div>
    );
  }

  const heroImage = artist.picture_xl || artist.picture_big || artist.picture;

  return (
    <div className="pb-12">
      {/* ───── Hero Section ───── */}
      <div className="relative h-[320px] md:h-[420px] overflow-hidden -mx-6 md:-mx-8 -mt-8">
        {/* Background image */}
        {heroImage && (
          <Image
            src={heroImage}
            alt={artist.name}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        )}

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/40 to-transparent" />
        <div className="absolute inset-0 bg-black/10" />

        {/* Content over hero */}
        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-8 right-8 flex items-center gap-5">
          <button
            onClick={handlePlayAll}
            disabled={topTracks.length === 0}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#FA243C] flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-black/20 flex-shrink-0"
          >
            <Play fill="currentColor" size={24} className="ml-1" />
          </button>
          
          <h1 className="text-5xl md:text-[80px] font-bold text-white tracking-tight drop-shadow-md leading-none">
            {artist.name}
          </h1>
        </div>
      </div>

      <div className="mt-8 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* ───── Latest Release ───── */}
          <div>
            <h2 className="text-[17px] font-semibold text-white mb-4">Latest Release</h2>
            {albums.length > 0 ? (
              <div className="flex gap-5">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden flex-shrink-0 shadow-lg shadow-black/40 bg-white/5">
                  <Image
                    src={albums[0].cover_xl || albums[0].cover_big || albums[0].cover}
                    alt={albums[0].title}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
                    {albums[0].release_date 
                      ? new Date(albums[0].release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() 
                      : 'LATEST'}
                  </p>
                  <p className="text-[17px] font-semibold text-white leading-tight mb-1">{albums[0].title}</p>
                  <p className="text-[13px] text-white/50 mb-4">{albums[0].nb_tracks || 1} {albums[0].nb_tracks > 1 ? 'songs' : 'song'}</p>
                  
                  <button className="flex items-center justify-center gap-1.5 px-4 py-1 bg-white/[0.08] hover:bg-white/[0.12] rounded-full text-[13px] font-medium text-[#FA243C] transition-colors w-max border border-white/[0.04]">
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center text-white/30 text-[13px]">No releases available</div>
            )}
          </div>

          {/* ───── Top Songs ───── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group">
                Top Songs <span className="text-white/40 ml-1.5 group-hover:text-[#FA243C] text-[15px]">&gt;</span>
              </h2>
            </div>
            
            <div className="flex flex-col">
              {isTracksLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-11 h-11 bg-white/5 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/5 rounded w-1/2" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : topTracks.length === 0 ? (
                <p className="text-white/30 py-4 text-[13px]">No top songs available.</p>
              ) : (
                topTracks.slice(0, 5).map((song: Song, index: number) => (
                  <div
                    key={song.id}
                    onClick={() => playTrack(song, topTracks)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors border-b border-transparent hover:border-white/5"
                  >
                    <div className="relative w-[46px] h-[46px] rounded-[4px] flex-shrink-0 overflow-hidden shadow-sm">
                      {getBestImageUrl(song.image) ? (
                        <Image
                          src={getBestImageUrl(song.image)!}
                          alt={song.name}
                          fill
                          sizes="46px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[14px] font-medium text-white truncate">{song.name}</p>
                      <p className="text-[12px] text-white/50 truncate mt-[1px]">
                        {song.artists.primary.map(a => a.name).join(', ')} &mdash; {song.album.name}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <TrackLikeButton track={song} />
                      <AddToQueueButton track={song} />
                      <AddToPlaylistButton track={song} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* ───── Albums Grid ───── */}
        <div className="mt-14 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group">
              Albums <span className="text-white/40 ml-1.5 group-hover:text-[#FA243C] text-[15px]">&gt;</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
            {albums.length > 0 ? (
              albums.map((album: any) => (
                <div key={album.id} className="flex flex-col group cursor-pointer">
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-white/5">
                    <Image
                      src={album.cover_xl || album.cover_big || album.cover_medium || album.cover}
                      alt={album.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-[13px] font-medium text-white truncate leading-tight group-hover:underline">{album.title}</p>
                  <p className="text-[13px] text-white/50 truncate mt-[2px]">
                    {album.release_date ? new Date(album.release_date).getFullYear() : 'Album'}
                  </p>
                </div>
              ))
            ) : (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col animate-pulse">
                  <div className="aspect-square w-full bg-white/5 rounded-lg mb-3" />
                  <div className="h-3 w-3/4 bg-white/5 rounded mb-1" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* ───── Music Videos Placeholder ───── */}
        <div className="mt-14 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group">
              Music Videos <span className="text-white/40 ml-1.5 group-hover:text-[#FA243C] text-[15px]">&gt;</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col group cursor-pointer">
                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-white/5 flex items-center justify-center">
                   <Play size={32} className="text-white/10 group-hover:text-white/30 transition-colors" />
                </div>
                <div className="h-3 w-3/4 bg-white/5 rounded mt-1"></div>
                <div className="h-3 w-1/2 bg-white/5 rounded mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
