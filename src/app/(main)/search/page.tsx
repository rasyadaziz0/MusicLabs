'use client';

import { getArtistSongs, searchArtists, searchSongs } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Clock } from 'lucide-react';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { decodeQuery, encodeQuery } from '@/lib/utils/searchEncode';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function getMatchScore(text: string, query: string) {
  if (!text) return 0;
  if (text === query) return 120;
  if (text.startsWith(query)) return 80;
  if (text.includes(query)) return 50;
  return 0;
}

function isArtistMatch(song: Song, artistName: string) {
  const target = normalizeSearchText(artistName);
  if (!target) return false;

  const names = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
    .map((a) => normalizeSearchText(a.name))
    .filter(Boolean);

  return names.some((name) =>
    name === target
    || name.startsWith(target)
    || target.startsWith(name)
    || name.includes(target)
  );
}

interface SearchArtistResult {
  id: string;
  title: string;
  description?: string;
  image?: { quality: string; url: string }[];
}

interface RawSearchArtistResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  role?: string;
  image?: { quality: string; url: string }[];
}

const EMPTY_SONGS: Song[] = [];
const EMPTY_ARTISTS: SearchArtistResult[] = [];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function SearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') ?? '';
  const queryFromUrl = decodeQuery(rawQuery);
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const debouncedQuery = useDebouncedValue(inputValue, 500);
  const query = debouncedQuery.trim();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const currentQuery = queryFromUrl.trim();
    if (query === currentQuery) return;

    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', encodeQuery(query));
    } else {
      params.delete('q');
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [query, queryFromUrl, searchParams, pathname, router]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (query.length <= 2) return { songs: [], artists: [] };

      const [songsData, artistsData] = await Promise.all([searchSongs(query), searchArtists(query)]);
      const normalizedArtists: SearchArtistResult[] = (artistsData?.results ?? [])
        .map((artist: RawSearchArtistResult) => ({
          id: artist?.id,
          title: artist?.title || artist?.name || '',
          description: artist?.description || artist?.role || 'Artist',
          image: artist?.image || [],
        }))
        .filter((artist: SearchArtistResult) => artist.id && artist.title);

      return {
        songs: songsData?.results ?? [],
        artists: normalizedArtists,
      };
    },
    enabled: query.length > 2,
  });

  const songs: Song[] = searchResults?.songs ?? EMPTY_SONGS;
  const artists: SearchArtistResult[] = searchResults?.artists ?? EMPTY_ARTISTS;
  const rankedSongs = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return songs;

    return songs
      .map((song: Song) => {
        const title = normalizeSearchText(song.name);
        const allArtistsText = normalizeSearchText(
          [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
            .map((a) => a.name)
            .join(' ')
        );
        const titleScore = getMatchScore(title, normalizedQuery);
        const artistScore = getMatchScore(allArtistsText, normalizedQuery);

        // Prioritize records that clearly match title or artist.
        const score = Math.max(titleScore, artistScore);
        return { song, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  }, [songs, query]);
  const rankedArtists = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return artists;

    return artists
      .map((artist: SearchArtistResult) => {
        const artistName = normalizeSearchText(artist.title);
        return { artist, score: getMatchScore(artistName, normalizedQuery) };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.artist)
      .slice(0, 8);
  }, [artists, query]);
  const selectedArtist =
    rankedArtists.find((artist: SearchArtistResult) => artist.id === selectedArtistId) ?? null;
  const { data: artistSongsData, isLoading: isArtistSongsLoading } = useQuery({
    queryKey: ['artist-songs', selectedArtist?.id],
    queryFn: () => (selectedArtist ? getArtistSongs(selectedArtist.id) : Promise.resolve({ songs: [] })),
    enabled: Boolean(selectedArtist?.id),
  });
  const { data: artistNameSongsData, isLoading: isArtistNameSongsLoading } = useQuery({
    queryKey: ['artist-name-songs', selectedArtist?.title],
    queryFn: async () => {
      if (!selectedArtist?.title) return { results: [] as Song[] };
      const result = await searchSongs(selectedArtist.title);
      const filtered = (result?.results ?? []).filter((song: Song) => isArtistMatch(song, selectedArtist.title));
      return { results: filtered };
    },
    enabled: Boolean(selectedArtist?.title),
  });

  const artistSongs: Song[] = artistSongsData?.songs ?? [];
  const artistNameSongs: Song[] = artistNameSongsData?.results ?? [];
  const selectedArtistSongsFromQuery = useMemo(() => {
    if (!selectedArtist?.title) return [] as Song[];
    return songs.filter((song: Song) => isArtistMatch(song, selectedArtist.title));
  }, [songs, selectedArtist]);
  const displayedSongs = selectedArtist
    ? artistSongs.length > 0
      ? artistSongs
      : artistNameSongs.length > 0
        ? artistNameSongs
        : selectedArtistSongsFromQuery
    : rankedSongs.length > 0
      ? rankedSongs
      : songs;
  const genres = ['Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Rock', 'Classical', 'Chill', 'Mood'];
  const genreGradients = ['#2F2FE4', '#162E93', '#1A1953'];

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-8">Search</h1>
        <div className="relative group max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-white transition-colors" size={24} />
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder="What do you want to listen to?"
            className="bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 w-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all shadow-2xl"
          />
        </div>
      </div>

      {query.length > 2 ? (
        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {rankedArtists.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold mb-3">Artists</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {rankedArtists.map((artist: SearchArtistResult) => (
                      <Link
                        key={artist.id}
                        href={`/artist/${artist.id}`}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold truncate">{artist.title}</p>
                        <p className="text-xs text-muted truncate">{artist.description || 'Artist'}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {(isArtistSongsLoading || isArtistNameSongsLoading) && rankedSongs.length === 0 && (
                <div className="space-y-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
              {displayedSongs.length > 0 && (
                <>
                  <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-2 md:px-4 py-2 text-sm font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-4">
                    <span className="w-8 text-center">#</span>
                    <span>Title</span>
                    <span className="hidden md:block">Album</span>
                    <span className="hidden sm:flex w-20 justify-center">Save</span>
                    <span className="hidden lg:flex w-20 justify-center">List</span>
                    <span className="w-12 flex justify-end"><Clock size={16} /></span>
                  </div>
                  {displayedSongs.map((song: Song, index: number) => (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song, displayedSongs)}
                      className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 md:gap-4 px-2 md:px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer items-center"
                    >
                      <span className="w-8 text-center text-muted group-hover:text-white font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          {getBestImageUrl(song.image) ? (
                            <Image
                              src={getBestImageUrl(song.image)!}
                              alt={song.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{song.name}</p>
                          <div className="text-xs text-muted truncate flex items-center gap-1">
                            {song.artists.primary.map((a, i) => (
                              <span key={a.id}>
                                <Link
                                  href={`/artist/${a.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline hover:text-white transition-colors"
                                >
                                  {a.name}
                                </Link>
                                {i < song.artists.primary.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block text-sm text-muted truncate">
                        {song.album.name}
                      </div>
                      <div className="hidden justify-center sm:flex">
                        <TrackLikeButton track={song} />
                      </div>
                      <div className="hidden justify-center lg:flex">
                        <AddToPlaylistButton track={song} />
                      </div>
                      <div className="w-12 text-right text-xs text-muted font-medium">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {displayedSongs.length === 0 && rankedArtists.length === 0 && !isArtistSongsLoading && !isArtistNameSongsLoading && (
                <div className="text-center py-20">
                  <p className="text-xl text-muted font-medium">No results found for &quot;{query}&quot;</p>
                </div>
              )}
              {selectedArtist && displayedSongs.length === 0 && !isArtistSongsLoading && !isArtistNameSongsLoading && (
                <div className="text-center py-10">
                  <p className="text-base text-muted">
                    Belum ada lagu yang ketemu untuk artist &quot;{selectedArtist.title}&quot; dari source API ini.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {genres.map((genre, index) => (
            <div 
              key={genre}
              className="aspect-square rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${genreGradients[index % genreGradients.length]}, #080616)`,
              }}
            >
              <h3 className="text-2xl font-bold">{genre}</h3>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
