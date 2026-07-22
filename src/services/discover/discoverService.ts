import { Song } from '@/types/music';
import { searchITunesTracks } from '@/lib/server/itunesApi';
import { SupabaseClient } from '@supabase/supabase-js';
import { DiscoverSuggestion, SongProfile } from './types';
import { PromptBuilder } from './PromptBuilder';
import { GeminiAIClient } from './GeminiAIClient';

const MIN_TRACKS_THRESHOLD = 5;

/**
 * Check if user has enough listening data to generate recommendations.
 */
export function hasEnoughHistory(uniqueTrackCount: number): boolean {
  return uniqueTrackCount >= MIN_TRACKS_THRESHOLD;
}

export function getMinTracksThreshold(): number {
  return MIN_TRACKS_THRESHOLD;
}

// Backward compatibility exports in case anything imports them directly
export const buildDiscoverPrompt = PromptBuilder.buildDiscoverPrompt;
export const getGeminiRecommendations = GeminiAIClient.generateRecommendations.bind(GeminiAIClient);

/**
 * Search iTunes for each Gemini suggestion.
 * Uses Promise.allSettled for silent fail on hallucinated/unfindable songs.
 * Returns deduped Song[] (max `limit`).
 */
export async function searchSuggestedTracks(
  suggestions: DiscoverSuggestion[],
  alreadyPlayedIds: Set<string>,
  limit = 20,
): Promise<Song[]> {
  // Search concurrently with batching to avoid overwhelming iTunes
  const BATCH_SIZE = 5;
  const allResults: Song[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < suggestions.length && allResults.length < limit; i += BATCH_SIZE) {
    const batch = suggestions.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (suggestion) => {
        const query = `${suggestion.artist} ${suggestion.title}`;
        const tracks = await searchITunesTracks(query, 3);
        return tracks;
      }),
    );

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value.length) continue;

      // Take the best match (first result from iTunes)
      const track = result.value[0];
      if (seenIds.has(track.id) || alreadyPlayedIds.has(track.id)) continue;

      seenIds.add(track.id);
      allResults.push(track);

      if (allResults.length >= limit) break;
    }
  }

  return allResults;
}

export async function generateDiscoverWeeklyForUser(client: SupabaseClient, userId: string) {
  const { getWeeklyListeningHistory, getAllRecentTrackIds, getOrCreateDiscoverWeeklyPlaylist, updateDiscoverWeeklyTracks } = await import('@/lib/supabase/music');

  // 1. Fetch weekly listening history
  const weeklyHistory = await getWeeklyListeningHistory(client, userId, 7);
  const uniqueTrackIds = Array.from(new Set(weeklyHistory.map((r) => r.track_id)));

  // 2. Check minimum threshold
  if (!hasEnoughHistory(uniqueTrackIds.length)) {
    throw new Error('insufficient_history');
  }

  const top20Ids = uniqueTrackIds.slice(0, 20);
  const { getITunesTrack } = await import('@/lib/server/itunesApi');
  const { getYtMusicClient, mapYtSongToAppSong } = await import('@/lib/server/ytmusic');

  const songs: any[] = [];

  for (const id of top20Ids) {
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
      try {
        const ytClient = await getYtMusicClient();
        const songData = await ytClient.getSong(id);
        const mapped = songData ? mapYtSongToAppSong(songData as any) : null;
        if (mapped) songs.push(mapped);
      } catch (e) {
        console.error('Failed to fetch YT song', id, e);
      }
    } else {
      const itunesId = id.replace(/^itunes-/, '');
      try {
        const song = await getITunesTrack(itunesId);
        if (song) songs.push(song);
      } catch (e) {
        console.error('Failed to fetch iTunes song', id, e);
      }
    }
  }

  if (songs.length === 0) {
    throw new Error('Failed to fetch track metadata for history.');
  }

  // 4. Build play count map
  const playCountMap = new Map<string, number>();
  for (const entry of weeklyHistory) {
    playCountMap.set(entry.track_id, entry.play_count ?? 1);
  }

  // 5. Prepare data for Gemini
  const songProfiles: SongProfile[] = songs.map((song) => ({
    name: song.name,
    artist: song.artists?.primary?.[0]?.name ?? 'Unknown',
    genre: song.genre ?? '',
    playCount: playCountMap.get(song.id) ?? 1,
  }));

  // 6. Get Gemini recommendations
  const prompt = PromptBuilder.buildDiscoverPrompt(songProfiles);
  const suggestions = await GeminiAIClient.generateRecommendations(prompt);

  // 7. Get already-played track IDs for dedup
  const alreadyPlayed = await getAllRecentTrackIds(client, userId, 30);

  // 8. Search iTunes for each suggestion
  const discoveredTracks = await searchSuggestedTracks(suggestions, alreadyPlayed, 20);

  if (discoveredTracks.length === 0) {
    throw new Error('Could not find any matching tracks from AI suggestions.');
  }

  // 9. Upsert Discover Weekly playlist
  // Use admin client to bypass RLS for is_discover_weekly writes
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in your .env file. This is required to save the Discover Weekly playlist.');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  const { playlist } = await getOrCreateDiscoverWeeklyPlaylist(supabaseAdmin, userId);
  await updateDiscoverWeeklyTracks(
    supabaseAdmin,
    playlist.id,
    discoveredTracks.map((t) => t.id),
  );

  return {
    playlistId: playlist.id,
    trackCount: discoveredTracks.length,
    tracks: discoveredTracks,
    generatedAt: new Date().toISOString(),
  };
}
