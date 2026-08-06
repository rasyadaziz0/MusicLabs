import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ImageHelper } from '@/lib/utils/ImageHelper';
import { ArtistParser } from '@/lib/utils/ArtistParser';
import { AlbumData } from '@/types/components/ui';
import ArtistPageClient from '@/components/artist/ArtistPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Cached data fetcher (dedup across generateMetadata + page render) ──

const getArtistData = cache(async (rawId: string) => {
  const baseUrl = (process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL) || 'http://localhost:3001';

  // If it's a search-based ID (e.g. itunes-search-Betharia%20Sonatha), 
  // search by name instead of direct lookup
  if (ArtistParser.isSearchBasedId(rawId)) {
    const artistName = decodeURIComponent(
      rawId.replace(/^itunes-search-/, '').replace(/^search-/, '')
    );
    return searchArtistByName(baseUrl, artistName);
  }

  const cleanId = ArtistParser.stripArtistIdPrefix(rawId);

  try {
    const [artistRes, topTracksRes, albumsRes] = await Promise.all([
      fetch(`${baseUrl}/api/artists/${cleanId}`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/artists/${cleanId}/top?limit=20`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/artists/${cleanId}/albums?limit=50`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
    ]);

    const artist = artistRes.ok ? (await artistRes.json()).data : null;
    const topTracks = topTracksRes.ok ? (await topTracksRes.json()).data?.songs || [] : [];
    const albums = albumsRes.ok ? (await albumsRes.json()).data : [];

    // Validate: if backend returned a dummy artist, try search by name fallback
    if (artist && ArtistParser.isDummyArtist(artist, rawId)) {
      // The name is the raw ID — we can't search with that meaningfully.
      // Return null so the page shows 404
      return { artist: null, topTracks: [], albums: [] };
    }

    return { artist, topTracks, albums };
  } catch (error) {
    console.error('Error fetching artist data:', error);
    return { artist: null, topTracks: [], albums: [] };
  }
});

/** Fallback: search for an artist by name and return their data */
async function searchArtistByName(baseUrl: string, artistName: string) {
  try {
    // Step 1: Search for the artist
    const searchRes = await fetch(
      `${baseUrl}/api/search/artists?query=${encodeURIComponent(artistName)}&limit=1`,
      { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) return { artist: null, topTracks: [], albums: [] };

    const searchData = await searchRes.json();
    const results = searchData.data?.results || [];
    if (results.length === 0) return { artist: null, topTracks: [], albums: [] };

    const foundArtist = results[0];
    const foundId = ArtistParser.stripArtistIdPrefix(foundArtist.id || '');

    // Step 2: Fetch full artist data using the resolved ID
    const [artistRes, topTracksRes, albumsRes] = await Promise.all([
      fetch(`${baseUrl}/api/artists/${foundId}`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/artists/${foundId}/top?limit=20`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/artists/${foundId}/albums?limit=50`, { headers: { 'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site' }, next: { revalidate: 3600 } }),
    ]);

    const artist = artistRes.ok ? (await artistRes.json()).data : null;
    const topTracks = topTracksRes.ok ? (await topTracksRes.json()).data?.songs || [] : [];
    const albums = albumsRes.ok ? (await albumsRes.json()).data : [];

    return { artist, topTracks, albums };
  } catch (error) {
    console.error('Error searching artist by name:', error);
    return { artist: null, topTracks: [], albums: [] };
  }
}

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
    (topTracks[0] ? ImageHelper.getBestImageUrl(topTracks[0].image) ?? null : null);

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
