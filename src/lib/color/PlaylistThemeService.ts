import { AppleMusicThemeColors } from './types';
import { AppleMusicThemeGenerator } from './AppleMusicThemeGenerator';
import { ImageColorExtractor } from './ImageColorExtractor';

export interface ResolveThemeParams {
  coverUrl?: string | null;
  playlistName?: string | null;
  playlistId?: string | null;
}

export class PlaylistThemeService {
  private static instance: PlaylistThemeService;
  private extractor: ImageColorExtractor;

  private constructor(extractor?: ImageColorExtractor) {
    this.extractor = extractor || new ImageColorExtractor();
  }

  public static getInstance(): PlaylistThemeService {
    if (!PlaylistThemeService.instance) {
      PlaylistThemeService.instance = new PlaylistThemeService();
    }
    return PlaylistThemeService.instance;
  }

  public async resolveTheme(params: ResolveThemeParams): Promise<AppleMusicThemeColors> {
    const { coverUrl, playlistName, playlistId } = params;

    if (coverUrl) {
      try {
        const colorsResult = await this.extractor.extract(coverUrl);
        if (colorsResult && colorsResult.colors.length >= 2) {
          return AppleMusicThemeGenerator.generateTheme(
            colorsResult.colors[0],
            colorsResult.colors[1]
          );
        }
      } catch (err) {
        console.warn('PlaylistThemeService: Image color extraction failed, using fallback:', err);
      }
    }

    const palette = AppleMusicThemeGenerator.getDeterministicPalette(
      playlistName || playlistId || 'Playlist'
    );
    return AppleMusicThemeGenerator.generateThemeFromPalette(palette);
  }

  public applyThemeToDocument(theme: AppleMusicThemeColors | null): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (theme) {
      root.style.setProperty('--playlist-bg-base', theme.baseBg);
      root.style.setProperty('--playlist-glow-1', theme.glowPrimary);
      root.style.setProperty('--playlist-glow-2', theme.glowSecondary);
      root.style.setProperty('--playlist-accent', theme.accent);
      root.style.setProperty('--playlist-active', '1');
    } else {
      root.style.removeProperty('--playlist-bg-base');
      root.style.removeProperty('--playlist-glow-1');
      root.style.removeProperty('--playlist-glow-2');
      root.style.removeProperty('--playlist-accent');
      root.style.removeProperty('--playlist-active');
    }
  }
}
