'use client';

import { MusicApiService } from '@/lib/api/MusicApiService';
import * as SearchHelper from '@/lib/utils/search';
import { RawSearchArtistResult, SearchArtistResult, TopSearchResultItem } from '@/types/hooks/search';
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
        MusicApiService.searchArtists(safeQuery, 10, searchRegion), // Limit 10 instead of 1
        MusicApiService.searchAlbums(safeQuery, 12, searchRegion),
      ]);

      const normalizedArtists: SearchArtistResult[] = (artistsData?.results ?? [])
        .map((artist: RawSearchArtistResult) => ({
          id: artist?.id,
          title: artist?.title || artist?.name || '',
          description: artist?.description || artist?.role || 'Artist',
          image: artist?.image || [],
        }))
        .filter((artist: SearchArtistResult) => artist.id && artist.title);

      const rawSongs: Song[] = songsData?.results ?? [];

      // Extract artists from matching songs if not already in artists list
      const existingArtistNames = new Set(
        normalizedArtists.map((a) => SearchHelper.normalizeSearchText(a.title))
      );

      for (const song of rawSongs) {
        const primary = song.artists?.primary?.[0];
        if (primary && primary.name) {
          const normArtist = SearchHelper.normalizeSearchText(primary.name);
          if (!existingArtistNames.has(normArtist)) {
            const score = SearchHelper.scoreArtistMatch(primary.name, safeQuery);
            if (score >= 65) {
              normalizedArtists.push({
                id: primary.id || `search-${encodeURIComponent(primary.name)}`,
                title: primary.name,
                description: 'Artist',
                image: song.image || [],
              });
              existingArtistNames.add(normArtist);
            }
          }
        }
      }

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
  const rankedArtistsWithScore = useMemo(() => {
    if (!trimmedQuery) return artists.map((a, i) => ({ artist: a, score: 0, index: i }));

    return artists
      .map((artist: SearchArtistResult, index: number) => ({
        artist,
        score: SearchHelper.scoreArtistMatch(artist.title, trimmedQuery, index),
        index,
      }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }, [artists, trimmedQuery]);

  // 3. Dominant artist detection (score >= 105)
  const topArtistCandidate = rankedArtistsWithScore[0];
  const dominantArtist =
    topArtistCandidate && topArtistCandidate.score >= 105
      ? topArtistCandidate.artist
      : null;

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
  const rankedSongsWithScore = useMemo(() => {
    // Merge songs with dominant artist top tracks
    const songMap = new Map<string, Song>();
    for (const s of songs) {
      if (s?.id) songMap.set(s.id, s);
    }
    for (const s of dominantArtistTopTracks) {
      if (s?.id && !songMap.has(s.id)) {
        songMap.set(s.id, s);
      }
    }

    const allSongs = Array.from(songMap.values());
    if (!trimmedQuery) return allSongs.map((s, i) => ({ song: s, score: 0, index: i }));

    return allSongs
      .map((song: Song, index: number) => {
        let score = SearchHelper.scoreSongMatch(song, trimmedQuery, index);
        // Bonus if from dominant artist
        if (
          dominantArtist &&
          SearchHelper.isArtistMatch(song, dominantArtist.title)
        ) {
          score += 15;
        }
        return { song, score, index };
      })
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }, [songs, dominantArtistTopTracks, dominantArtist, trimmedQuery]);

  // 6. Score and rank albums
  const rankedAlbumsWithScore = useMemo(() => {
    if (!trimmedQuery) return albums.map((a, i) => ({ album: a, score: 0, index: i }));

    return albums
      .map((album: any, index: number) => ({
        album,
        score: SearchHelper.scoreAlbumMatch(album, trimmedQuery, index),
        index,
      }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));
  }, [albums, trimmedQuery]);

  // 7. Structured Top Results Grid (Up to 6 contextual items)
  const { topResults, topResult } = useMemo(() => {
    if (!trimmedQuery || trimmedQuery.length < 1) {
      return { topResults: [] as TopSearchResultItem[], topResult: null };
    }

    const topSongEntry = rankedSongsWithScore[0];
    const topArtistEntry = rankedArtistsWithScore[0];
    const topAlbumEntry = rankedAlbumsWithScore[0];

    if (!topSongEntry && !topArtistEntry && !topAlbumEntry) {
      return { topResults: [] as TopSearchResultItem[], topResult: null };
    }

    // Determine #1 top item with tie-breaker
    let primaryType: 'song' | 'artist' | 'album' = 'song';
    const songScore = topSongEntry?.score ?? -1;
    let artistScore = topArtistEntry?.score ?? -1;
    const albumScore = topAlbumEntry?.score ?? -1;

    // Tie-breaker: If user typed artist name exactly, give artist +8 bonus
    const normQ = SearchHelper.normalizeSearchText(trimmedQuery);
    const normTopArtist = SearchHelper.normalizeSearchText(topArtistEntry?.artist?.title || '');
    if (normTopArtist && normQ === normTopArtist) {
      artistScore += 8;
    }

    if (artistScore >= songScore && artistScore >= albumScore) {
      primaryType = 'artist';
    } else if (albumScore > songScore && albumScore > artistScore) {
      primaryType = 'album';
    } else {
      primaryType = 'song';
    }

    const results: TopSearchResultItem[] = [];
    const addedSongIds = new Set<string>();
    const addedArtistIds = new Set<string>();
    const addedAlbumIds = new Set<string>();

    if (primaryType === 'artist' && topArtistEntry) {
      results.push({ type: 'artist', data: topArtistEntry.artist });
      addedArtistIds.add(topArtistEntry.artist.id);

      // Add top songs from this artist
      const artistSongs = rankedSongsWithScore.filter((s) =>
        SearchHelper.isArtistMatch(s.song, topArtistEntry.artist.title)
      );
      for (const item of artistSongs.slice(0, 3)) {
        results.push({ type: 'song', data: item.song });
        addedSongIds.add(item.song.id);
      }

      // Add relevant album from this artist
      const artistAlbum = rankedAlbumsWithScore.find((a) =>
        SearchHelper.normalizeSearchText(a.album.artist || '').includes(
          SearchHelper.normalizeSearchText(topArtistEntry.artist.title)
        )
      );
      if (artistAlbum) {
        results.push({ type: 'album', data: artistAlbum.album });
        addedAlbumIds.add(artistAlbum.album.id);
      }

      // Fill remaining slots up to 6
      for (const item of rankedSongsWithScore) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    } else if (primaryType === 'album' && topAlbumEntry) {
      results.push({ type: 'album', data: topAlbumEntry.album });
      addedAlbumIds.add(topAlbumEntry.album.id);

      if (topArtistEntry && !addedArtistIds.has(topArtistEntry.artist.id)) {
        results.push({ type: 'artist', data: topArtistEntry.artist });
        addedArtistIds.add(topArtistEntry.artist.id);
      }

      for (const item of rankedSongsWithScore.slice(0, 4)) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    } else {
      // primaryType === 'song'
      if (topSongEntry) {
        results.push({ type: 'song', data: topSongEntry.song });
        addedSongIds.add(topSongEntry.song.id);
      }

      // Next best song
      const secondSong = rankedSongsWithScore[1];
      if (secondSong && !addedSongIds.has(secondSong.song.id)) {
        results.push({ type: 'song', data: secondSong.song });
        addedSongIds.add(secondSong.song.id);
      }

      // Artist of top song
      if (topArtistEntry && !addedArtistIds.has(topArtistEntry.artist.id)) {
        results.push({ type: 'artist', data: topArtistEntry.artist });
        addedArtistIds.add(topArtistEntry.artist.id);
      }

      // Album if high score
      if (topAlbumEntry && topAlbumEntry.score >= 85 && !addedAlbumIds.has(topAlbumEntry.album.id)) {
        results.push({ type: 'album', data: topAlbumEntry.album });
        addedAlbumIds.add(topAlbumEntry.album.id);
      }

      // Fill remaining slots
      for (const item of rankedSongsWithScore) {
        if (results.length >= 6) break;
        if (!addedSongIds.has(item.song.id)) {
          results.push({ type: 'song', data: item.song });
          addedSongIds.add(item.song.id);
        }
      }
    }

    return { topResults: results, topResult: results[0] ?? null };
  }, [rankedSongsWithScore, rankedArtistsWithScore, rankedAlbumsWithScore, trimmedQuery]);

  const rankedSongs = useMemo(
    () => rankedSongsWithScore.map((i) => i.song),
    [rankedSongsWithScore]
  );
  const rankedArtists = useMemo(
    () => rankedArtistsWithScore.map((i) => i.artist).slice(0, 10),
    [rankedArtistsWithScore]
  );
  const rankedAlbums = useMemo(
    () => rankedAlbumsWithScore.map((i) => i.album).slice(0, 10),
    [rankedAlbumsWithScore]
  );

  const selectedArtist =
    rankedArtists.find(
      (artist: SearchArtistResult) => artist.id === selectedArtistId
    ) ?? null;

  // Selected artist queries
  const { data: artistSongsData, isLoading: isArtistSongsLoading } = useQuery({
    queryKey: ['artist-songs', selectedArtist?.id],
    queryFn: () =>
      selectedArtist
        ? MusicApiService.getArtistSongs(selectedArtist.id)
        : Promise.resolve({ songs: [] }),
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

  const selectedArtistSongsFromQuery = useMemo(() => {
    if (!selectedArtist?.title) return [] as Song[];
    return songs.filter((song: Song) =>
      SearchHelper.isArtistMatch(song, selectedArtist.title)
    );
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
    topResults,
  };
}
