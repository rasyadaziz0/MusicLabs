'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { parseLRC, LrcLine } from '@/lib/utils/lrcParser';
import { getSongLyrics } from '@/lib/api/musicApi';

export function useLyrics(trackId: string | null, currentTime: number) {
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!trackId) {
      setLines([]);
      return;
    }

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        // 1. Try to fetch LRC from Supabase
        const { data, error } = await supabase
          .from('track_lyrics')
          .select('lyrics_lrc')
          .eq('track_id', trackId)
          .single();

        if (data?.lyrics_lrc) {
          setLines(parseLRC(data.lyrics_lrc));
          setIsSynced(true);
        } else {
          // 2. Fallback: fetch plain lyrics from YouTube Music API
          const lyricsData = await getSongLyrics(trackId);
          if (lyricsData?.lyrics) {
            // Plain text as a single line at time 0
            setLines([{ time: 0, text: lyricsData.lyrics }]);
            setIsSynced(false);
          } else {
            setLines([]);
          }
        }
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setLines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [trackId]);

  useEffect(() => {
    if (lines.length === 0 || !isSynced) return;

    // Binary search for active line
    let lo = 0, hi = lines.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lines[mid].time <= currentTime) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    setActiveIndex(lo);
  }, [currentTime, lines, isSynced]);

  return { lines, activeIndex, isLoading, isSynced };
}
