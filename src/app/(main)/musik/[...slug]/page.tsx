import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Disc3, Music2, User } from 'lucide-react';
import { Song } from '@/types/music';
import { buildTrackPath } from '@/lib/utils/slugify';
import { trackResolver } from '@/lib/services/TrackPageResolverService';
import TrackPlayButton from '@/components/track/TrackPlayButton';
import TrackHeaderActions from '@/components/track/TrackHeaderActions';
import TrackBackButton from '@/components/track/TrackBackButton';
import { ShareMoreBySection } from '@/components/share/ShareMoreBySection';
import { LyricsService } from '@/lib/server/LyricsService';
import { parseLRC, parseYRC } from '@/lib/utils/lrcParser';

const getResolvedTrack = cache(async (trackId: string) => {
  return await trackResolver.resolveTrack(trackId);
});

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = trackResolver.parseSlug(slug);

  if (!parsed) {
    return { title: 'Track Not Found — AcadMusic' };
  }

  const track = await getResolvedTrack(parsed.trackId);
  if (!track) {
    return { title: 'Track Not Found — AcadMusic' };
  }

  const seo = trackResolver.buildSEOData(track);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonicalUrl },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonicalUrl,
      type: 'music.song',
      images: seo.coverUrl ? [{ url: seo.coverUrl, width: 600, height: 600, alt: `${track.name} cover art` }] : [],
      siteName: 'AcadMusic',
    },
    twitter: {
      card: 'summary',
      title: seo.title,
      description: seo.description,
      images: seo.coverUrl ? [seo.coverUrl] : [],
    },
  };
}

// ── Page Component (Server) ────────────────────────────────────────

export default async function MusikPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = trackResolver.parseSlug(slug);

  if (!parsed) notFound();

  const track = await getResolvedTrack(parsed.trackId);
  if (!track) notFound();

  const seo = trackResolver.buildSEOData(track);
  const artistName = seo.artistName;
  const allArtists = track.artists?.all || track.artists?.primary || [];
  const artistId = track.artists?.primary?.[0]?.id;
  const coverUrl = seo.coverUrl;
  const albumName = seo.albumName;
  const albumId = track.album?.id;
  const canonicalUrl = seo.canonicalUrl;

  // Fetch more tracks server-side via OOP Service
  const moreTracks = await trackResolver.getMoreByArtist(track, artistName);

  // ── JSON-LD Schema ──────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    'name': track.name,
    'url': canonicalUrl,
    'duration': trackResolver.toISO8601Duration(track.duration),
    ...(track.year && { 'datePublished': track.releaseDate || track.year }),
    ...(coverUrl && { 'image': coverUrl }),
    'byArtist': {
      '@type': 'MusicGroup',
      'name': artistName,
      ...(artistId && {
        'url': `https://music.rasyadazizan.site/artist/${artistId}`,
      }),
    },
    ...(albumName && {
      'inAlbum': {
        '@type': 'MusicAlbum',
        'name': albumName,
        ...(albumId && {
          'url': `https://music.rasyadazizan.site/album/${albumId}`,
        }),
      },
    }),
  } as any;

  // Safe Lyrics Snippet for JSON-LD (Anti-SPAM / DMCA compliant)
  const lyricsRes = await LyricsService.getInstance().findLyrics({
    title: track.name,
    artist: artistName,
    album: albumName,
    durationSec: track.duration,
  });

  if (lyricsRes?.lyrics) {
    let excerptLines: string[];

    if (!lyricsRes.synced) {
      // Plain text lyrics (from OVH or LRClib plain fallback) — no timestamps
      excerptLines = lyricsRes.lyrics
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
    } else {
      // Synced lyrics — parse with the correct parser based on type
      const parsed = lyricsRes.type === 'yrc' ? parseYRC(lyricsRes.lyrics) : parseLRC(lyricsRes.lyrics);
      excerptLines = parsed
        .filter(l => !l.isPlaceholder && l.text.trim().length > 0)
        .map(l => l.text);
    }

    const snippet = excerptLines.slice(0, 5).join('\n');

    if (snippet) {
      jsonLd['lyrics'] = {
        '@type': 'CreativeWork',
        'text': snippet
      };
    }
  }

  // Defense-in-depth: escape `<` to `\u003c` to prevent script tag breakout in JSON-LD
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <>
      {/* JSON-LD for search engines and AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />

      <article className="max-w-4xl mx-auto space-y-10 pb-6 px-4 sm:px-0">
        {/* Top Navigation Bar: Back button on left, Heart and Three Dots on exact opposite right (`sejajar sama tombol back`) */}
        <div className="flex items-center justify-between w-full mb-6 pt-2">
          <div className="hidden sm:block">
            <TrackBackButton mode="desktop" />
          </div>
          <div className="block sm:hidden">
            <TrackBackButton mode="mobile" />
          </div>
          <TrackHeaderActions trackJson={JSON.stringify(track)} />
        </div>

        {/* ── Hero Section (exact AppleMusicHeader / Playlist design) ──────────────── */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative">
          {/* Cover Art */}
          <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex-shrink-0">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`${track.name} cover art`}
                fill
                sizes="260px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <Music2 size={64} className="text-white/20" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left w-full sm:mt-auto sm:mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight font-[family-name:var(--font-display)]">
              {track.name}
            </h1>

            <p className="text-base text-white/60">
              {albumName && <>{albumName} · </>}
              {artistName}
              {track.releaseDate && (
                <> · {new Date(track.releaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</>
              )}
            </p>

            {/* Play Button */}
            <div className="flex items-center justify-center sm:justify-start gap-3 w-full mt-2">
              <TrackPlayButton trackJson={JSON.stringify(track)} />
            </div>
          </div>
        </section>

        {/* ── Performing Artists (Apple Music style) ────────────── */}
        {allArtists.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
              Performing Artists
            </h2>
            <div className="flex flex-wrap gap-6">
              {allArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm font-bold group-hover:bg-white/20 transition-colors">
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-[#FA243C] transition-colors">
                      {artist.name}
                    </p>
                    <p className="text-xs text-white/40 capitalize">
                      {artist.role || 'Artist'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Song Details ─────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">
            Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {track.duration > 0 && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                  <Clock size={12} /> Duration
                </p>
                <p className="text-white font-medium">{trackResolver.formatDuration(track.duration)}</p>
              </div>
            )}
            {albumName && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                  <Disc3 size={12} /> Album
                </p>
                {albumId ? (
                  <Link href={`/album/${albumId}`} className="text-white font-medium hover:text-[#FA243C] transition-colors">
                    {albumName}
                  </Link>
                ) : (
                  <p className="text-white font-medium">{albumName}</p>
                )}
              </div>
            )}
            {track.genre && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1">Genre</p>
                <p className="text-white font-medium">{track.genre}</p>
              </div>
            )}
            {track.year && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-1">Release Year</p>
                <p className="text-white font-medium">{track.year}</p>
              </div>
            )}
          </div>
        </section>
      </article>

      {/* ── More By Artist Section (Apple Music style, consistent horizontal scroll) ──────── */}
      {moreTracks.length > 0 && (
        <div className="pb-12">
          <ShareMoreBySection
            title={`More By ${artistName}`}
            tracks={moreTracks}
            artistId={artistId}
          />
        </div>
      )}

      {/* Copyright notice */}
      {track.copyright && (
        <p className="text-xs text-white/20 text-center pb-8">
          {track.copyright}
        </p>
      )}
    </>
  );
}
