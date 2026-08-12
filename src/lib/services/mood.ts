import { GLOBAL_EXCLUDED_TERMS, MOOD_PLAYLISTS } from '@/config/moods';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { MoodConfig, MoodKey } from '@/types/config/moods';
import { Song } from '@/types/music';
export function normalizeText(value: string) {
    return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

export function buildSongSearchText(song: Song) {
    const artistText = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
      .map((artist) => artist.name)
      .join(' ');
    return normalizeText(`${song.name} ${artistText} ${song.album?.name ?? ''}`);
  }

export function containsAnyKeyword(text: string, keywords: string[]) {
    return keywords.some((keyword) => text.includes(normalizeText(keyword)));
  }

export function scoreSongForMood(song: Song, mood: MoodConfig) {
    const text = buildSongSearchText(song);

    // Hard ban stock/royalty-free music indicators
    const STOCK_MUSIC_INDICATORS = [
      'background music', 'royalty free', 'advertising', 'jingle',
      'uniquesound', 'melodality', 'doran opus', 'mrrevant', 'jeezy beatz',
      'happy upbeat pop', 'uplifting pop', 'corporate',
    ];
    if (containsAnyKeyword(text, GLOBAL_EXCLUDED_TERMS)) return -100;
    if (containsAnyKeyword(text, STOCK_MUSIC_INDICATORS)) return -100;

    let score = 0;
    mood.include.forEach((keyword) => {
      if (text.includes(normalizeText(keyword))) score += 3;
    });
    mood.exclude.forEach((keyword) => {
      if (text.includes(normalizeText(keyword))) score -= 4;
    });

    if (song.duration >= 120) score += 1;
    return score;
  }

export function dedupeSongs(songs: Song[]) {
    const seen = new Set<string>();
    return songs.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }

export function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

export function getMoodConfig(key: MoodKey): MoodConfig {
    return MOOD_PLAYLISTS.find((mood) => mood.key === key) ?? MOOD_PLAYLISTS[0];
  }

export async function fetchMoodSongs(moodKey: MoodKey): Promise<Song[]> {
    const moodConfig = getMoodConfig(moodKey);
    const responses = await Promise.all(
      moodConfig.queries.map((query) => 
        MusicApiService.searchSongs(query).catch((error) => {
          console.warn(`Failed to search songs for mood query "${query}":`, error);
          return { results: [] };
        })
      )
    );
    const mergedResults: Song[] = responses.flatMap((res) => res?.results ?? []);
    const uniqueSongs = dedupeSongs(mergedResults);
  
    const scored = uniqueSongs
      .map((song) => ({ song, score: scoreSongForMood(song, moodConfig) }))
      .filter((item) => item.score > -100);
  
    const highQuality = scored
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  
    // Shuffle biar ga monopoli 1 artis
    const shuffled = shuffleArray(highQuality);
    if (shuffled.length >= 8) return shuffled;
  
    return shuffleArray(scored.sort((a, b) => b.score - a.score).map((item) => item.song));
  }
