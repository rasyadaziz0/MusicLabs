'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Heart, Clock } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongs } from '@/hooks/useMusicLibrary';

export default function LikedSongsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { playTrack } = usePlayer();
  const { data: likedSongs = [], isLoading } = useLikedSongs();

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-br from-fuchsia-500/30 via-primary/20 to-transparent p-8">
          <div className="flex flex-col gap-6 md:flex-row items-center md:items-end text-center md:text-left md:justify-between mt-4 md:mt-0">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">
                Playlist
              </p>
              <h1 className="text-4xl font-display font-bold md:text-6xl">Liked Songs</h1>
              <p className="mt-3 text-sm text-white/80">
                {user ? `${likedSongs.length} lagu yang sudah kamu simpan.` : 'Login untuk melihat lagu favorit kamu.'}
              </p>
            </div>
            {likedSongs.length > 0 && (
              <button
                type="button"
                onClick={() => playTrack(likedSongs[0], likedSongs)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-105"
              >
                <Play size={24} fill="currentColor" className="ml-1" />
              </button>
            )}
          </div>
        </section>

        {!user ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Heart size={28} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Login dulu untuk buka liked songs</h2>
            <p className="text-muted">Setelah login, lagu yang kamu like bakal otomatis muncul di sini.</p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Login with Google
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : likedSongs.length > 0 ? (
          <section className="space-y-1">
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-2 md:gap-4 border-b border-white/5 px-2 md:px-4 py-2 text-sm font-bold uppercase tracking-widest text-muted">
              <span className="w-8 text-center">#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="hidden sm:flex w-20 justify-center">Save</span>
              <span className="w-12 flex justify-end">
                <Clock size={16} />
              </span>
            </div>

            {likedSongs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => playTrack(song, likedSongs)}
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-2 md:gap-4 rounded-xl px-2 md:px-4 py-3 transition-colors hover:bg-white/5"
              >
                <span className="w-8 text-center text-muted">{index + 1}</span>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-11 w-11 overflow-hidden rounded-lg">
                    {getBestImageUrl(song.image) ? (
                      <Image
                        src={getBestImageUrl(song.image)!}
                        alt={song.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{song.name}</p>
                    <p className="truncate text-xs text-muted">
                      {song.artists.primary.map((artist) => artist.name).join(', ')}
                    </p>
                  </div>
                </div>
                <p className="hidden truncate text-sm text-muted md:block">{song.album.name}</p>
                <div className="hidden items-center justify-center gap-2 sm:flex">
                  <TrackLikeButton track={song} />
                  <AddToPlaylistButton track={song} />
                </div>
                <div className="w-12 text-right text-xs text-muted">
                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Heart size={28} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">No liked songs yet</h2>
            <p className="text-muted">
              Tap ikon hati dari player atau hasil pencarian buat nyimpen lagu ke sini.
            </p>
            <Link href="/search" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Cari Lagu
            </Link>
          </div>
        )}
        </div>
    </>
  );
}
