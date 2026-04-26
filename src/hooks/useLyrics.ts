'use client';

import { useState, useEffect } from 'react';
import { parseLRC, LrcLine, addInstrumentalPlaceholders } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';

export function useLyrics(currentTrack: Song | null) {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!currentTrack) {
      setLines([]);
      setIsSynced(false);
      setIsLoading(false);
      return;
    }

    const artistName = currentTrack.artists.primary[0]?.name ?? '';
    const duration = Math.round(currentTrack.duration);
    if (!currentTrack.name || !artistName || !Number.isFinite(duration) || duration <= 0) {
      setLines([]);
      setIsSynced(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/lyrics?track_name=${encodeURIComponent(currentTrack.name)}&artist_name=${encodeURIComponent(artistName)}&duration=${duration}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          setLines([]);
          setIsSynced(false);
          return;
        }

        const data: { lyrics?: string; synced?: boolean } = await res.json();

        if (data.lyrics && data.synced) {
          const parsedLines = parseLRC(data.lyrics);
          setLines(addInstrumentalPlaceholders(parsedLines));
          setIsSynced(true);
        } else {
          setLines([]);
          setIsSynced(false);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Gagal ambil lirik:', err);
        setLines([]);
        setIsSynced(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();

    return () => controller.abort();
  }, [currentTrack]);

  return { lines, isLoading, isSynced };
}
