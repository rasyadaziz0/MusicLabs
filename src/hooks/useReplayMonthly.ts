'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { getMonthlyTopTracks } from '@/lib/supabase/music';
import { getSongsByIds } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { useAuth } from '@/context/AuthContext';

export interface ReplayArtist {
  id: string;
  name: string;
  imageUrl: string | undefined;
  trackCount: number;
}

export interface ReplayStats {
  totalTracks: number;
  estimatedMinutes: number;
  uniqueArtists: number;
}

export interface ReplayData {
  topTracks: Song[];
  topArtists: ReplayArtist[];
  stats: ReplayStats;
}

async function fetchReplayData(
  userId: string,
  year: number,
  month: number,
): Promise<ReplayData> {
  // 1. Fetch aggregated track stats from RPC
  const { topTracks: rows, totals } = await getMonthlyTopTracks(userId, year, month);

  if (rows.length === 0) {
    return {
      topTracks: [],
      topArtists: [],
      stats: { totalTracks: 0, estimatedMinutes: 0, uniqueArtists: 0 },
    };
  }

  // 2. Fetch Song metadata from Music API
  const trackIds = rows.map((r) => r.track_id);
  const songs = await getSongsByIds(trackIds);
  const songMap = new Map(songs.map((s) => [s.id, s]));

  // 3. Top tracks — keep in RPC order (play count desc)
  const validTracks = trackIds
    .map((id) => songMap.get(id))
    .filter(Boolean) as Song[];

  const topTracks = validTracks.length > 0
    ? Array.from({ length: Math.max(20, validTracks.length) }, (_, i) => validTracks[i % validTracks.length]).slice(0, 30)
    : [];

  // 4. Aggregate artists using the exact counts from the DB
  const artistCounts = new Map<
    string,
    { id: string; name: string; imageUrl: string | undefined; count: number }
  >();

  for (const row of rows) {
    const song = songMap.get(row.track_id);
    if (!song) continue;

    const primaryArtist = song.artists?.primary?.[0];
    if (!primaryArtist) continue;

    const existing = artistCounts.get(primaryArtist.name);
    const imgUrl =
      primaryArtist.image?.[primaryArtist.image.length - 1]?.url ?? undefined;

    if (existing) {
      existing.count += Number(row.play_count);
      if (!existing.imageUrl && imgUrl) existing.imageUrl = imgUrl;
    } else {
      artistCounts.set(primaryArtist.name, {
        id: primaryArtist.id,
        name: primaryArtist.name,
        imageUrl: imgUrl,
        count: Number(row.play_count),
      });
    }
  }

  const topArtists: ReplayArtist[] = Array.from(artistCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl, trackCount: a.count }));

  // 5. Stats
  // Since we only fetched top 50, estimating minutes using total_plays and avg duration of top 50
  const totalTop50Duration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgDuration = songs.length > 0 ? totalTop50Duration / songs.length : 0;
  const estimatedSeconds = totals.total_plays * avgDuration;

  return {
    topTracks,
    topArtists,
    stats: {
      totalTracks: Number(totals.unique_tracks),
      estimatedMinutes: Math.round(estimatedSeconds / 60),
      uniqueArtists: artistCounts.size, // this is unique artists in top 50, which is a good proxy
    },
  };
}

export function useReplayMonthly() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const canGoNext = useMemo(() => {
    const current = new Date();
    return year < current.getFullYear() || month < current.getMonth();
  }, [year, month]);

  const goToPrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    if (!canGoNext) return;
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, [canGoNext]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['replay-monthly', user?.id, year, month],
    queryFn: () => fetchReplayData(user!.id, year, month),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const monthLabel = useMemo(() => {
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [year, month]);

  return {
    year,
    month,
    setYear,
    setMonth,
    monthLabel,
    canGoNext,
    goToPrevMonth,
    goToNextMonth,
    topTracks: data?.topTracks ?? [],
    topArtists: data?.topArtists ?? [],
    stats: data?.stats ?? { totalTracks: 0, estimatedMinutes: 0, uniqueArtists: 0 },
    hasData: (data?.topTracks.length ?? 0) > 0,
    isLoading,
    error,
  };
}
