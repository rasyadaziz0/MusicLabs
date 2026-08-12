'use client';

import { extract, getDefaultColors } from '@/lib/utils/color';
import { DominantColors, UseDominantColorsResult } from '@/types/hooks/colors';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDominantColors(
  imageUrl: string | null | undefined,
  trackId?: string | null | undefined
): UseDominantColorsResult {
  const [current, setCurrent] = useState<DominantColors | null>(null);
  const [previous, setPrevious] = useState<DominantColors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingUrlRef = useRef<string | null>(null);
  const trackIdRef = useRef<string | null>(null);

  const extractColors = useCallback(async (url: string, currentTrackId: string | null) => {
    setIsLoading(true);
    loadingUrlRef.current = url;
    trackIdRef.current = currentTrackId;

    try {
      const result = await extract(url);
      
      // If the request is stale, ignore it
      if (loadingUrlRef.current !== url || trackIdRef.current !== currentTrackId) return;
      
      setCurrent((prev) => {
        if (prev !== null) {
          setPrevious(prev);
        }
        return result;
      });
    } catch (err) {
      if (loadingUrlRef.current === url && trackIdRef.current === currentTrackId) {
        const fallback = getDefaultColors();
        setCurrent((prev) => {
          if (prev !== null) {
            setPrevious(prev);
          }
          return fallback;
        });
      }
    } finally {
      if (loadingUrlRef.current === url && trackIdRef.current === currentTrackId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      // Don't update previous when clearing to null so transition doesn't jump
      setCurrent(null);
      setIsLoading(false);
      return;
    }

    extractColors(imageUrl, trackId || null);
  }, [imageUrl, trackId, extractColors]);

  return { current, previous, isLoading };
}
