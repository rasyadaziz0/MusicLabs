import { ImageQuality } from '@/types/music';

export class ImageHelper {
  /** Get best cover art image URL. Returns undefined when no valid URL is available. */
  static getBestImageUrl(images: ImageQuality[] | undefined): string | undefined {
    if (!images || images.length === 0) return undefined;

    // First try explicitly looking for 500x500 just in case
    const exact500 = images.find(i => i.quality === '500x500')?.url;
    if (exact500) return exact500;

    // Otherwise, sort by width (assuming quality is format "WxH") and get the largest
    const sorted = [...images].sort((a, b) => {
      const widthA = parseInt(a.quality.split('x')[0]) || 0;
      const widthB = parseInt(b.quality.split('x')[0]) || 0;
      return widthB - widthA; // Descending
    });

    return sorted[0]?.url || undefined;
  }
}
