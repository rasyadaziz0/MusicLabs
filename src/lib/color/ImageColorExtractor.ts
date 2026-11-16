import { LRUColorCache } from './ColorCache';
import { ColorConverter } from './ColorConverter';
import { ColorQuantizer } from './ColorQuantizer';
import { DominantColors } from './types';

export class ImageColorExtractor {
  private cache: LRUColorCache;

  constructor(cache?: LRUColorCache) {
    this.cache = cache || new LRUColorCache(64);
  }

  getDefaultColors(): DominantColors {
    return {
      colors: ['#6B4E9B', '#3A2F6E', '#8B6DBF', '#1A1430'],
      luminance: 0.15,
    };
  }

  async extract(imageUrl: string | null | undefined): Promise<DominantColors> {
    if (!imageUrl) {
      return this.getDefaultColors();
    }

    const cached = this.cache.get(imageUrl);
    if (cached) return cached;

    return new Promise((resolve) => {
      // In SSR or environments without Image, return default
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve(this.getDefaultColors());
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 64;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(this.getDefaultColors());
            return;
          }

          ctx.drawImage(img, 0, 0, size, size);
          const pixels = ColorQuantizer.extractPixels(canvas);

          if (pixels.length < 10) {
            resolve(this.getDefaultColors());
            return;
          }

          const buckets = ColorQuantizer.medianCut(pixels, 3);
          let palette = buckets.map((b) => ColorQuantizer.averageBucket(b));
          palette = palette.map((p) => ColorConverter.boostSaturation(p, 1.3));

          palette.sort((a, b) => {
            const hA = ColorConverter.getHue(a);
            const hB = ColorConverter.getHue(b);
            const dH = Math.min(Math.abs(hA - hB), 360 - Math.abs(hA - hB));
            if (dH < 20) {
              return ColorConverter.getLuma(b) - ColorConverter.getLuma(a);
            }
            return hB - hA;
          });

          if (palette.length < 4) {
            const extra = this.getDefaultColors().colors.slice(palette.length);
            palette = [...palette, ...extra.map((c) => ColorConverter.hexToRgb(c))];
          }

          const primary = palette[0];
          const luma = ColorConverter.getLuma(primary);

          const result: DominantColors = {
            colors: palette.slice(0, 4).map((c) => ColorConverter.rgbToHex(c)) as [
              string,
              string,
              string,
              string,
            ],
            luminance: luma,
          };

          this.cache.set(imageUrl, result);
          resolve(result);
        } catch {
          const fallback = this.getDefaultColors();
          this.cache.set(imageUrl, fallback);
          resolve(fallback);
        }
      };

      img.onerror = () => {
        const fallback = this.getDefaultColors();
        this.cache.set(imageUrl, fallback);
        resolve(fallback);
      };

      img.src = imageUrl;
    });
  }

  getCache(): LRUColorCache {
    return this.cache;
  }
}

export const imageColorExtractor = new ImageColorExtractor();
