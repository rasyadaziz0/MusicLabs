'use client';
import { ArtistParser } from '@/lib/utils/ArtistParser';

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useLibraryArtists } from '@/hooks/library/useLibraryArtists';
import { ChevronLeft, Disc3 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibrarySearchBar } from '@/components/library/LibrarySearchBar';
import { FollowedArtistsList } from '@/components/library/FollowedArtistsList';

import { SearchHelper } from '@/lib/utils/search';

export default function LibraryArtistsPage() {
  const { t } = useTranslation();
  const { user, signInWithGoogle } = useAuth();
  const { artists, isLoading } = useLibraryArtists();
  const [query, setQuery] = useState('');

  const filteredArtists = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return artists;
    return artists
      .map((artist) => ({
        artist,
        score: SearchHelper.scoreArtistMatch(artist.name, trimmedQuery),
      }))
      .filter(({ score }) => score >= 45)
      .sort((a, b) => b.score - a.score)
      .map(({ artist }) => artist);
  }, [artists, query]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">{t('sidebar.artists')}</h1>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-white">{t('sidebar.artists')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('library.artists_desc')}</p>
      </div>

      {!user ? (
        <LibraryEmptyState
          title={t('library.login_artists_title')}
          description={t('library.login_artists_desc')}
          ctaLabel={t('library.login_google')}
          onCtaClick={() => signInWithGoogle('/library/artists')}
        />
      ) : (
        <>
          {/* Followed Artists Section */}
          {!query && (
            <div className="space-y-3 mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">{t('library.followed_artists_title')}</h2>
              <FollowedArtistsList />
            </div>
          )}

          <div className="pt-2">
            <h2 className="text-xl font-bold text-white tracking-tight mb-3">
              {query ? t('library.search_results') : t('library.all_artists')}
            </h2>
            <LibrarySearchBar
              value={query}
              onChange={setQuery}
              placeholder={t('library.search_artists_placeholder')}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {filteredArtists.map((artist) => {
                const content = (
                  <div className="group flex flex-col gap-3">
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 bg-white/5">
                      {artist.imageUrl ? (
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name}
                          fill
                          sizes="240px"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FA243C]/20 to-white/5 text-white/30">
                          <Disc3 size={36} />
                        </div>
                      )}
                    </div>
                    <div className="px-0.5">
                      <p className="truncate text-sm font-semibold text-white">{artist.name}</p>
                      <p className="text-xs text-white/45">{artist.songCount} {t('tracklist.songs_count')}</p>
                    </div>
                  </div>
                );

                return artist.id && !artist.id.includes('::') ? (
                  <Link key={artist.id} href={ArtistParser.getArtistLink(artist)}>
                    {content}
                  </Link>
                ) : (
                  <div key={artist.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <LibraryEmptyState
              title={query ? t('library.artist_not_found') : t('library.no_artists_yet')}
              description={
                query
                  ? t('library.artist_not_found_desc')
                  : t('library.no_artists_yet_desc')
              }
              ctaHref="/search"
              ctaLabel={t('library.search_songs')}
            />
          )}
        </>
      )}
    </div>
  );
}
