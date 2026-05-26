'use client';

import { useState, useEffect, useRef } from 'react';
import { LrcLine } from '@/lib/utils/lrcParser';

/**
 * Hook that fetches romanization for non-Latin lyrics lines via Gemini AI.
 * Returns a Map of line-index → romanized text.
 * Caches results per trackId to avoid redundant API calls.
 */

// In-memory cache per track
const romanizationCache = new Map<string, Map<number, string>>();

function hasNonLatinChars(text: string): boolean {
  // Exclude \u3000-\u303F (CJK punctuation and spaces) to avoid false positives on English songs
  return /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u1100-\u11FF]/.test(text);
}

export function useRomanization(
  lines: LrcLine[],
  trackId: string | null
): Map<number, string> {
  const [romanizations, setRomanizations] = useState<Map<number, string>>(
    new Map()
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!trackId || lines.length === 0) {
      setRomanizations(new Map());
      return;
    }

    // Check cache first
    if (romanizationCache.has(trackId)) {
      setRomanizations(romanizationCache.get(trackId)!);
      return;
    }

    // Check if any lines need romanization
    const needsRomanization = lines.some(
      (l) => !l.isPlaceholder && l.text !== '...' && hasNonLatinChars(l.text)
    );

    if (!needsRomanization) {
      const empty = new Map<number, string>();
      romanizationCache.set(trackId, empty);
      setRomanizations(empty);
      return;
    }

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchRomanization = async () => {
      try {
        const lineTexts = lines.map((l) => l.text);

        const res = await fetch('/api/romanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines: lineTexts, trackId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn('Romanization API returned', res.status);
          return;
        }

        const data = await res.json();
        const map = new Map<number, string>();

        if (data.romanizations) {
          for (const [key, value] of Object.entries(data.romanizations)) {
            map.set(Number(key), value as string);
          }
        }

        romanizationCache.set(trackId, map);
        setRomanizations(map);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Failed to fetch romanization:', err);
      }
    };

    fetchRomanization();

    return () => {
      controller.abort();
    };
  }, [lines, trackId]);

  return romanizations;
}
