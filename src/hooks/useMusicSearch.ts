'use client';

import { SearchHelper } from '@/lib/utils/SearchHelper';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Song } from '@/types/music';
import { SearchArtistResult, RawSearchArtistResult } from '@/types/hooks/search';





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

      const safeQuery = SearchHelper.normalizeSearchText(query) || query;

      const [songsData, artistsData, albumsData] = await Promise.all([
        MusicApiService.searchSongs(safeQuery, 20, searchRegion),
        MusicApiService.searchArtists(safeQuery, 1, searchRegion),
        MusicApiService.searchAlbums(safeQuery, 10, searchRegion)
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
    const normalizedQuery = SearchHelper.normalizeSearchText(query);
    if (!normalizedQuery) return songs.map((s, i) => ({ song: s, score: 0, index: i }));

    return songs
      .map((song: Song, index: number) => {
        const title = SearchHelper.normalizeSearchText(song.name);
        const allArtistsText = SearchHelper.normalizeSearchText(
          [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
            .map((a) => a.name)
            .join(' ')
        );
        const titleScore = SearchHelper.getMatchScore(title, normalizedQuery);
        const artistScore = SearchHelper.getMatchScore(allArtistsText, normalizedQuery);

        const score = Math.max(titleScore, artistScore);
        return { song, score, index };
      })
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.index - b.index);
  }, [songs, query]);

  const rankedArtistsWithScore = useMemo(() => {
    const normalizedQuery = SearchHelper.normalizeSearchText(query);
    if (!normalizedQuery) return artists.map((a, i) => ({ artist: a, score: 0, index: i }));

    return artists
      .map((artist: SearchArtistResult, index: number) => {
        const artistName = SearchHelper.normalizeSearchText(artist.title);
        return { artist, score: SearchHelper.getMatchScore(artistName, normalizedQuery), index };
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
    queryFn: () => (selectedArtist ? MusicApiService.getArtistSongs(selectedArtist.id) : Promise.resolve({ songs: [] })),
    enabled: Boolean(selectedArtist?.id),
  });

  const { data: artistNameSongsData, isLoading: isArtistNameSongsLoading } = useQuery({
    queryKey: ['artist-name-songs', selectedArtist?.title],
    queryFn: async () => {
      if (!selectedArtist?.title) return { results: [] as Song[] };
      const result = await MusicApiService.searchSongs(selectedArtist.title);
      const filtered = (result?.results ?? []).filter((song: Song) => SearchHelper.isArtistMatch(song, selectedArtist.title));
      return { results: filtered };
    },
    enabled: Boolean(selectedArtist?.title),
  });

  const artistSongs: Song[] = artistSongsData?.songs ?? [];
  const artistNameSongs: Song[] = artistNameSongsData?.results ?? [];

  const selectedArtistSongsFromQuery = useMemo(() => {
    if (!selectedArtist?.title) return [] as Song[];
    return songs.filter((song: Song) => SearchHelper.isArtistMatch(song, selectedArtist.title));
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
