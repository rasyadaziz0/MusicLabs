import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getITunesArtist, getITunesArtistTopTracks, getITunesArtistAlbums } from '@/lib/server/itunesApi';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { AlbumData } from '@/components/ui/AlbumCard';
import ArtistPageClient from '@/components/artist/ArtistPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Cached data fetcher (dedup across generateMetadata + page render) ──

const getArtistData = cache(async (rawId: string) => {
  // Strip prefix — same logic as api/artists/[id]/route.ts
  const itunesId = rawId.replace(/^itunes-artist-/, '');

  const [artist, topTracks, albums] = await Promise.all([
    getITunesArtist(itunesId),
    getITunesArtistTopTracks(itunesId, 20),
    getITunesArtistAlbums(itunesId, 50),
  ]);

  return { artist, topTracks, albums };
});

// ── Metadata (SSR) ─────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const { artist } = await getArtistData(rawId);

  if (!artist) {
    return { title: 'Artist Not Found — AcadMusic' };
  }

  const description = `Listen to ${artist.name} on AcadMusic. Stream top songs, albums, and singles for free.`;
  const canonicalUrl = `https://music.rasyadazizan.site/artist/${rawId}`;

  return {
    title: `${artist.name} — AcadMusic`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${artist.name} — AcadMusic`,
      description,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'AcadMusic',
    },
    twitter: {
      card: 'summary',
      title: `${artist.name} — AcadMusic`,
      description,
    },
  };
}

// ── Page Component (Server) ────────────────────────────────────────

export default async function ArtistPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const { artist, topTracks, albums } = await getArtistData(rawId);

  if (!artist) notFound();

  // ── Derive all computed data server-side ──────────────────────────

  // Hero image — use first track's artwork as fallback (iTunes doesn't provide artist images)
  const heroImage =
    artist.picture_xl ||
    artist.picture_big ||
    artist.picture ||
    (topTracks[0] ? getBestImageUrl(topTracks[0].image) ?? null : null);

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

  // ── JSON-LD Schema ──────────────────────────────────────────────

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    'name': artist.name,
    'url': `https://music.rasyadazizan.site/artist/${rawId}`,
    ...(artist.genres && artist.genres.length > 0 && {
      'genre': artist.genres,
    }),
  };

  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <>
      {/* JSON-LD for search engines and AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />

      <ArtistPageClient
        artistName={artist.name}
        heroImage={heroImage}
        topTracks={topTracks}
        latestRelease={latestRelease}
        fullAlbums={fullAlbums}
        singlesEps={singlesEps}
        allAlbums={sortedAlbums}
      />
    </>
  );
}
