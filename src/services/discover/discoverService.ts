import { GoogleGenerativeAI } from '@google/generative-ai';
import { Song } from '@/types/music';
import { searchITunesTracks } from '@/lib/server/itunesApi';

const GEMINI_KEY = process.env.GOOGLE_GEMINI_DISCOVER_KEY ?? '';
const MIN_TRACKS_THRESHOLD = 5;

export interface DiscoverSuggestion {
  title: string;
  artist: string;
}

export interface DiscoverResult {
  tracks: Song[];
  fromCache: boolean;
  generatedAt: string;
}

/**
 * Check if user has enough listening data to generate recommendations.
 */
export function hasEnoughHistory(uniqueTrackCount: number): boolean {
  return uniqueTrackCount >= MIN_TRACKS_THRESHOLD;
}

export function getMinTracksThreshold(): number {
  return MIN_TRACKS_THRESHOLD;
}
export function buildDiscoverPrompt(
  songs: Array<{ name: string; artist: string; genre: string; playCount: number }>,
): string {
  const songList = songs
    .map(
      (s, i) =>
        `${i + 1}. "${s.name}" by ${s.artist}${s.genre ? ` [${s.genre}]` : ''} (played ${s.playCount}x)`,
    )
    .join('\n');

  return `You are a music recommendation engine. Based on the user's recently played songs below, recommend exactly 30 NEW songs they might enjoy. The songs should be real, well-known tracks from real artists — not made up.

USER'S RECENT LISTENING (ordered by play frequency):
${songList}

RULES:
1. Recommend songs that match the user's taste profile (similar genres, moods, energy levels).
2. Mix familiar artists with new discoveries — at most 5 songs from artists already in the list.
3. Prioritize songs that are popular and well-known (more likely to be found on music platforms).
4. Do NOT recommend any songs that are already in the user's list above.
5. Include a diverse range — don't make all 30 songs the same genre.
6. Each recommendation must be a real song that exists and can be found on iTunes/Apple Music.

Return ONLY a valid JSON array of objects with "title" and "artist" fields. No markdown, no explanation, just the JSON array.

Example format:
[{"title":"Blinding Lights","artist":"The Weeknd"},{"title":"Levitating","artist":"Dua Lipa"}]`;
}
export async function getGeminiRecommendations(
  songs: Array<{ name: string; artist: string; genre: string; playCount: number }>,
): Promise<DiscoverSuggestion[]> {
  if (!GEMINI_KEY) {
    throw new Error('GOOGLE_GEMINI_DISCOVER_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = buildDiscoverPrompt(songs);

  // Retry up to 3 times
  const MAX_RETRIES = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Parse JSON — handle possible markdown wrapping
      let cleanText = responseText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanText);

      if (!Array.isArray(parsed)) {
        throw new Error('Gemini response is not an array');
      }

      // Validate shape — filter out malformed entries silently
      const suggestions: DiscoverSuggestion[] = parsed
        .filter(
          (item: any) =>
            item &&
            typeof item.title === 'string' &&
            typeof item.artist === 'string' &&
            item.title.trim().length > 0 &&
            item.artist.trim().length > 0,
        )
        .map((item: any) => ({
          title: item.title.trim(),
          artist: item.artist.trim(),
        }));

      if (suggestions.length < 5) {
        throw new Error(`Gemini returned too few valid suggestions (${suggestions.length})`);
      }

      return suggestions;
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.response?.status ?? 0;
      const isRetryable = status === 503 || status === 429 || status >= 500;

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        break;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `Gemini Discover attempt ${attempt + 1} failed (${status}), retrying in ${delay}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError || new Error('Failed to get Gemini recommendations');
}

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

import { SupabaseClient } from '@supabase/supabase-js';
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
        const client = await getYtMusicClient();
        const songData = await client.getSong(id);
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
  const songProfiles = songs.map((song) => ({
    name: song.name,
    artist: song.artists?.primary?.[0]?.name ?? 'Unknown',
    genre: song.genre ?? '',
    playCount: playCountMap.get(song.id) ?? 1,
  }));

  // 6. Get Gemini recommendations
  const suggestions = await getGeminiRecommendations(songProfiles);

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
