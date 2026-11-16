import { DominantColors, RGB } from '@/types/hooks/colors';

export type { DominantColors, RGB };

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 1
  l: number; // 0 - 1
}

export interface AppleMusicThemeColors {
  baseBg: string;        // Deep dark tinted background (e.g. '#280B19' or '#0B1F28')
  glowPrimary: string;   // Rich ambient glow for top-left/cover (e.g. 'rgba(217, 30, 110, 0.42)')
  glowSecondary: string; // Complementary ambient glow for top-right (e.g. 'rgba(138, 35, 135, 0.28)')
  accent: string;        // Primary vibrant accent hex
}

export interface AppleMusicPalette {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
}
