import { Song } from '@/types/music';
import { TrackCard } from '@/components/home/HomeCards';
import { MOOD_PLAYLISTS, MoodKey } from '@/config/moods';

interface MoodsSectionProps {
  selectedMood: MoodKey;
  setSelectedMood: (mood: MoodKey) => void;
  moodSongs: Song[];
  isMoodSongsLoading: boolean;
  playTrack: (song: Song, context: Song[]) => void;
}

export function MoodsSection({ selectedMood, setSelectedMood, moodSongs, isMoodSongsLoading, playTrack }: MoodsSectionProps) {
  return (
    <section className="px-2 pt-4">
      <h2 className="text-[20px] font-bold text-white mb-4">Moods & Activities</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {MOOD_PLAYLISTS.map((mood) => {
          const isActive = mood.key === selectedMood;
          return (
            <button
              key={mood.key}
              type="button"
              onClick={() => setSelectedMood(mood.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${isActive
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                }`}
            >
              {mood.label}
            </button>
          );
        })}
      </div>
      <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {isMoodSongsLoading && (
          [...Array(6)].map((_, i) => (
            <div
              key={`mood-loading-${i}`}
              className="flex-shrink-0 w-[160px] md:w-[180px] aspect-square rounded-[12px] bg-white/5 animate-pulse"
            />
          ))
        )}
        {!isMoodSongsLoading && moodSongs.map((song: Song, index: number) => (
          <TrackCard
            key={`${song.id}-mood-${selectedMood}-${index}`}
            song={song}
            onPlay={() => playTrack(song, moodSongs)}
          />
        ))}
        {!isMoodSongsLoading && moodSongs.length === 0 && (
          <p className="text-sm text-muted">No songs available for this mood.</p>
        )}
      </div>
    </section>
  );
}
