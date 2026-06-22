'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface DominantColors {
  /** 4 dominant colors in hex, ordered: vibrant, secondary, muted, background */
  colors: [string, string, string, string];
  /** Average luminance 0-1 (0 = dark, 1 = bright) for adaptive overlay */
  luminance: number;
}

export interface UseDominantColorsResult {
  current: DominantColors | null;
  previous: DominantColors | null;
  isLoading: boolean;
}

// ── LRU Cache ──────────────────────────────────────────────────────────────

const MAX_CACHE = 64;

class LRUColorCache {
  private map = new Map<string, DominantColors>();

  get(key: string): DominantColors | undefined {
    const val = this.map.get(key);
    if (val) {
      // Move to end (most recent)
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: string, val: DominantColors): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    // Evict oldest
    if (this.map.size > MAX_CACHE) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}

const colorCache = new LRUColorCache();

// ── Median-Cut Quantization ────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }

function getPixels(canvas: HTMLCanvasElement): RGB[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const pixels: RGB[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    // Skip near-transparent, near-black, and near-white pixels
    if (a < 128) continue;
    if (r + g + b < 30) continue;    // too dark
    if (r > 240 && g > 240 && b > 240) continue; // too white
    pixels.push({ r, g, b });
  }
  return pixels;
}

function medianCut(pixels: RGB[], depth: number): RGB[][] {
  if (depth === 0 || pixels.length === 0) return [pixels];

  // Find the channel with the widest range
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r; if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g; if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b; if (p.b > bMax) bMax = p.b;
  }

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  let channel: 'r' | 'g' | 'b';
  if (rRange >= gRange && rRange >= bRange) channel = 'r';
  else if (gRange >= bRange) channel = 'g';
  else channel = 'b';

  // Sort by widest channel and split at median
  pixels.sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(pixels.length / 2);

  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

function averageBucket(bucket: RGB[]): RGB {
  if (bucket.length === 0) return { r: 80, g: 60, b: 120 };
  let r = 0, g = 0, b = 0;
  for (const p of bucket) { r += p.r; g += p.g; b += p.b; }
  const n = bucket.length;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/** Boost saturation in HSL space */
function boostSaturation(color: RGB, factor: number): RGB {
  let { r, g, b } = color;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Boost saturation
  const newS = Math.min(1, s * factor);

  // HSL → RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (newS === 0) {
    return { r: Math.round(l * 255), g: Math.round(l * 255), b: Math.round(l * 255) };
  }
  const q = l < 0.5 ? l * (1 + newS) : l + newS - l * newS;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Relative luminance per WCAG (0 = black, 1 = white) */
function relativeLuminance({ r, g, b }: RGB): number {
  const srgb = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// ── Core extraction function ───────────────────────────────────────────────

async function extractColors(imageUrl: string): Promise<DominantColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Draw to small canvas for performance
        const canvas = document.createElement('canvas');
        const size = 64; // 64×64 → 4096 pixels — fast, enough detail for median-cut
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { reject(new Error('No 2d context')); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const pixels = getPixels(canvas);

        if (pixels.length < 10) {
          // Mostly transparent/mono image — use defaults
          resolve({
            colors: ['#6B4E9B', '#3A2F6E', '#8B6DBF', '#1A1430'],
            luminance: 0.15,
          });
          return;
        }

        // Median-cut into 16 buckets (depth 4) to ensure we find accents, not just the background
        const buckets = medianCut([...pixels], 4); 
        const rawColors = buckets
          .filter(b => b.length > 0)
          .map(b => ({ color: averageBucket(b), count: b.length }))
          .sort((a, b) => b.count - a.count); // Most populated first

        // Pick 4 DIVERSE colors. If they are too similar, skip.
        const diverseColors: { color: RGB; count: number }[] = [];
        for (const rc of rawColors) {
          let isDistinct = true;
          for (const dc of diverseColors) {
            // Calculate color distance (Euclidean in RGB)
            const dist = Math.sqrt(
              Math.pow(rc.color.r - dc.color.r, 2) +
              Math.pow(rc.color.g - dc.color.g, 2) +
              Math.pow(rc.color.b - dc.color.b, 2)
            );
            // If it's too similar to an already picked color, skip it
            if (dist < 45) {
              isDistinct = false;
              break;
            }
          }
          if (isDistinct || diverseColors.length === 0) {
            diverseColors.push(rc);
            if (diverseColors.length >= 4) break;
          }
        }

        // If we didn't find 4 distinct colors, just pad with the remaining raw colors
        for (const rc of rawColors) {
          if (diverseColors.length >= 4) break;
          if (!diverseColors.includes(rc)) diverseColors.push(rc);
        }

        // Boost saturation for vibrancy
        const selected = diverseColors.slice(0, 4).map(c => boostSaturation(c.color, 1.4));

        // Pad if still less than 4
        while (selected.length < 4) {
          selected.push({ r: 40, g: 30, b: 70 });
        }

        // Calculate overall luminance from the originally most populated colors (not just the diverse ones)
        const avgLum = rawColors.slice(0, 4).reduce(
          (sum, c) => sum + relativeLuminance(c.color) * c.count, 0
        ) / rawColors.slice(0, 4).reduce((sum, c) => sum + c.count, 0);

        resolve({
          colors: selected.map(rgbToHex) as [string, string, string, string],
          luminance: avgLum,
        });
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error('Image load failed'));

    // Use a smaller version for color extraction (100x100 is fine)
    // mzstatic URLs allow changing size: 600x600bb → 100x100bb
    const smallUrl = imageUrl.replace(/\d+x\d+bb/, '100x100bb');
    img.src = smallUrl || imageUrl;
  });
}

// ── Default colors (deep purple) ───────────────────────────────────────────

const DEFAULT_COLORS: DominantColors = {
  colors: ['#6B4E9B', '#3A2F6E', '#8B6DBF', '#1A1430'],
  luminance: 0.15,
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDominantColors(
  coverUrl: string | null | undefined,
  trackId: string | null | undefined,
): UseDominantColorsResult {
  const [current, setCurrent] = useState<DominantColors | null>(null);
  const [previous, setPrevious] = useState<DominantColors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastTrackIdRef = useRef<string | null>(null);

  const extract = useCallback(async (url: string, id: string) => {
    // Check cache first
    const cached = colorCache.get(id);
    if (cached) {
      setCurrent(prev => {
        setPrevious(prev);
        return cached;
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await extractColors(url);
      colorCache.set(id, result);
      setCurrent(prev => {
        setPrevious(prev);
        return result;
      });
    } catch {
      // Fallback: use default colors, don't cache failures
      setCurrent(prev => {
        setPrevious(prev);
        return DEFAULT_COLORS;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coverUrl || !trackId) return;
    if (trackId === lastTrackIdRef.current) return; // Same track, no re-extract
    lastTrackIdRef.current = trackId;
    extract(coverUrl, trackId);
  }, [coverUrl, trackId, extract]);

  return { current, previous, isLoading };
}
