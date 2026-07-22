import { SongProfile } from './types';

export class PromptBuilder {
  /**
   * Assembles the text prompt for the Gemini AI based on recent listening history
   */
  public static buildDiscoverPrompt(songs: SongProfile[]): string {
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
}
