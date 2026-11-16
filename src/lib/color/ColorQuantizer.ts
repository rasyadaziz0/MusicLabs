import { RGB } from './types';

export class ColorQuantizer {

  static extractPixels(canvas: HTMLCanvasElement): RGB[] {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const pixels: RGB[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];

      if (a < 128) continue;
      if (r + g + b < 30) continue;
      if (r > 240 && g > 240 && b > 240) continue;

      pixels.push({ r, g, b });
    }
    return pixels;
  }

  static medianCut(pixels: RGB[], depth: number): RGB[][] {
    if (depth === 0 || pixels.length === 0) return [pixels];

    let rMin = 255,
      rMax = 0,
      gMin = 255,
      gMax = 0,
      bMin = 255,
      bMax = 0;
    for (const p of pixels) {
      if (p.r < rMin) rMin = p.r;
      if (p.r > rMax) rMax = p.r;
      if (p.g < gMin) gMin = p.g;
      if (p.g > gMax) gMax = p.g;
      if (p.b < bMin) bMin = p.b;
      if (p.b > bMax) bMax = p.b;
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
      ...ColorQuantizer.medianCut(pixels.slice(0, mid), depth - 1),
      ...ColorQuantizer.medianCut(pixels.slice(mid), depth - 1),
    ];
  }

  static averageBucket(bucket: RGB[]): RGB {
    if (bucket.length === 0) return { r: 80, g: 60, b: 120 };
    let r = 0,
      g = 0,
      b = 0;
    for (const p of bucket) {
      r += p.r;
      g += p.g;
      b += p.b;
    }
    const n = bucket.length;
    return {
      r: Math.round(r / n),
      g: Math.round(g / n),
      b: Math.round(b / n),
    };
  }
}
