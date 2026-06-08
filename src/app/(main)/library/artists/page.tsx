'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Disc3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLibraryArtists } from '@/hooks/useMusicLibrary';
import { LibrarySearchBar } from '@/components/library/LibrarySearchBar';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';

export default function LibraryArtistsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { artists, isLoading } = useLibraryArtists();
  const [query, setQuery] = useState('');

  const filteredArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return artists;
    return artists.filter((artist) => artist.name.toLowerCase().includes(normalizedQuery));
  }, [artists, query]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">Artists</h1>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-white">Artists</h1>
        <p className="mt-1 text-sm text-white/50">Artis yang paling sering muncul di listening history, likes, dan playlist kamu.</p>
      </div>

      {!user ? (
        <LibraryEmptyState
          title="Login dulu buat lihat artist library"
          description="Nanti daftar artis favorit kamu bakal otomatis kebentuk dari lagu yang kamu simpan dan putar."
          ctaLabel="Login with Google"
          onCtaClick={() => signInWithGoogle('/library/artists')}
        />
      ) : (
        <>
          <LibrarySearchBar
            value={query}
            onChange={setQuery}
            placeholder="Cari artis di library kamu..."
          />

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
                      <p className="text-xs text-white/45">{artist.songCount} lagu</p>
                    </div>
                  </div>
                );

                return artist.id && !artist.id.includes('::') ? (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={artist.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <LibraryEmptyState
              title={query ? 'Artis nggak ketemu' : 'Belum ada artis di library'}
              description={
                query
                  ? 'Coba cari nama artis lain.'
                  : 'Mulai dengarkan atau simpan beberapa lagu dulu biar daftar artis kamu kebentuk.'
              }
              ctaHref="/search"
              ctaLabel="Cari Lagu"
            />
          )}
        </>
      )}
    </div>
  );
}
