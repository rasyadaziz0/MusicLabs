'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import Image from 'next/image';
import { Play, Clock, Shuffle } from 'lucide-react';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';

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

function formatFans(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toLocaleString();
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

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  const handleShuffle = () => {
    if (topTracks.length > 0) {
      const shuffled = [...topTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
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
    <div className="-mt-8 -mx-8">
      {/* ───── Hero Section ───── */}
      <div className="relative h-[380px] overflow-hidden">
        {/* Background image with blur */}
        {heroImage && (
          <Image
            src={heroImage}
            alt={artist.name}
            fill
            sizes="100vw"
            className="object-cover scale-110 blur-sm"
            priority
          />
        )}

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Content over hero */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 flex items-end gap-7">
          {/* Circular artist photo */}
          <div className="relative w-[180px] h-[180px] rounded-full overflow-hidden border-[3px] border-white/20 shadow-2xl shadow-black/60 flex-shrink-0">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={artist.name}
                fill
                sizes="180px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
            )}
          </div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
              Artist
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-3 drop-shadow-lg">
              {artist.name}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-white/50">
              <span>{formatFans(artist.nb_fan)} fans</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{artist.nb_album} albums</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Action Buttons ───── */}
      <div className="px-8 py-6 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={topTracks.length === 0}
          className="flex items-center gap-2.5 px-7 py-3 bg-primary rounded-full text-white font-bold text-[14px] hover:bg-primary/85 transition-colors shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={18} fill="currentColor" />
          Play
        </button>
        <button
          onClick={handleShuffle}
          disabled={topTracks.length === 0}
          className="flex items-center gap-2.5 px-7 py-3 bg-white/[0.07] rounded-full text-white/80 font-bold text-[14px] hover:bg-white/[0.12] transition-colors border border-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shuffle size={16} />
          Shuffle
        </button>
      </div>

      {/* ───── Top Tracks ───── */}
      <div className="px-8 pb-12">
        <h2 className="text-xl font-bold text-white mb-4">Top Songs</h2>

        {isTracksLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[56px] bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : topTracks.length === 0 ? (
          <p className="text-muted py-10 text-center">No tracks available for this artist.</p>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-3 py-2 text-[11px] font-bold text-white/30 uppercase tracking-widest border-b border-white/[0.06] mb-2">
              <span className="w-8 text-center">#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="hidden sm:flex w-16 justify-center">Save</span>
              <span className="hidden lg:flex w-16 justify-center">List</span>
              <span className="w-12 flex justify-end"><Clock size={14} /></span>
            </div>

            {/* Track rows */}
            {topTracks.map((song: Song, index: number) => (
              <div
                key={song.id}
                onClick={() => playTrack(song, topTracks)}
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group cursor-pointer items-center"
              >
                {/* Track number */}
                <span className="w-8 text-center text-[13px] text-white/30 group-hover:text-white/70 font-medium tabular-nums">
                  {index + 1}
                </span>

                {/* Cover + Title + Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                    {getBestImageUrl(song.image) ? (
                      <Image
                        src={getBestImageUrl(song.image)!}
                        alt={song.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                      {song.name}
                    </p>
                    <p className="text-[12px] text-white/35 truncate">
                      {song.artists.primary.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block text-[13px] text-white/30 truncate group-hover:text-white/50 transition-colors">
                  {song.album.name}
                </div>

                {/* Like */}
                <div className="hidden sm:flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <TrackLikeButton track={song} />
                </div>

                {/* Add to playlist */}
                <div className="hidden lg:flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <AddToPlaylistButton track={song} />
                </div>

                {/* Duration */}
                <div className="w-12 text-right text-[12px] text-white/30 font-medium tabular-nums">
                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
