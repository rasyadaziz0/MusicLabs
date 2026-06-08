'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Disc3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLibraryAlbums } from '@/hooks/useMusicLibrary';
import { LibrarySearchBar } from '@/components/library/LibrarySearchBar';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { CustomSelect } from '@/components/ui/CustomSelect';

type SortMode = 'title' | 'artist' | 'year';

export default function LibraryAlbumsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { albums, isLoading } = useLibraryAlbums();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('title');

  const filteredAlbums = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = normalizedQuery
      ? albums.filter((album) =>
          `${album.name} ${album.artistName}`.toLowerCase().includes(normalizedQuery)
        )
      : albums;

    const sorted = [...result];
    if (sortMode === 'artist') {
      sorted.sort((a, b) => a.artistName.localeCompare(b.artistName));
    } else if (sortMode === 'year') {
      sorted.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [albums, query, sortMode]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">Albums</h1>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-white">Albums</h1>
        <p className="mt-1 text-sm text-white/50">Album yang kebentuk dari track yang pernah kamu putar, simpan, dan masuk playlist.</p>
      </div>

      {!user ? (
        <LibraryEmptyState
          title="Login dulu buat lihat album library"
          description="Begitu login, album bakal otomatis terkumpul dari aktivitas dengerin musik kamu."
          ctaLabel="Login with Google"
          onCtaClick={() => signInWithGoogle('/library/albums')}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <LibrarySearchBar
                value={query}
                onChange={setQuery}
                placeholder="Cari album atau artis..."
              />
            </div>
            <CustomSelect
              value={sortMode}
              onChange={(val) => setSortMode(val as SortMode)}
              options={[
                { value: 'title', label: 'Album A-Z' },
                { value: 'artist', label: 'Artis A-Z' },
                { value: 'year', label: 'Tahun terbaru' },
              ]}
              className="z-50"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredAlbums.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {filteredAlbums.map((album) => {
                const content = (
                  <div className="group flex flex-col gap-3">
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 bg-white/5">
                      {album.imageUrl ? (
                        <Image
                          src={album.imageUrl}
                          alt={album.name}
                          fill
                          sizes="240px"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-white/30">
                          <Disc3 size={36} />
                        </div>
                      )}
                    </div>
                    <div className="px-0.5">
                      <p className="line-clamp-1 text-sm font-semibold text-white">{album.name}</p>
                      <p className="line-clamp-1 text-xs text-white/50">{album.artistName}</p>
                      <p className="mt-0.5 text-xs text-white/35">
                        {album.year || 'Unknown year'} • {album.songCount} lagu
                      </p>
                    </div>
                  </div>
                );

                return album.id && !album.id.includes('::') ? (
                  <Link key={album.id} href={`/album/${album.id}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={album.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <LibraryEmptyState
              title={query ? 'Album nggak ketemu' : 'Belum ada album di library'}
              description={
                query
                  ? 'Coba cari judul album atau nama artis lain.'
                  : 'Mulai dengerin dan simpan beberapa lagu dulu buat ngisi koleksi album.'
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
