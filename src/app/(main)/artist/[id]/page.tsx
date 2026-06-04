'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl, getArtistAlbums, getArtistInfo, getArtistTopTracks } from '@/lib/api/musicApi';
import { Song, ArtistInfo } from '@/types/music';
import Image from 'next/image';
import { Play, MoreHorizontal, Plus, Star, ChevronRight, Pause } from 'lucide-react';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';
import AddToQueueButton from '@/components/library/AddToQueueButton';
import { Share, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { TopSongRow } from '@/components/artist/TopSongRow';
import { AlbumCard, AlbumData } from '@/components/artist/AlbumCard';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';



// ── Main Artist Page ───────────────────────────────────────────────

export default function ArtistPage() {
  const params = useParams();
  const rawId = params.id as string;
  const itunesId = rawId.replace(/itunes-artist-/, '');

  const { playTrack, shufflePlay, currentTrack, isPlaying } = usePlayer();

  const { data: artist, isLoading: isArtistLoading } = useQuery({
    queryKey: ['artist-info', rawId],
    queryFn: () => getArtistInfo(rawId),
    enabled: !!rawId,
  });

  const { data: topTracks = [], isLoading: isTracksLoading } = useQuery({
    queryKey: ['artist-top-tracks', rawId],
    queryFn: () => getArtistTopTracks(rawId),
    enabled: !!rawId,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ['artist-albums', rawId],
    queryFn: () => getArtistAlbums(rawId, 50),
    enabled: !!rawId,
  });

  const [showAllSongs, setShowAllSongs] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [moreMenuOpen]);

  // Sort all albums by release_date descending (newest first)
  const sortedAlbums = [...albums].sort((a: AlbumData, b: AlbumData) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateB - dateA;
  });

  // Separate albums from singles/EPs
  const fullAlbums = sortedAlbums.filter(
    (a: AlbumData) => a.album_type === 'album' || a.nb_tracks > 3
  );
  const singlesEps = sortedAlbums.filter(
    (a: AlbumData) => a.album_type !== 'album' && a.nb_tracks <= 3
  );

  // Latest release = newest album/single by release_date
  const latestRelease: AlbumData | null = sortedAlbums.length > 0 ? sortedAlbums[0] : null;

  // Top songs to display (Apple Music shows ~6 by default, expand to more)
  const visibleTopSongs = showAllSongs ? topTracks : topTracks.slice(0, 6);

  // Hero image — use first track's artwork as fallback since iTunes doesn't provide artist images
  const heroImage =
    artist?.picture_xl ||
    artist?.picture_big ||
    artist?.picture ||
    (topTracks[0] ? getBestImageUrl(topTracks[0].image) : null);

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  const handleShuffleAll = () => {
    if (topTracks.length > 0) {
      shufflePlay(topTracks);
    }
  };

  // ── Loading state ────────────────────────────────────────────────

  if (isArtistLoading) {
    return (
      <div className="pb-32">
        {/* Hero skeleton */}
        <div className="relative h-[320px] md:h-[420px] -mx-6 md:-mx-8 -mt-8 bg-white/5 animate-pulse" />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10">
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="flex gap-5">
              <div className="w-36 h-36 bg-white/5 rounded-lg" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-4 w-28 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-5 w-28 bg-white/5 rounded" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-6 h-4 bg-white/5 rounded" />
                <div className="w-11 h-11 bg-white/5 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted">Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* ────────────────── HERO SECTION ────────────────── */}
      <div className="relative h-[320px] md:h-[420px] overflow-hidden -mx-6 md:-mx-8 -mt-8">
        {/* Background image */}
        {heroImage ? (
          <Image
            src={heroImage}
            alt={artist.name}
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2e] to-[#1C1C1E]" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Content over hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 pb-6 md:pb-8">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4 md:gap-5">
              {/* Play button */}
              <button
                onClick={handlePlayAll}
                disabled={topTracks.length === 0}
                className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-full bg-[#FA243C] flex items-center justify-center text-white hover:scale-105 hover:bg-[#ff3650] active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-[#FA243C]/30 flex-shrink-0"
              >
                <Play fill="currentColor" size={22} className="ml-0.5" />
              </button>

              {/* Artist name */}
              <h1 className="text-4xl sm:text-5xl md:text-[72px] lg:text-[84px] font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] leading-[0.95]">
                {artist.name}
              </h1>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0 mb-1" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 flex flex-col backdrop-blur-xl">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Share size={15} /> Share Artist
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Link2 size={15} /> Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── CONTENT ────────────────── */}
      <div className="mt-8 md:mt-10">
        {/* Latest Release + Top Songs — 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12">
          {/* ── Latest Release ── */}
          <div>
            <h2 className="text-[17px] font-semibold text-white mb-4">
              Latest Release
            </h2>
            {latestRelease ? (
              <div className="flex gap-4">
                <Link
                  href={`/album/${latestRelease.id}`}
                  className="relative w-[140px] h-[140px] rounded-lg overflow-hidden flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-white/5 group"
                >
                  <Image
                    src={latestRelease.cover_xl || latestRelease.cover_big || latestRelease.cover || ''}
                    alt={latestRelease.title}
                    fill
                    sizes="140px"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </Link>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                    {latestRelease.release_date
                      ? new Date(latestRelease.release_date)
                          .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          .toUpperCase()
                      : 'LATEST'}
                  </p>
                  <Link
                    href={`/album/${latestRelease.id}`}
                    className="text-[16px] font-semibold text-white leading-tight mb-0.5 hover:underline truncate"
                  >
                    {latestRelease.title}
                  </Link>
                  <p className="text-[13px] text-white/40 mb-4">
                    {latestRelease.nb_tracks || 1}{' '}
                    {latestRelease.nb_tracks > 1 ? 'songs' : 'song'}
                  </p>

                  <button className="flex items-center justify-center gap-1.5 px-4 py-[6px] bg-white/[0.07] hover:bg-white/[0.12] rounded-full text-[13px] font-semibold text-[#FA243C] transition-colors w-max border border-white/[0.06]">
                    <Plus size={15} strokeWidth={2.5} /> Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center text-white/30 text-[13px]">
                No releases available
              </div>
            )}
          </div>

          {/* ── Top Songs ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-[17px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group"
                onClick={() => setShowAllSongs(!showAllSongs)}
              >
                Top Songs
                <ChevronRight
                  size={16}
                  className="text-white/40 ml-1 group-hover:text-[#FA243C] transition-colors"
                />
              </h2>
            </div>

            {isTracksLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-6 h-4 bg-white/5 rounded" />
                    <div className="w-11 h-11 bg-white/5 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-white/5 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topTracks.length === 0 ? (
              <p className="text-white/30 py-4 text-[13px]">No top songs available.</p>
            ) : (
              <>
                {/* 2-column grid for wider screens, 1-column on mobile */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4">
                  {visibleTopSongs.map((song, idx) => (
                    <TopSongRow
                      key={song.id}
                      song={song}
                      index={idx + 1}
                      onPlay={() => playTrack(song, topTracks)}
                      isCurrentlyPlaying={currentTrack?.id === song.id && isPlaying}
                    />
                  ))}
                </div>

                {topTracks.length > 6 && (
                  <button
                    onClick={() => setShowAllSongs(!showAllSongs)}
                    className="mt-3 text-[13px] font-medium text-[#FA243C] hover:text-[#ff5070] transition-colors px-3"
                  >
                    {showAllSongs ? 'Show Less' : `See All ${topTracks.length} Songs`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Albums (horizontal scroll) ── */}
        {fullAlbums.length > 0 && (
          <HorizontalScrollSection title="Albums">
            {fullAlbums.map((album: AlbumData) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </HorizontalScrollSection>
        )}

        {/* ── Singles & EPs (horizontal scroll) ── */}
        {singlesEps.length > 0 && (
          <HorizontalScrollSection title="Singles & EPs">
            {singlesEps.map((album: AlbumData) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </HorizontalScrollSection>
        )}

        {/* If no albums/singles but we have all albums in one bucket */}
        {fullAlbums.length === 0 && singlesEps.length === 0 && sortedAlbums.length > 0 && (
          <HorizontalScrollSection title="Albums">
            {sortedAlbums.map((album: AlbumData) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </HorizontalScrollSection>
        )}
      </div>
    </div>
  );
}
