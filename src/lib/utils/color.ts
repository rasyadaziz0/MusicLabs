
import {
  AppleMusicThemeGenerator,
  ColorConverter,
  ColorQuantizer,
  imageColorExtractor,
  HSL,
  RGB,
} from '@/lib/color';

export * from '@/lib/color';

export const cache = imageColorExtractor.getCache();
export const extract = (imageUrl: string | null | undefined) =>
  imageColorExtractor.extract(imageUrl);
export const getDefaultColors = () => imageColorExtractor.getDefaultColors();

export const getPixels = (canvas: HTMLCanvasElement) =>
  ColorQuantizer.extractPixels(canvas);
export const medianCut = (pixels: RGB[], depth: number) =>
  ColorQuantizer.medianCut(pixels, depth);
export const averageBucket = (bucket: RGB[]) =>
  ColorQuantizer.averageBucket(bucket);

export const rgbToHex = (rgb: RGB) => ColorConverter.rgbToHex(rgb);
export const hexToRgb = (hex: string) => ColorConverter.hexToRgb(hex);
export const getLuma = (rgb: RGB) => ColorConverter.getLuma(rgb);
export const getHue = (rgb: RGB) => ColorConverter.getHue(rgb);
export const boostSaturation = (color: RGB, factor: number) =>
  ColorConverter.boostSaturation(color, factor);
export const rgbToHsl = (rgb: RGB) => ColorConverter.rgbToHsl(rgb);
export const hslToRgb = (hsl: HSL) => ColorConverter.hslToRgb(hsl);

export const getAppleMusicTheme = (primaryHex: string, secondaryHex?: string) =>
  AppleMusicThemeGenerator.generateTheme(primaryHex, secondaryHex);
export const APPLE_MUSIC_PALETTES = AppleMusicThemeGenerator.CURATED_PALETTES;
export const getDeterministicPalette = (seed: string) =>
  AppleMusicThemeGenerator.getDeterministicPalette(seed);
