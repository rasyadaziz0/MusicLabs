import { Song } from '@/types/music';
import { resolveToYoutubeId } from '@/lib/youtube';
import { supabase } from '@/lib/supabase/client';
import { PlayerCache } from './PlayerCache';

// ─── Result types ───

export type ResolveResultType =
  | 'youtube'   // Play via YouTube IFrame
  | 'html5'     // Play via HTML5 Audio (direct stream URL)
  | 'preview'   // Play via iTunes 30s preview
  | 'error';    // Nothing worked

export interface ResolveResult {
  type: ResolveResultType;
  videoId?: string;   // For 'youtube'
  audioUrl?: string;  // For 'html5' or 'preview'
}

// ─── Class ───
export class TrackResolver {
  private controller: AbortController | null = null;
  private fallbackAttemptedTrack: string | null = null;

  // ── Abort management ──

  abort(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private createSignal(): AbortSignal {
    this.abort();
    this.controller = new AbortController();
    return this.controller.signal;
  }

  private clearController(controller: AbortController): void {
    if (this.controller === controller) {
      this.controller = null;
    }
  }

  // ── Auth helpers ──

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  // ── Core resolution ──
  async resolveDesktop(track: Song, getCurrentTrackId: () => string | null): Promise<ResolveResult> {
    const artistName = track.artists.primary[0]?.name || '';

    // 1. Cached fallback
    const cached = PlayerCache.getFallbackVideoId(track.id);
    if (cached) {
      return { type: 'youtube', videoId: cached };
    }

    // 2. Resolve YouTube ID
    const signal = this.createSignal();
    const controller = this.controller!;

    try {
      const videoId = await resolveToYoutubeId(track.name, artistName, track.id, { signal, duration: track.duration });

      if (getCurrentTrackId() !== track.id) {
        return { type: 'error' };
      }

      if (videoId) {
        // Try HTML5 audio stream as a secondary path (in case YT IFrame isn't ready)
        // The caller will check youtube.isReady() and decide
        return { type: 'youtube', videoId };
      }

      // No videoId resolved
      return await this.resolvePreview(track);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { type: 'error' };
      }
      console.error('Desktop resolve failed:', err);
      return await this.resolvePreview(track);
    } finally {
      this.clearController(controller);
    }
  }

  async fetchAudioStreamUrl(videoId: string): Promise<string | null> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`/api/audio/${videoId}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  async resolveMobile(track: Song, getCurrentTrackId: () => string | null): Promise<ResolveResult> {
    const artistName = track.artists.primary[0]?.name || '';
    const signal = this.createSignal();
    const controller = this.controller!;

    try {
      // 1. Try cached or fresh video ID → HTML5 audio stream
      let videoId: string | null = PlayerCache.getFallbackVideoId(track.id);
      if (!videoId) {
        videoId = await resolveToYoutubeId(track.name, artistName, track.id, { signal, duration: track.duration });
      }

      if (getCurrentTrackId() !== track.id) return { type: 'error' };

      if (videoId) {
        const audioUrl = await this.fetchAudioStreamUrl(videoId);

        if (getCurrentTrackId() !== track.id) return { type: 'error' };

        if (audioUrl) {
          return { type: 'html5', audioUrl };
        }
        return { type: 'youtube', videoId };
      }

      return await this.resolvePreview(track);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { type: 'error' };
      }
      console.error('Mobile primary resolve failed, trying IFrame fallback:', err);

      try {
        const fallbackSignal = this.createSignal();
        const fallbackController = this.controller!;

        try {
          let fallbackVideoId = PlayerCache.getFallbackVideoId(track.id);
          if (!fallbackVideoId) {
            fallbackVideoId = await resolveToYoutubeId(
              track.name, artistName, track.id,
              { signal: fallbackSignal, duration: track.duration }
            );
          }

          if (getCurrentTrackId() !== track.id) return { type: 'error' };

          if (fallbackVideoId) {
            return { type: 'youtube', videoId: fallbackVideoId };
          }
        } finally {
          this.clearController(fallbackController);
        }
      } catch (fallbackErr) {
        if (fallbackErr instanceof DOMException && fallbackErr.name === 'AbortError') {
          return { type: 'error' };
        }
        console.error('Mobile IFrame fallback also failed:', fallbackErr);
      }

      return await this.resolvePreview(track);
    } finally {
      this.clearController(controller);
    }
  }

  async resolveEmbedFallback(track: Song, getCurrentTrackId: () => string | null): Promise<ResolveResult> {
    if (this.fallbackAttemptedTrack === track.id) {
      return await this.resolvePreview(track);
    }

    this.fallbackAttemptedTrack = track.id;

    const signal = this.createSignal();
    const controller = this.controller!;

    try {
      const artistName = track.artists.primary[0]?.name || '';
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `/api/audio/resolve?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(artistName)}&trackId=${encodeURIComponent(track.id)}&duration=${track.duration}&fallback=1`,
        { signal, headers }
      );

      if (!response.ok) {
        throw new Error(`Fallback resolve failed with status ${response.status}`);
      }

      const data = await response.json();
      const fallbackVideoId = data?.videoId as string | undefined;

      if (!fallbackVideoId || getCurrentTrackId() !== track.id) {
        return await this.resolvePreview(track);
      }

      PlayerCache.setFallbackVideoId(track.id, fallbackVideoId);
      return { type: 'youtube', videoId: fallbackVideoId };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { type: 'error' };
      }
      console.error('Embed fallback resolve failed:', err);
      return await this.resolvePreview(track);
    } finally {
      this.clearController(controller);
    }
  }

  async resolvePreview(track: Song): Promise<ResolveResult> {
    let previewUrl = track.preview;

    if (!previewUrl) {
      try {
        const artistName = track.artists.primary[0]?.name || '';
        const res = await fetch(
          `/api/preview?title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(artistName)}`
        );
        if (res.ok) {
          const data = await res.json();
          previewUrl = data.previewUrl || null;
        }
      } catch (err) {
        console.error('Failed to fetch preview URL:', err);
      }
    }

    if (!previewUrl) {
      console.warn('No preview URL available for', track.name);
      return { type: 'error' };
    }

    // Cache it on the track so subsequent plays don't re-fetch
    track.preview = previewUrl;
    return { type: 'preview', audioUrl: previewUrl };
  }

  // ── Reset ──

  resetFallbackTrack(): void {
    this.fallbackAttemptedTrack = null;
  }
}
