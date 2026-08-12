
  export function getFallbackCacheKey(trackId: string): string {
    return `fallback_yt_${trackId}`;
  }

  export function getFallbackVideoId(trackId: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(getFallbackCacheKey(trackId));
    } catch (e) {
      return null;
    }
  }

  export function setFallbackVideoId(trackId: string, videoId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getFallbackCacheKey(trackId), videoId);
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  export function invalidate(trackId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(getFallbackCacheKey(trackId));
      
      const regex = new RegExp(`^yt_resolve_v\\d+_${trackId}`);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to invalidate cache', e);
    }
  }

  export function cleanupOldVersions(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && /^yt_resolve_v\d+_/.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to cleanup old cache versions', e);
    }
  }

