import { HSL, RGB } from './types';

export class ColorConverter {

  static rgbToHex({ r, g, b }: RGB): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
        .toUpperCase()
    );
  }

  static hexToRgb(hex: string): RGB {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
      const g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
      const b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
      return { r, g, b };
    }
    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    return { r, g, b };
  }

  static getLuma({ r, g, b }: RGB): number {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  static getHue({ r, g, b }: RGB): number {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    if (max === min) return 0;
    const d = max - min;
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
    return Math.round(((h * 360) % 360 + 360) % 360);
  }

  static rgbToHsl({ r, g, b }: RGB): HSL {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const d = max - min;
    const l = (max + min) / 2;

    if (d === 0) {
      return { h: 0, s: 0, l };
    }

    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === rNorm) {
      h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / d + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / d + 4) / 6;
    }

    return {
      h: Math.round(((h * 360) % 360 + 360) % 360),
      s: Math.max(0, Math.min(1, s)),
      l: Math.max(0, Math.min(1, l)),
    };
  }

  static hslToRgb({ h, s, l }: HSL): RGB {
    const hNorm = ((h % 360 + 360) % 360) / 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const hue2rgb = (t: number) => {
      let normalized = t;
      if (normalized < 0) normalized += 1;
      if (normalized > 1) normalized -= 1;
      if (normalized < 1 / 6) return p + (q - p) * 6 * normalized;
      if (normalized < 1 / 2) return q;
      if (normalized < 2 / 3) return p + (q - p) * (2 / 3 - normalized) * 6;
      return p;
    };

    return {
      r: Math.round(hue2rgb(hNorm + 1 / 3) * 255),
      g: Math.round(hue2rgb(hNorm) * 255),
      b: Math.round(hue2rgb(hNorm - 1 / 3) * 255),
    };
  }

  static boostSaturation(color: RGB, factor: number): RGB {
    let { r, g, b } = color;
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s: number;
    const l = (max + min) / 2;

    if (max === min) {
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
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
}
