import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getITunesAlbum } from '@/lib/server/itunesApi';
import AlbumPageClient from '@/components/album/AlbumPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Cached data fetcher (dedup across generateMetadata + page render) ──

const getAlbumData = cache(async (rawId: string) => {
  // Strip prefix — same logic as api/albums/[id]/route.ts
  const itunesId = rawId.replace(/^itunes-album-/, '');
  return await getITunesAlbum(itunesId);
});

// ── Metadata (SSR) ─────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const album = await getAlbumData(rawId);

  if (!album) {
    return { title: 'Album Not Found — AcadMusic' };
  }

  const description = `Listen to "${album.title}" by ${album.artist || 'Unknown Artist'} on AcadMusic. ${album.nb_tracks || 0} tracks. Stream for free.`;
  const canonicalUrl = `https://music.rasyadazizan.site/album/${rawId}`;
  const coverUrl = album.cover_xl || album.cover_big || album.cover || '';

  return {
    title: `${album.title} — ${album.artist || 'Unknown Artist'} — AcadMusic`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${album.title} — ${album.artist || 'Unknown Artist'}`,
      description,
      url: canonicalUrl,
      type: 'music.album',
      images: coverUrl ? [{ url: coverUrl, width: 600, height: 600, alt: `${album.title} cover art` }] : [],
      siteName: 'AcadMusic',
    },
    twitter: {
      card: 'summary',
      title: `${album.title} — ${album.artist || 'Unknown Artist'}`,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

// ── Page Component (Server) ────────────────────────────────────────

export default async function AlbumPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const album = await getAlbumData(rawId);

  if (!album) notFound();

  // ── Derive values server-side ────────────────────────────────────

  const coverUrl = album.cover_xl || album.cover_big || album.cover || '';
  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear().toString() : '';
  const albumTracks = album.tracks || [];

  // ── JSON-LD Schema ──────────────────────────────────────────────

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    'name': album.title,
    'url': `https://music.rasyadazizan.site/album/${rawId}`,
    'byArtist': {
      '@type': 'MusicGroup',
      'name': album.artist || 'Unknown Artist',
      ...(album.artist_id && {
        'url': `https://music.rasyadazizan.site/artist/${album.artist_id}`,
      }),
    },
    ...(album.release_date && {
      'datePublished': album.release_date.split('T')[0],
    }),
    'numTracks': album.nb_tracks || albumTracks.length,
    ...(coverUrl && {
      'image': coverUrl,
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

      <AlbumPageClient
        albumId={rawId}
        albumTitle={album.title || 'Unknown Album'}
        albumArtist={album.artist || 'Unknown Artist'}
        albumArtistId={album.artist_id || null}
        coverUrl={coverUrl}
        releaseYear={releaseYear}
        trackCount={albumTracks.length}
        tracks={albumTracks}
      />
    </>
  );
}
