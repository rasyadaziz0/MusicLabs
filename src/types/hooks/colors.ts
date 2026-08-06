export interface DominantColors {
  /** 4 dominant colors in hex, ordered: vibrant, secondary, muted, background */
  colors: [string, string, string, string];
  /** Average luminance 0-1 (0 = dark, 1 = bright) for adaptive overlay */
  luminance: number;
}

export interface UseDominantColorsResult {
  current: DominantColors | null;
  previous: DominantColors | null;
  /** Indicates if colors are still being computed/loading */
  isLoading: boolean;
}


export interface RGB { r: number; g: number; b: number; }

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