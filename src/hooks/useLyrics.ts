'use client';

import { CachedLyrics } from '@/types/hooks/lyrics';
import { Song } from '@/types/music';
import { LrcLine } from '@/types/utils/lrc';
import { useEffect, useRef, useState } from 'react';
import * as LrcHelper from '../lib/lyrics/lrc';

// ── In-memory cache & dedup ──────────────────────────────────────


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

  const stabilizedDuration = Math.round(actualDuration);

  useEffect(() => {
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
        let requestPromise = inflightRequests.get(trackId);

        if (!requestPromise) {
          requestPromise = (async (): Promise<CachedLyrics | null> => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            
            // 1. Try fetch LRC from Supabase
            const { data } = await supabase
              .from('track_lyrics')
              .select('lyrics_lrc')
              .eq('track_id', trackId)
              .maybeSingle();

            if (data?.lyrics_lrc) {
              const parsedLines = LrcHelper.parseLRC(data.lyrics_lrc);
              const withPlaceholders = LrcHelper.addInstrumentalPlaceholders(parsedLines, 'lrc');
              return { lines: withPlaceholders, isSynced: true };
            }

            // 2. Fallback: fetch plain or LRC lyrics from our backend /api/lyrics proxy
            const { MusicApiService } = await import('@/lib/api/MusicApiService');
            const track = trackRef.current;
            if (!track) return { lines: [], isSynced: false };

            const lyricsData = await MusicApiService.getSongLyrics(track);
            
            if (lyricsData?.lyrics) {
              if (lyricsData.synced || lyricsData.type === 'lrc' || lyricsData.type === 'yrc') {
                const isYrc = lyricsData.type === 'yrc';
                const parsedLines = isYrc 
                  ? LrcHelper.parseYRC(lyricsData.lyrics) 
                  : LrcHelper.parseLRC(lyricsData.lyrics);
                const withPlaceholders = LrcHelper.addInstrumentalPlaceholders(parsedLines, isYrc ? 'yrc' : 'lrc');
                return { lines: withPlaceholders, isSynced: true };
              }

              const splitLines = lyricsData.lyrics.split('\n').map((text, i) => ({
                time: i * 5, // Arbitrary time spacing for unsynced
                text: text.trim(),
                isPlaceholder: false
              })).filter((l: any) => l.text !== '');
              return { lines: splitLines, isSynced: false };
            }

            return { lines: [], isSynced: false };
          })();

          inflightRequests.set(trackId, requestPromise);
        }

        const result = await requestPromise;

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
        if (trackId === trackRef.current?.id) setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [trackId, stabilizedDuration]);

  return { lines, isLoading, isSynced };
}
