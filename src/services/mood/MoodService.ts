import { searchSongs } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { GLOBAL_EXCLUDED_TERMS, MOOD_PLAYLISTS, MoodConfig, MoodKey } from '@/config/moods';

export class MoodService {
  private static normalizeText(value: string) {
    return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  private static buildSongSearchText(song: Song) {
    const artistText = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
      .map((artist) => artist.name)
      .join(' ');
    return this.normalizeText(`${song.name} ${artistText} ${song.album?.name ?? ''}`);
  }

  private static containsAnyKeyword(text: string, keywords: string[]) {
    return keywords.some((keyword) => text.includes(this.normalizeText(keyword)));
  }

  private static scoreSongForMood(song: Song, mood: MoodConfig) {
    const text = this.buildSongSearchText(song);

    // Hard ban stock/royalty-free music indicators
    const STOCK_MUSIC_INDICATORS = [
      'background music', 'royalty free', 'advertising', 'jingle',
      'uniquesound', 'melodality', 'doran opus', 'mrrevant', 'jeezy beatz',
      'happy upbeat pop', 'uplifting pop', 'corporate',
    ];
    if (this.containsAnyKeyword(text, GLOBAL_EXCLUDED_TERMS)) return -100;
    if (this.containsAnyKeyword(text, STOCK_MUSIC_INDICATORS)) return -100;

    let score = 0;
    mood.include.forEach((keyword) => {
      if (text.includes(this.normalizeText(keyword))) score += 3;
    });
    mood.exclude.forEach((keyword) => {
      if (text.includes(this.normalizeText(keyword))) score -= 4;
    });

    if (song.duration >= 120) score += 1;
    return score;
  }

  private static dedupeSongs(songs: Song[]) {
    const seen = new Set<string>();
    return songs.filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public static getMoodConfig(key: MoodKey): MoodConfig {
    return MOOD_PLAYLISTS.find((mood) => mood.key === key) ?? MOOD_PLAYLISTS[0];
  }

  public static async fetchMoodSongs(moodKey: MoodKey): Promise<Song[]> {
    const moodConfig = this.getMoodConfig(moodKey);
    const responses = await Promise.all(
      moodConfig.queries.map((query) => 
        searchSongs(query).catch((error) => {
          console.warn(`Failed to search songs for mood query "${query}":`, error);
          return { results: [] };
        })
      )
    );
    const mergedResults: Song[] = responses.flatMap((res) => res?.results ?? []);
    const uniqueSongs = this.dedupeSongs(mergedResults);
  
    const scored = uniqueSongs
      .map((song) => ({ song, score: this.scoreSongForMood(song, moodConfig) }))
      .filter((item) => item.score > -100);
  
    const highQuality = scored
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  
    // Shuffle biar ga monopoli 1 artis
    const shuffled = this.shuffleArray(highQuality);
    if (shuffled.length >= 8) return shuffled;
  
    return this.shuffleArray(scored.sort((a, b) => b.score - a.score).map((item) => item.song));
  }
}
