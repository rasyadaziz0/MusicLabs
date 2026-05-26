'use client';

import { useState, useEffect } from 'react';
import { parseLRC, LrcLine, addInstrumentalPlaceholders, addWordTimings } from '@/lib/utils/lrcParser';
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
    if (!currentTrack.name || !artistName) {
      setLines([]);
      setIsSynced(false);
      setIsLoading(false);
      return;
    }

    const durationInSeconds = currentTrack.duration ? Math.floor(currentTrack.duration) : 0;

    const controller = new AbortController();

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const albumName = currentTrack.album?.name ?? '';
        const params = new URLSearchParams({
          title: currentTrack.name,
          artist: artistName,
          duration: durationInSeconds.toString()
        });
        if (albumName) {
          params.append('album', albumName);
        }

        const res = await fetch(
          `/api/lyrics?${params.toString()}`,
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
          const withPlaceholders = addInstrumentalPlaceholders(parsedLines);
          setLines(addWordTimings(withPlaceholders));
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
