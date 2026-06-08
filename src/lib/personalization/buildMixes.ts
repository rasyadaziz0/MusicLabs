import { Song } from '@/types/music';

export interface PersonalizedSection {
  key: string;
  title: string;
  subtitle: string;
  tracks: Song[];
}

function dedupeSongs(songs: Song[]) {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (!song?.id || seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

export function buildPersonalizedSections(input: {
  onRepeat: Song[];
  fromYourLikes: Song[];
  missedHits: Song[];
  lateNightMix: Song[];
  focusMix: Song[];
}): PersonalizedSection[] {
  const used = new Set<string>();

  const sections: PersonalizedSection[] = [
    {
      key: 'on-repeat',
      title: 'On Repeat',
      subtitle: 'Lagu yang paling sering kamu puter akhir-akhir ini.',
      tracks: input.onRepeat,
    },
    {
      key: 'from-your-likes',
      title: 'From Your Likes',
      subtitle: 'Diambil dari lagu-lagu yang udah kamu simpan.',
      tracks: input.fromYourLikes,
    },
    {
      key: 'missed-hits',
      title: 'Missed Hits',
      subtitle: 'Track lama yang dulu sering kamu dengerin.',
      tracks: input.missedHits,
    },
    {
      key: 'late-night-mix',
      title: 'Late Night Mix',
      subtitle: 'Cocok buat dengerin pas malam.',
      tracks: input.lateNightMix,
    },
    {
      key: 'focus-mix',
      title: 'Focus Mix',
      subtitle: 'Campuran personal + mood fokus.',
      tracks: input.focusMix,
    },
  ];

  return sections
    .map((section) => ({
      ...section,
      tracks: dedupeSongs(section.tracks).filter((song) => {
        if (used.has(song.id)) return false;
        used.add(song.id);
        return true;
      }),
    }))
    .filter((section) => section.tracks.length > 0);
}
