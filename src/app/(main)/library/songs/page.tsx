'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrarySongs } from '@/hooks/useMusicLibrary';
import { LibrarySearchBar } from '@/components/library/LibrarySearchBar';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Song } from '@/types/music';

type SortMode = 'recent' | 'title' | 'artist';

export default function LibrarySongsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { playTrack } = usePlayer();
  const { songs, isLoading } = useLibrarySongs();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = normalizedQuery
      ? songs.filter((song) => {
          const artist = song.artists.primary.map((item) => item.name).join(' ').toLowerCase();
          const album = song.album?.name?.toLowerCase() ?? '';
          return `${song.name} ${artist} ${album}`.toLowerCase().includes(normalizedQuery);
        })
      : songs;

    const sorted = [...result];
    if (sortMode === 'title') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'artist') {
      sorted.sort((a, b) =>
        (a.artists.primary[0]?.name ?? '').localeCompare(b.artists.primary[0]?.name ?? '')
      );
    }
    return sorted;
  }, [query, songs, sortMode]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">Songs</h1>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-white">Songs</h1>
        <p className="mt-1 text-sm text-white/50">Semua lagu yang kebentuk dari likes, recent plays, dan playlist kamu.</p>
      </div>

      {!user ? (
        <LibraryEmptyState
          title="Login dulu buat buka Library Songs"
          description="Setelah login, semua lagu yang kamu like, putar, atau simpan di playlist bakal muncul di sini."
          ctaLabel="Login with Google"
          onCtaClick={() => signInWithGoogle('/library/songs')}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <LibrarySearchBar
                value={query}
                onChange={setQuery}
                placeholder="Cari lagu, artis, atau album..."
              />
            </div>
            <CustomSelect
              value={sortMode}
              onChange={(val) => setSortMode(val as SortMode)}
              options={[
                { value: 'recent', label: 'Paling relevan' },
                { value: 'title', label: 'Judul A-Z' },
                { value: 'artist', label: 'Artis A-Z' },
              ]}
              className="z-50"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredSongs.length > 0 ? (
            <AppleMusicTrackList
              tracks={filteredSongs}
              onPlayTrack={(track: Song, allTracks: Song[]) => playTrack(track, allTracks)}
              showAlbum={true}
              className="mt-2 w-full space-y-1"
              renderTrackOptions={(song) => (
                <>
                  <TrackLikeButton track={song} asMenuItem />
                  <div className="w-full">
                    <AddToQueueButton track={song} showText />
                  </div>
                  <div className="w-full">
                    <AddToPlaylistButton track={song} asMenuItem />
                  </div>
                </>
              )}
            />
          ) : (
            <LibraryEmptyState
              title={query ? 'Lagu nggak ketemu' : 'Belum ada lagu di library'}
              description={
                query
                  ? 'Coba pakai keyword lain buat cari lagu di library kamu.'
                  : 'Mulai like lagu, dengerin track, atau tambah lagu ke playlist dulu.'
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
