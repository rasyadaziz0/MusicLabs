'use client';

import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibrarySearchBar } from '@/components/library/LibrarySearchBar';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { AppleMusicTrackList } from '@/components/ui/AppleMusicTrackList';
import { CustomSelect } from '@/components/ui/CustomSelect';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrarySongs } from '@/hooks/library/useLibrarySongs';
import * as SearchHelper from '@/lib/utils/search';
import { Song } from '@/types/music';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type SortMode = 'recent' | 'title' | 'artist';

export default function LibrarySongsPage() {
  const { t } = useTranslation();
  const { user, signInWithGoogle } = useAuth();
  const { playTrack } = usePlayer();
  const { songs, isLoading } = useLibrarySongs();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filteredSongs = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      const sorted = [...songs];
      if (sortMode === 'title') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortMode === 'artist') {
        sorted.sort((a, b) =>
          (a.artists.primary[0]?.name ?? '').localeCompare(b.artists.primary[0]?.name ?? '')
        );
      }
      return sorted;
    }

    const scored = songs
      .map((song, index) => ({
        song,
        score: SearchHelper.scoreSongMatch(song, trimmedQuery, index),
      }))
      .filter((item) => item.score >= 45);

    if (sortMode === 'title') {
      scored.sort((a, b) => a.song.name.localeCompare(b.song.name));
    } else if (sortMode === 'artist') {
      scored.sort((a, b) =>
        (a.song.artists.primary[0]?.name ?? '').localeCompare(b.song.artists.primary[0]?.name ?? '')
      );
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    return scored.map((item) => item.song);
  }, [query, songs, sortMode]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">{t('sidebar.songs')}</h1>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-white">{t('sidebar.songs')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('library.songs_desc')}</p>
      </div>

      {!user ? (
        <LibraryEmptyState
          title={t('library.login_songs_title')}
          description={t('library.login_songs_desc')}
          ctaLabel={t('library.login_google')}
          onCtaClick={() => signInWithGoogle('/library/songs')}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <LibrarySearchBar
                value={query}
                onChange={setQuery}
                placeholder={t('search.placeholder')}
              />
            </div>
            <CustomSelect
              value={sortMode}
              onChange={(val) => setSortMode(val as SortMode)}
              options={[
                { value: 'recent', label: t('library.sort_relevant') },
                { value: 'title', label: t('library.sort_title') },
                { value: 'artist', label: t('library.sort_artist') },
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
