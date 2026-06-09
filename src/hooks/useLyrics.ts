'use client';

import { useState, useEffect, useRef } from 'react';
import { parseLRC, LrcLine, addInstrumentalPlaceholders, addWordTimings } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';
import { supabase } from '@/lib/supabase/client';

// ── In-memory cache & dedup ──────────────────────────────────────
interface CachedLyrics {
  lines: LrcLine[];
  isSynced: boolean;
}

const lyricsCache = new Map<string, CachedLyrics>();
// Track inflight requests to avoid duplicate fetches from multiple components
const inflightRequests = new Map<string, Promise<CachedLyrics | null>>();

export function useLyrics(currentTrack: Song | null) {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Stabilize the dependency — only react when the actual track ID changes
  const trackId = currentTrack?.id ?? null;
  const trackRef = useRef(currentTrack);
  trackRef.current = currentTrack;

  useEffect(() => {
    // Clear old lyrics immediately when track changes to prevent stale state bugs
    // such as Romanization triggering for the new track using the old track's lyrics.
    setLines([]);
    setIsSynced(false);

    if (!trackId || !trackRef.current) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = lyricsCache.get(trackId);
    if (cached) {
      setLines(cached.lines);
      setIsSynced(cached.isSynced);
      setIsLoading(false);
      return;
    }

    const track = trackRef.current;
    const artistName = track.artists.primary[0]?.name ?? '';
    if (!track.name || !artistName) {
      setLines([]);
      setIsSynced(false);
      setIsLoading(false);
      return;
    }

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        // Dedup: if another component already started this fetch, reuse its promise
        let requestPromise = inflightRequests.get(trackId);

        if (!requestPromise) {
          requestPromise = (async (): Promise<CachedLyrics | null> => {
            const durationInSeconds = track.duration ? Math.floor(track.duration) : 0;
            const albumName = track.album?.name ?? '';
            const params = new URLSearchParams({
              title: track.name,
              artist: artistName,
              duration: durationInSeconds.toString(),
            });
            if (albumName) {
              params.append('album', albumName);
            }

            let res: Response | null = null;
            let attempt = 0;
            while (attempt < 3) {
              try {
                res = await fetch(`/api/lyrics?${params.toString()}`);
                if (res.ok || res.status === 404) break;
              } catch (e: any) {
                // Ignore network errors and retry
              }
              attempt++;
              if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
            }

            if (!res || !res.ok) return null;

            const data: { lyrics?: string; synced?: boolean } = await res.json();

            if (data.lyrics) {
              if (data.synced) {
                const parsedLines = parseLRC(data.lyrics);
                const withPlaceholders = addInstrumentalPlaceholders(parsedLines);
                return { lines: addWordTimings(withPlaceholders), isSynced: true };
              } else {
                const splitLines = data.lyrics.split('\n').map((text, i) => ({
                  time: i * 5, // Arbitrary time spacing for unsynced
                  text: text.trim(),
                  isPlaceholder: false,
                  words: []
                })).filter(l => l.text !== '');
                return { lines: splitLines, isSynced: false };
              }
            }

            return { lines: [], isSynced: false };
          })();

          inflightRequests.set(trackId, requestPromise);
        }

        const result = await requestPromise;

        // Only update state if we're still looking at the same track
        if (trackId !== trackRef.current?.id) return;

        if (result) {
          lyricsCache.set(trackId, result);
          setLines(result.lines);
          setIsSynced(result.isSynced);
        } else {
          setLines([]);
          setIsSynced(false);
        }
      } catch (err) {
        console.error('Gagal ambil lirik:', err);
        setLines([]);
        setIsSynced(false);
      } finally {
        inflightRequests.delete(trackId);
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [trackId]);

  return { lines, isLoading, isSynced };
}
