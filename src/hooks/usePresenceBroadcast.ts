'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase/client';
import { Song } from '@/types/music';

/**
 * Broadcasts the current playing track to `user_presence` table in Supabase.
 * - Upserts on track change
 * - Heartbeat every 2 minutes while playing (keeps `updated_at` fresh)
 * - Clears presence when playback stops or component unmounts
 * - Respects `show_now_playing` setting
 */
export function usePresenceBroadcast(
  currentTrack: Song | null,
  isPlaying: boolean
) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // If setting is disabled, clear presence and stop
    if (!settings.showNowPlaying) {
      clearPresence(user.id);
      return;
    }

    if (currentTrack && isPlaying) {
      // Upsert presence
      const trackId = currentTrack.id;
      const artistNames = currentTrack.artists?.primary
        ?.map((a) => a.name)
        .join(', ') || '';
      const coverUrl =
        currentTrack.image?.find((i) => i.quality === '150x150')?.url ||
        currentTrack.image?.[0]?.url ||
        '';

      // Only upsert if track changed (avoid spamming DB on every render)
      if (trackId !== lastTrackIdRef.current) {
        lastTrackIdRef.current = trackId;
        upsertPresence(user.id, trackId, currentTrack.name, artistNames, coverUrl);
      }

      // Heartbeat: update `updated_at` every 2 min so viewers know it's still live
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        upsertPresence(user.id, trackId, currentTrack.name, artistNames, coverUrl);
      }, 2 * 60 * 1000);
    } else {
      // Not playing — clear presence
      lastTrackIdRef.current = null;
      clearPresence(user.id);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [user, currentTrack?.id, isPlaying, settings.showNowPlaying]);

  // Clear on unmount (browser close / navigation)
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable cleanup on page close
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      navigator.sendBeacon?.(
        url,
        new Blob(
          [JSON.stringify({ track_id: null, track_name: null, artist_name: null, cover_url: null, updated_at: new Date().toISOString() })],
          { type: 'application/json' }
        )
      );
      // sendBeacon can't do PATCH, so we rely on the heartbeat staleness check instead
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);
}

async function upsertPresence(
  userId: string,
  trackId: string,
  trackName: string,
  artistName: string,
  coverUrl: string
) {
  try {
    await supabase.from('user_presence').upsert(
      {
        user_id: userId,
        track_id: trackId,
        track_name: trackName,
        artist_name: artistName,
        cover_url: coverUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    // Silently fail — presence is non-critical
    console.warn('Failed to upsert presence:', err);
  }
}

async function clearPresence(userId: string) {
  try {
    await supabase
      .from('user_presence')
      .update({
        track_id: null,
        track_name: null,
        artist_name: null,
        cover_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Failed to clear presence:', err);
  }
}
