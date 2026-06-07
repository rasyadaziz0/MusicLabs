'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl, getArtistAlbums, getArtistInfo, getArtistTopTracks } from '@/lib/api/musicApi';
import { AlbumData } from '@/components/ui/AlbumCard';
import { AlbumCard } from '@/components/ui/AlbumCard';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';

// Extracted Components
import { ArtistHero } from '@/components/artist/ArtistHero';
import { ArtistLatestRelease } from '@/components/artist/ArtistLatestRelease';
import { ArtistTopSongs } from '@/components/artist/ArtistTopSongs';

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
      <ArtistHero
        name={artist.name}
        heroImage={heroImage}
        hasTracks={topTracks.length > 0}
        handlePlayAll={handlePlayAll}
      />

      {/* ────────────────── CONTENT ────────────────── */}
      <div className="mt-8 md:mt-10">
        {/* Latest Release + Top Songs — 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12">
          
          <ArtistLatestRelease latestRelease={latestRelease} />

          <ArtistTopSongs
            topTracks={topTracks}
            isTracksLoading={isTracksLoading}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            playTrack={playTrack}
          />

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
