import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSongsByIds } from '@/lib/api/musicApi';
import {
  getWeeklyListeningHistory,
  getAllRecentTrackIds,
  getOrCreateDiscoverWeeklyPlaylist,
  updateDiscoverWeeklyTracks,
} from '@/lib/supabase/music';
import {
  hasEnoughHistory,
  getMinTracksThreshold,
  generateDiscoverWeeklyForUser,
} from '@/services/discover/discoverService';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for the full pipeline

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Call the generator with the authenticated server client
    const result = await generateDiscoverWeeklyForUser(supabase, user.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Discover Weekly generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate Discover Weekly' },
      { status: 500 },
    );
  }
}

/**
 * GET — Check status of user's Discover Weekly without generating.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Discover Weekly playlist exists
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id, name, discover_generated_at, created_at')
      .eq('user_id', user.id)
      .eq('is_discover_weekly', true)
      .maybeSingle();

    if (!playlist) {
      // Check listening history count for progress bar
      const weeklyHistory = await getWeeklyListeningHistory(supabase, user.id, 7);
      const uniqueCount = new Set(weeklyHistory.map((r) => r.track_id)).size;

      return NextResponse.json({
        exists: false,
        listeningProgress: {
          current: uniqueCount,
          required: getMinTracksThreshold(),
          ready: hasEnoughHistory(uniqueCount),
        },
      });
    }

    // Check if it's stale (older than 7 days)
    const generatedAt = playlist.discover_generated_at
      ? new Date(playlist.discover_generated_at)
      : null;
    const isStale = !generatedAt || Date.now() - generatedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

    // Get weekly history for progress
    const weeklyHistory = await getWeeklyListeningHistory(supabase, user.id, 7);
    const uniqueCount = new Set(weeklyHistory.map((r) => r.track_id)).size;

    return NextResponse.json({
      exists: true,
      playlistId: playlist.id,
      generatedAt: playlist.discover_generated_at,
      isStale,
      listeningProgress: {
        current: uniqueCount,
        required: getMinTracksThreshold(),
        ready: hasEnoughHistory(uniqueCount),
      },
    });
  } catch (err: unknown) {
    console.error('Discover Weekly status error:', err);
    return NextResponse.json(
      { error: 'Failed to check Discover Weekly status' },
      { status: 500 },
    );
  }
}
