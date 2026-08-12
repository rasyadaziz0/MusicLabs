import { DominantColors, RGB } from '@/types/hooks/colors';

const MAX_CACHE = 64;

class LRUColorCache {
  private map = new Map<string, DominantColors>();

  get(key: string): DominantColors | undefined {
    const val = this.map.get(key);
    if (val) {
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: string, val: DominantColors): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    if (this.map.size > MAX_CACHE) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}
export let cache = new LRUColorCache();

export async function extract(imageUrl: string | null | undefined): Promise<DominantColors> {
    if (!imageUrl) {
      return getDefaultColors();
    }

    const cached = cache.get(imageUrl);
    if (cached) return cached;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 64; 
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { reject(new Error('No 2d context')); return; }

          ctx.drawImage(img, 0, 0, size, size);
          const pixels = getPixels(canvas);

          if (pixels.length < 10) {
            resolve(getDefaultColors());
            return;
          }

          const buckets = medianCut(pixels, 3);
          let palette = buckets.map(b => averageBucket(b));
          palette = palette.map(p => boostSaturation(p, 1.3));

          palette.sort((a, b) => {
            const hA = getHue(a);
            const hB = getHue(b);
            const dH = Math.min(Math.abs(hA - hB), 360 - Math.abs(hA - hB));
            if (dH < 20) {
              return getLuma(b) - getLuma(a); 
            }
            return hB - hA; 
          });

          if (palette.length < 4) {
            const extra = getDefaultColors().colors.slice(palette.length);
            palette = [...palette, ...extra.map(c => hexToRgb(c))];
          }

          const primary = palette[0];
          const luma = getLuma(primary);

          const result: DominantColors = {
            colors: palette.slice(0, 4).map(c => rgbToHex(c)) as [string, string, string, string],
            luminance: luma,
          };

          cache.set(imageUrl, result);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        const fallback = getDefaultColors();
        cache.set(imageUrl, fallback);
        resolve(fallback);
      };

      img.src = imageUrl;
    });
  }

export function getDefaultColors(): DominantColors {
    return {
      colors: ['#6B4E9B', '#3A2F6E', '#8B6DBF', '#1A1430'],
      luminance: 0.15,
    };
  }

export function getPixels(canvas: HTMLCanvasElement): RGB[] {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const pixels: RGB[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      if (r + g + b < 30) continue;    
      if (r > 240 && g > 240 && b > 240) continue; 
      pixels.push({ r, g, b });
    }
    return pixels;
  }

export function medianCut(pixels: RGB[], depth: number): RGB[][] {
    if (depth === 0 || pixels.length === 0) return [pixels];

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

    pixels.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(pixels.length / 2);

    return [
      ...medianCut(pixels.slice(0, mid), depth - 1),
      ...medianCut(pixels.slice(mid), depth - 1),
    ];
  }

export function averageBucket(bucket: RGB[]): RGB {
    if (bucket.length === 0) return { r: 80, g: 60, b: 120 };
    let r = 0, g = 0, b = 0;
    for (const p of bucket) { r += p.r; g += p.g; b += p.b; }
    const n = bucket.length;
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  }

export function boostSaturation(color: RGB, factor: number): RGB {
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

    const newS = Math.min(1, s * factor);

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

export function rgbToHex({ r, g, b }: RGB): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

export function hexToRgb(hex: string): RGB {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return { r, g, b };
  }

export function getLuma({ r, g, b }: RGB): number {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

export function getHue({ r, g, b }: RGB): number {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max === min) return 0;
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
    return Math.round(h * 360);
  }
