import { IIdentifyStrategy, IdentifyResult } from './IdentifyStrategy';
import { searchSongs } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

export class SpeechStrategy implements IIdentifyStrategy<string> {
  async execute(transcript: string): Promise<IdentifyResult> {
    if (!transcript.trim()) {
      return {
        type: 'error',
        errorMessage: 'No speech detected. Please try again.',
      };
    }

    try {
      const data: any = await searchSongs(transcript);
      const songs: Song[] = data?.results ?? data ?? [];

      if (songs.length > 0) {
        return {
          type: 'match',
          results: songs.slice(0, 6),
        };
      } else {
        return {
          type: 'no-match',
          rawMatch: { title: transcript, artist: '' }
        };
      }
    } catch (error) {
      return {
        type: 'error',
        errorMessage: 'Search failed. Please try again.',
      };
    }
  }
}
