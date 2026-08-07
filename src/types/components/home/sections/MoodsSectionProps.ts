import { Song } from '@/types/music';
import { MoodKey } from '@/types/config/moods';

export interface MoodsSectionProps {
  selectedMood: MoodKey;
  setSelectedMood: (mood: MoodKey) => void;
  moodSongs: Song[];
  isMoodSongsLoading: boolean;
  playTrack: (song: Song, context: Song[], index?: number | string) => void;
}
