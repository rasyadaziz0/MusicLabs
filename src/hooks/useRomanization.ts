'use client';

import { useState, useEffect, useRef } from 'react';
import { LrcLine } from '@/lib/utils/lrcParser';
import { useSettings } from '@/context/SettingsContext';

// In-memory cache per track
const romanizationCache = new Map<string, Map<number, string>>();

/** Detects non-Latin scripts: CJK, Korean, Japanese, Arabic, Devanagari, Thai, Cyrillic, etc. */
function hasNonLatinChars(text: string): boolean {
  return /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u1100-\u11FF]/.test(text);
}

function isLikelyLatinScript(text: string): boolean {
  const stripped = text.replace(/[\s\d\p{P}\p{S}]/gu, ''); // Remove spaces, digits, punctuation, symbols
  if (stripped.length === 0) return true;
  const latinChars = (stripped.match(/[\p{Script=Latin}]/gu) || []).length;
  return latinChars / stripped.length > 0.9; // >90% Latin = definitely a Latin-based language
}

export function useRomanization(
  lines: LrcLine[],
  trackId: string | null
): Map<number, string> {
  const { settings } = useSettings();
  const [romanizations, setRomanizations] = useState<Map<number, string>>(
    new Map()
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // If romanization is disabled in settings, return empty
    if (!settings.romanizationEnabled) {
      setRomanizations(new Map());
      return;
    }

    if (!trackId || lines.length === 0) {
      setRomanizations(new Map());
      return;
    }

    // Check cache first
    if (romanizationCache.has(trackId)) {
      setRomanizations(romanizationCache.get(trackId)!);
      return;
    }

    // Count how many real (non-placeholder) lines contain non-Latin characters
    const realLines = lines.filter(l => !l.isPlaceholder && l.text.trim().length > 0);
    const nonLatinLines = realLines.filter(l => hasNonLatinChars(l.text) && !isLikelyLatinScript(l.text));

    // Trigger romanization if at least 2 lines have non-Latin text and >=10% of total
    // Low threshold because even a few Korean/Japanese lines deserve romanization
    const nonLatinRatio = realLines.length > 0 ? nonLatinLines.length / realLines.length : 0;
    const needsRomanization = nonLatinLines.length >= 2 && nonLatinRatio >= 0.1;

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

        let res: Response | null = null;
        let attempt = 0;
        while (attempt < 3) {
          try {
            res = await fetch('/api/romanize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lines: lineTexts, trackId }),
              signal: controller.signal,
            });
            if (res.ok) break;
          } catch (e: unknown) {
            if (e instanceof DOMException && e.name === 'AbortError') throw e;
          }
          attempt++;
          if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
        }

        if (!res || !res.ok) {
          console.warn('Romanization API returned', res?.status || 'Network Error');
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
  }, [lines, trackId, settings.romanizationEnabled]);

  return romanizations;
}
