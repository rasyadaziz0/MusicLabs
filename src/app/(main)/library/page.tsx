'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Library, Heart, PlusSquare, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLibraryPlaylists, useLikedSongsIndex } from '@/hooks/useMusicLibrary';

export default function LibraryPage() {
  const { user, signInWithGoogle } = useAuth();
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useLibraryPlaylists();
  const { likedTrackIds, isLoading: isLikedLoading } = useLikedSongsIndex();

  const stats = useMemo(
    () => [
      {
        label: 'Liked Songs',
        value: likedTrackIds.length,
        icon: Heart,
        href: '/library/liked',
        accent: 'from-fuchsia-500/20 to-primary/10',
      },
      {
        label: 'Playlists',
        value: playlists.length,
        icon: Library,
        href: '/library',
        accent: 'from-primary/20 to-cyan-500/10',
      },
    ],
    [likedTrackIds.length, playlists.length]
  );

  return (
    <>
      <div className="space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">
                Your Music Space
              </p>
              <h1 className="mb-3 text-4xl font-display font-bold md:text-5xl">Your Library</h1>
              <p className="text-base text-muted">
                Kumpulin lagu favorit, bikin playlist, dan kelola koleksi musik kamu kayak di Spotify.
              </p>
            </div>
            {user ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/import/spotify"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Download size={16} />
                  Import Spotify
                </Link>
                <Link
                  href="/playlist/create"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                >
                  <PlusSquare size={16} />
                  Create Playlist
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Login to Start
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.accent} p-6 transition-transform hover:-translate-y-1`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={22} />
                  </div>
                  <ArrowRight size={18} className="text-muted" />
                </div>
                <p className="text-sm text-muted">{item.label}</p>
                <p className="mt-1 text-3xl font-bold">{item.value}</p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Playlists</h2>
              <p className="text-sm text-muted">Playlist pribadi kamu tampil otomatis dari Supabase.</p>
            </div>
            <Link href="/playlist/create" className="text-sm font-medium text-primary hover:underline">
              New playlist
            </Link>
          </div>

          {!user ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
              <p className="text-base font-medium">Login untuk buka library kamu.</p>
            </div>
          ) : isPlaylistsLoading || isLikedLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-36 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : playlists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:bg-white/5"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Library size={24} />
                  </div>
                  <h3 className="truncate text-lg font-semibold">{playlist.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">
                    {playlist.description || 'Personal playlist for your favorite tracks.'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
              <h3 className="text-xl font-semibold">Belum ada playlist</h3>
              <p className="mt-2 text-sm text-muted">
                Mulai bikin playlist pertama buat ngumpulin lagu-lagu favorit kamu.
              </p>
              <Link
                href="/playlist/create"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                <PlusSquare size={16} />
                Buat Playlist
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
