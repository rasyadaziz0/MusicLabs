'use client';

import { MusicApiService } from '@/lib/api/MusicApiService';
import { DisplayedSongsResolver } from '@/lib/services/search/DisplayedSongsResolver';
import { MusicSearchRanker } from '@/lib/services/search/MusicSearchRanker';
import { SearchDataNormalizer } from '@/lib/services/search/SearchDataNormalizer';
import { TopResultsBuilder } from '@/lib/services/search/TopResultsBuilder';
import * as SearchHelper from '@/lib/utils/search';
import { SearchArtistResult } from '@/types/hooks/search';
import { Song } from '@/types/music';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const EMPTY_SONGS: Song[] = [];
const EMPTY_ARTISTS: SearchArtistResult[] = [];
const EMPTY_ALBUMS: any[] = [];

export function useMusicSearch(query: string) {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  const searchRegion =
    typeof window !== 'undefined'
      ? localStorage.getItem('searchRegion') || 'ID'
      : 'ID';

  const trimmedQuery = query.trim();

  // 1. Core search query (Songs, Artists, Albums)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', trimmedQuery, searchRegion],
    queryFn: async () => {
      if (trimmedQuery.length < 1) {
        return { songs: [], artists: [], albums: [] };
      }

      const safeQuery = SearchHelper.normalizeSearchText(trimmedQuery) || trimmedQuery;
      const [songsData, artistsData, albumsData] = await Promise.all([
        MusicApiService.searchSongs(safeQuery, 25, searchRegion),
        MusicApiService.searchArtists(safeQuery, 10, searchRegion),
        MusicApiService.searchAlbums(safeQuery, 12, searchRegion),
      ]);

      const rawSongs: Song[] = songsData?.results ?? [];
      const normalizedArtists = SearchDataNormalizer.normalizeArtists(artistsData, rawSongs, safeQuery);

      return {
        songs: rawSongs,
        artists: normalizedArtists,
        albums: albumsData?.results ?? [],
      };
    },
    enabled: trimmedQuery.length >= 1,
  });

  const songs: Song[] = searchResults?.songs ?? EMPTY_SONGS;
  const artists: SearchArtistResult[] = searchResults?.artists ?? EMPTY_ARTISTS;
  const albums: any[] = searchResults?.albums ?? EMPTY_ALBUMS;

  // 2. Score and rank artists
  const rankedArtistsWithScore = useMemo(
    () => MusicSearchRanker.rankArtists(artists, trimmedQuery),
    [artists, trimmedQuery]
  );

  // 3. Dominant artist detection (score >= 105)
  const dominantArtist = useMemo(
    () => MusicSearchRanker.detectDominantArtist(rankedArtistsWithScore),
    [rankedArtistsWithScore]
  );

  // 4. Enrich dominant artist with top tracks
  const { data: dominantArtistTopTracks = [] } = useQuery({
    queryKey: ['dominant-artist-tracks', dominantArtist?.id],
    queryFn: async () => {
      if (!dominantArtist?.id) return [];
      try {
        const res = await MusicApiService.getArtistTopTracks(dominantArtist.id);
        return Array.isArray(res) ? res.slice(0, 10) : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(dominantArtist?.id),
    staleTime: 1000 * 60 * 10,
  });

  // 5. Score and rank songs (merging dominant artist top tracks)
  const rankedSongsWithScore = useMemo(
    () => MusicSearchRanker.mergeAndRankSongs(songs, dominantArtistTopTracks, dominantArtist, trimmedQuery),
    [songs, dominantArtistTopTracks, dominantArtist, trimmedQuery]
  );

  // 6. Score and rank albums
  const rankedAlbumsWithScore = useMemo(
    () => MusicSearchRanker.rankAlbums(albums, trimmedQuery),
    [albums, trimmedQuery]
  );

  // 7. Structured Top Results Grid (Up to 6 contextual items)
  const { topResults, topResult } = useMemo(
    () => TopResultsBuilder.build(rankedSongsWithScore, rankedArtistsWithScore, rankedAlbumsWithScore, trimmedQuery),
    [rankedSongsWithScore, rankedArtistsWithScore, rankedAlbumsWithScore, trimmedQuery]
  );

  const rankedSongs = useMemo(() => rankedSongsWithScore.map((i) => i.song), [rankedSongsWithScore]);
  const rankedArtists = useMemo(() => rankedArtistsWithScore.map((i) => i.artist).slice(0, 10), [rankedArtistsWithScore]);
  const rankedAlbums = useMemo(() => rankedAlbumsWithScore.map((i) => i.album).slice(0, 10), [rankedAlbumsWithScore]);

  const selectedArtist =
    rankedArtists.find((artist: SearchArtistResult) => artist.id === selectedArtistId) ?? null;

  // 8. Selected artist queries
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
      const filtered = (result?.results ?? []).filter((song: Song) =>
        SearchHelper.isArtistMatch(song, selectedArtist.title)
      );
      return { results: filtered };
    },
    enabled: Boolean(selectedArtist?.title),
  });

  const artistSongs: Song[] = artistSongsData?.songs ?? [];
  const artistNameSongs: Song[] = artistNameSongsData?.results ?? [];

  const displayedSongs = useMemo(
    () =>
      DisplayedSongsResolver.resolve({
        selectedArtist,
        artistSongs,
        artistNameSongs,
        songsFromQuery: songs,
        rankedSongs,
        fallbackSongs: songs,
      }),
    [selectedArtist, artistSongs, artistNameSongs, songs, rankedSongs]
  );

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
    topResults,
  };
}
