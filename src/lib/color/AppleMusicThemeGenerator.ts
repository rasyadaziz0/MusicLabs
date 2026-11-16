import { ColorConverter } from './ColorConverter';
import { AppleMusicPalette, AppleMusicThemeColors } from './types';


export class AppleMusicThemeGenerator {
  static readonly CURATED_PALETTES: AppleMusicPalette[] = [
    {
      name: 'Magenta Dream', // Matches Photo 1 ("kepo ah")
      primary: '#E02980',
      secondary: '#8E24AA',
      tertiary: '#F472B6',
    },
    {
      name: 'Ocean Cyan', // Matches Photo 2 ("Ngaso")
      primary: '#0EA5E9',
      secondary: '#0D9488',
      tertiary: '#38BDF8',
    },
    {
      name: 'Electric Violet',
      primary: '#7C3AED',
      secondary: '#4F46E5',
      tertiary: '#A855F7',
    },
    {
      name: 'Sunset Coral',
      primary: '#F97316',
      secondary: '#E11D48',
      tertiary: '#FB923C',
    },
    {
      name: 'Emerald Aurora',
      primary: '#059669',
      secondary: '#0284C7',
      tertiary: '#34D399',
    },
    {
      name: 'Ruby Passion',
      primary: '#E11D48',
      secondary: '#9333EA',
      tertiary: '#FB7185',
    },
    {
      name: 'Midnight Cobalt',
      primary: '#2563EB',
      secondary: '#7C3AED',
      tertiary: '#60A5FA',
    },
    {
      name: 'Amber Gold',
      primary: '#D97706',
      secondary: '#DC2626',
      tertiary: '#FBBF24',
    },
  ];

  static getDeterministicPalette(seed: string): AppleMusicPalette {
    if (!seed) return AppleMusicThemeGenerator.CURATED_PALETTES[0];

    const normalized = seed.toLowerCase().trim();
    if (normalized.includes('kepo')) return AppleMusicThemeGenerator.CURATED_PALETTES[0]; // Magenta
    if (normalized.includes('ngaso')) return AppleMusicThemeGenerator.CURATED_PALETTES[1]; // Cyan

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % AppleMusicThemeGenerator.CURATED_PALETTES.length;
    return AppleMusicThemeGenerator.CURATED_PALETTES[index];
  }

  static generateTheme(primaryHex: string, secondaryHex?: string): AppleMusicThemeColors {
    const pRgb = ColorConverter.hexToRgb(primaryHex);
    const pHsl = ColorConverter.rgbToHsl(pRgb);

    const sRgb = secondaryHex ? ColorConverter.hexToRgb(secondaryHex) : null;
    const sHsl = sRgb
      ? ColorConverter.rgbToHsl(sRgb)
      : { h: (pHsl.h + 30) % 360, s: pHsl.s, l: pHsl.l };

    const isGrayscale = pHsl.s < 0.12;
    const bgSaturation = isGrayscale ? pHsl.s : Math.max(0.35, Math.min(pHsl.s, 0.6));
    const bgLightness = 0.098;
    const baseBgRgb = ColorConverter.hslToRgb({
      h: pHsl.h,
      s: bgSaturation,
      l: bgLightness,
    });
    const baseBg = ColorConverter.rgbToHex(baseBgRgb);

    const glow1Sat = isGrayscale ? 0.1 : Math.max(0.65, Math.min(pHsl.s * 1.1, 0.9));
    const glow1Light = 0.26;
    const glow1Rgb = ColorConverter.hslToRgb({
      h: pHsl.h,
      s: glow1Sat,
      l: glow1Light,
    });
    const glowPrimary = `rgba(${glow1Rgb.r}, ${glow1Rgb.g}, ${glow1Rgb.b}, 0.42)`;

    const glow2Sat = isGrayscale ? 0.1 : Math.max(0.5, Math.min(sHsl.s, 0.85));
    const glow2Light = 0.2;
    const glow2Rgb = ColorConverter.hslToRgb({
      h: sHsl.h,
      s: glow2Sat,
      l: glow2Light,
    });
    const glowSecondary = `rgba(${glow2Rgb.r}, ${glow2Rgb.g}, ${glow2Rgb.b}, 0.28)`;

    return {
      baseBg,
      glowPrimary,
      glowSecondary,
      accent: primaryHex,
    };
  }

  static generateThemeFromPalette(palette: AppleMusicPalette): AppleMusicThemeColors {
    return AppleMusicThemeGenerator.generateTheme(palette.primary, palette.secondary);
  }
}
