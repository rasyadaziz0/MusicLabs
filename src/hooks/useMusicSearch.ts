'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getArtistSongs, searchArtists, searchSongs, searchAlbums } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function getMatchScore(text: string, query: string) {
  if (!text) return 0;
  if (text === query) return 120;
  if (text.startsWith(query)) return 80;
  if (text.includes(query)) return 50;

  const queryWords = query.split(' ').filter(Boolean);
  let matchedWords = 0;
  for (const w of queryWords) {
    if (text.includes(w)) matchedWords++;
  }
  if (matchedWords > 0) {
    return matchedWords * 10;
  }

  return 0;
}

export function isArtistMatch(song: Song, artistName: string) {
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

export interface SearchArtistResult {
  id: string;
  title: string;
  description?: string;
  image?: { quality: string; url: string }[];
}

export interface RawSearchArtistResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  role?: string;
  image?: { quality: string; url: string }[];
}

const EMPTY_SONGS: Song[] = [];
const EMPTY_ARTISTS: SearchArtistResult[] = [];
const EMPTY_ALBUMS: any[] = [];

export function useMusicSearch(query: string) {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  const searchRegion = typeof window !== 'undefined' ? localStorage.getItem('searchRegion') || 'ID' : 'ID';

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query, searchRegion],
    queryFn: async () => {
      if (query.length <= 2) return { songs: [], artists: [], albums: [] };

      const safeQuery = normalizeSearchText(query) || query;
      
      const [songsData, artistsData, albumsData] = await Promise.all([
        searchSongs(safeQuery, 20, searchRegion),
        searchArtists(safeQuery, 1, searchRegion),
        searchAlbums(safeQuery, 10, searchRegion)
      ]);
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
        albums: albumsData?.results ?? [],
      };
    },
    enabled: query.length > 2,
  });

  const songs: Song[] = searchResults?.songs ?? EMPTY_SONGS;
  const artists: SearchArtistResult[] = searchResults?.artists ?? EMPTY_ARTISTS;
  const albums: any[] = searchResults?.albums ?? EMPTY_ALBUMS;

  const rankedSongsWithScore = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return songs.map((s, i) => ({ song: s, score: 0, index: i }));

    return songs
      .map((song: Song, index: number) => {
        const title = normalizeSearchText(song.name);
        const allArtistsText = normalizeSearchText(
          [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
            .map((a) => a.name)
            .join(' ')
        );
        const titleScore = getMatchScore(title, normalizedQuery);
        const artistScore = getMatchScore(allArtistsText, normalizedQuery);

        const score = Math.max(titleScore, artistScore);
        return { song, score, index };
      })
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.index - b.index);
  }, [songs, query]);

  const rankedArtistsWithScore = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return artists.map((a, i) => ({ artist: a, score: 0, index: i }));

    return artists
      .map((artist: SearchArtistResult, index: number) => {
        const artistName = normalizeSearchText(artist.title);
        return { artist, score: getMatchScore(artistName, normalizedQuery), index };
      })
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.index - b.index);
  }, [artists, query]);

  const topResult = useMemo(() => {
    if (!query || query.length <= 2) return null;
    const topSong = rankedSongsWithScore[0];
    const topArtist = rankedArtistsWithScore[0];

    if (!topSong && !topArtist) return null;
    if (!topSong) return { type: 'artist' as const, data: topArtist.artist };
    if (!topArtist) return { type: 'song' as const, data: topSong.song };
    if (topArtist.score >= 80 && topArtist.score >= topSong.score) {
      return { type: 'artist' as const, data: topArtist.artist };
    }

    if (topSong.score > topArtist.score) {
      return { type: 'song' as const, data: topSong.song };
    }

    // Default tie-breaker
    return { type: 'artist' as const, data: topArtist.artist };
  }, [rankedSongsWithScore, rankedArtistsWithScore, query]);

  const rankedSongs = useMemo(() => rankedSongsWithScore.map(i => i.song), [rankedSongsWithScore]);
  const rankedArtists = useMemo(() => rankedArtistsWithScore.map(i => i.artist).slice(0, 8), [rankedArtistsWithScore]);
  const rankedAlbums = albums.slice(0, 8);

  const selectedArtist = rankedArtists.find((artist: SearchArtistResult) => artist.id === selectedArtistId) ?? null;

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

  return {
    isLoading,
    isArtistSongsLoading,
    isArtistNameSongsLoading,
    rankedSongs,
    rankedArtists,
    rankedAlbums,
    displayedSongs,
    selectedArtist,
    selectedArtistId,
    setSelectedArtistId,
    topResult,
  };
}
