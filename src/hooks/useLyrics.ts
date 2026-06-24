'use client';

import { useState, useEffect, useRef } from 'react';
import { parseLRC, LrcLine, addInstrumentalPlaceholders, parseYRC, estimateLineDurations } from '@/lib/utils/lrcParser';
import { Song } from '@/types/music';

// ── In-memory cache & dedup ──────────────────────────────────────
interface CachedLyrics {
  lines: LrcLine[];
  isSynced: boolean;
}

const lyricsCache = new Map<string, CachedLyrics>();
// Track inflight requests to avoid duplicate fetches from multiple components
const inflightRequests = new Map<string, Promise<CachedLyrics | null>>();

export function useLyrics(currentTrack: Song | null, actualDuration: number = 0) {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Stabilize the dependency — only react when the actual track ID changes
  const trackId = currentTrack?.id ?? null;
  const trackRef = useRef(currentTrack);
  trackRef.current = currentTrack;

  // We need actual audio duration to match the correct LRC from LRClib,
  // avoiding the drift caused by using metadata duration (which often differs).
  const stabilizedDuration = Math.round(actualDuration);

  useEffect(() => {
    // Clear old lyrics immediately when track changes to prevent stale state bugs
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

    // Wait until the audio engine has loaded the track and knows its real duration
    if (stabilizedDuration === 0) {
      setIsLoading(true);
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
            const albumName = track.album?.name ?? '';
            const params = new URLSearchParams({
              title: track.name,
              artist: artistName,
              duration: stabilizedDuration.toString(),
              t: Date.now().toString(),
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
              } catch (e: unknown) {
                // Ignore network errors and retry
              }
              attempt++;
              if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
            }

            if (!res || !res.ok) return null;

            const data: { lyrics?: string; synced?: boolean; type?: string; source?: string } = await res.json();

            if (data.lyrics) {
              if (data.synced) {
                let parsedLines: LrcLine[];
                if (data.type === 'yrc') {
                  // Netease YRC: true word-level karaoke (real per-word timestamps)
                  parsedLines = parseYRC(data.lyrics);
                } else {
                  // All LRC sources (Netease, LRClib): line-by-line sync only
                  // No estimated karaoke — estimated word timings are inaccurate
                  parsedLines = parseLRC(data.lyrics);
                }
                const lyricsType = (data.type === 'yrc' ? 'yrc' : 'lrc') as 'yrc' | 'lrc';
                const withPlaceholders = addInstrumentalPlaceholders(parsedLines, lyricsType);
                return { lines: withPlaceholders, isSynced: true };
              } else {
                const splitLines = data.lyrics.split('\n').map((text, i) => ({
                  time: i * 5, // Arbitrary time spacing for unsynced
                  text: text.trim(),
                  isPlaceholder: false
                })).filter((l: any) => l.text !== '');
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
  }, [trackId, stabilizedDuration]);

  return { lines, isLoading, isSynced };
}
