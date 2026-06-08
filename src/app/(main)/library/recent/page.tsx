'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Disc3, Music } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists, useLibraryAlbums } from '@/hooks/useMusicLibrary';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';

export default function RecentlyAddedPage() {
  const { user, signInWithGoogle } = useAuth();
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();
  const { albums, isLoading: isAlbumsLoading } = useLibraryAlbums();

  const isLoading = isPlaylistsLoading || isAlbumsLoading;

  const mixedItems = useMemo(() => {
    // Interleave playlists and albums to simulate a mix of "Recently Added"
    const items: Array<{
      type: 'playlist' | 'album';
      id: string;
      name: string;
      subtitle: string;
      imageUrl: string | null;
      href: string;
      isValidLink: boolean;
    }> = [];

    const maxLen = Math.max(playlists.length, albums.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < playlists.length) {
        const p = playlists[i];
        items.push({
          type: 'playlist',
          id: p.id,
          name: p.name,
          subtitle: 'Playlist',
          imageUrl: p.cover_url || null,
          href: `/playlist/${p.id}`,
          isValidLink: true,
        });
      }
      if (i < albums.length) {
        const a = albums[i];
        items.push({
          type: 'album',
          id: a.id,
          name: a.name,
          subtitle: a.artistName || 'Album',
          imageUrl: a.imageUrl || null,
          href: `/album/${a.id}`,
          isValidLink: Boolean(a.id && !a.id.includes('::')),
        });
      }
    }

    return items;
  }, [playlists, albums]);

  if (!user) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 pt-8 pb-32">
        <LibraryEmptyState
          title="Login dulu buat lihat aktivitas terbaru"
          description="Aktivitas playlist dan album kamu bakal muncul di sini."
          ctaLabel="Login with Google"
          onCtaClick={() => signInWithGoogle('/library/recent')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div>
        <h1 className="text-[28px] md:text-3xl font-bold tracking-tight text-white mb-1">Recently Added</h1>
        <p className="text-sm text-white/50">Campuran album dan playlist terbaru yang ada di library kamu.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : mixedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {mixedItems.map((item, idx) => {
            const content = (
              <div className="group flex flex-col gap-3">
                <div className={`relative aspect-square overflow-hidden border border-white/5 bg-white/5 ${item.type === 'album' ? 'rounded-2xl' : 'rounded-xl md:rounded-2xl'}`}>
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 text-[#FA243C]/50">
                      {item.type === 'album' ? <Disc3 size={36} /> : <Music size={36} />}
                    </div>
                  )}
                </div>
                <div className="px-0.5">
                  <p className="line-clamp-1 text-sm font-semibold text-white">{item.name}</p>
                  <p className="line-clamp-1 text-xs text-white/50">{item.subtitle}</p>
                </div>
              </div>
            );

            return item.isValidLink ? (
              <Link key={`${item.type}-${item.id}-${idx}`} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={`${item.type}-${item.id}-${idx}`}>{content}</div>
            );
          })}
        </div>
      ) : (
        <LibraryEmptyState
          title="Belum ada aktivitas"
          description="Mulai dengerin dan simpan lagu atau buat playlist baru."
          ctaHref="/search"
          ctaLabel="Cari Lagu"
        />
      )}
    </div>
  );
}
