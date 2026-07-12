'use client';

import { usePlayer } from '@/context/PlayerContext';
import { Song } from '@/types/music';
import { AlbumData } from '@/components/ui/AlbumCard';
import { AlbumCard } from '@/components/ui/AlbumCard';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';
import { ArtistHero } from '@/components/artist/ArtistHero';
import { ArtistLatestRelease } from '@/components/artist/ArtistLatestRelease';
import { ArtistTopSongs } from '@/components/artist/ArtistTopSongs';

interface ArtistPageClientProps {
  artistName: string;
  heroImage: string | null;
  topTracks: Song[];
  latestRelease: AlbumData | null;
  fullAlbums: AlbumData[];
  singlesEps: AlbumData[];
  allAlbums: AlbumData[];
}

export default function ArtistPageClient({
  artistName,
  heroImage,
  topTracks,
  latestRelease,
  fullAlbums,
  singlesEps,
  allAlbums,
}: ArtistPageClientProps) {
  const { playTrack, shufflePlay, currentTrack, isPlaying } = usePlayer();

  const handlePlayAll = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  return (
    <div className="pb-32">
      {/* ────────────────── HERO SECTION ────────────────── */}
      <ArtistHero
        name={artistName}
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
            isTracksLoading={false}
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
        {fullAlbums.length === 0 && singlesEps.length === 0 && allAlbums.length > 0 && (
          <HorizontalScrollSection title="Albums">
            {allAlbums.map((album: AlbumData) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </HorizontalScrollSection>
        )}
      </div>
    </div>
  );
}
