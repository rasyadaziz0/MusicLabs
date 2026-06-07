export class PlayerCache {
  private static getFallbackCacheKey(trackId: string): string {
    return `fallback_yt_${trackId}`;
  }

  static getFallbackVideoId(trackId: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.getFallbackCacheKey(trackId));
    } catch (e) {
      return null;
    }
  }

  static setFallbackVideoId(trackId: string, videoId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getFallbackCacheKey(trackId), videoId);
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }
}
