import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackResolver } from './TrackResolver';
import { PlayerCache } from './PlayerCache';
import { Song } from '@/types/music';

// Mock dependencies
vi.mock('./PlayerCache', () => ({
  PlayerCache: {
    getFallbackVideoId: vi.fn(),
    setFallbackVideoId: vi.fn()
  }
}));

vi.mock('@/lib/youtube', () => ({
  resolveToYoutubeId: vi.fn()
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

const createSong = (id: string): Song => ({
  id,
  name: `Song ${id}`,
  type: 'song',
  year: '2024',
  releaseDate: null,
  duration: 200,
  label: '',
  explicitContent: false,
  playCount: 0,
  language: '',
  hasLyrics: false,
  lyricsId: null,
  url: '',
  copyright: '',
  album: { id: 'a1', name: 'Album', url: '' },
  artists: { primary: [{ id: '1', name: 'Artist', role: 'primary', type: 'artist', image: [], url: '' }], featured: [], all: [] },
  image: [],
  downloadUrl: [],
  preview: 'preview-url'
});

describe('TrackResolver', () => {
  let resolver: TrackResolver;

  beforeEach(() => {
    resolver = new TrackResolver();
    vi.clearAllMocks();
  });

  describe('resolvePreview', () => {
    it('should return preview url if available', async () => {
      const song = createSong('1');
      const result = await resolver.resolvePreview(song);
      
      expect(result).toEqual({ type: 'preview', audioUrl: 'preview-url' });
    });

    it('should attempt to fetch preview if not present', async () => {
      const song = createSong('1');
      song.preview = null;
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ previewUrl: 'fetched-preview' })
      } as Response);

      const result = await resolver.resolvePreview(song);
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual({ type: 'preview', audioUrl: 'fetched-preview' });
      expect(song.preview).toBe('fetched-preview'); // check caching
    });

    it('should return error if preview fetch fails', async () => {
      const song = createSong('1');
      song.preview = null;
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      } as Response);

      const result = await resolver.resolvePreview(song);
      
      expect(result).toEqual({ type: 'error' });
    });
  });

  describe('resolveDesktop', () => {
    it('should return cached youtube id if available', async () => {
      vi.mocked(PlayerCache.getFallbackVideoId).mockReturnValue('cached-vid');
      
      const song = createSong('1');
      const result = await resolver.resolveDesktop(song, () => '1');
      
      expect(result).toEqual({ type: 'youtube', videoId: 'cached-vid' });
    });

    it('should fallback to preview if youtube resolution fails', async () => {
      vi.mocked(PlayerCache.getFallbackVideoId).mockReturnValue(null);
      const resolveToYoutubeId = await import('@/lib/youtube').then(m => m.resolveToYoutubeId);
      vi.mocked(resolveToYoutubeId).mockResolvedValue(null);
      
      const song = createSong('1');
      const result = await resolver.resolveDesktop(song, () => '1');
      
      expect(result).toEqual({ type: 'preview', audioUrl: 'preview-url' });
    });
  });
});
