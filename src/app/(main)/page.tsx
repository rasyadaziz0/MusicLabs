'use client';

import { getHomeFeed } from '@/lib/api/musicApi';
import { searchSongs } from '@/lib/api/musicApi';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const GLOBAL_EXCLUDED_TERMS = ['anak', 'balita', 'bayi', 'nina bobo', 'nursery', 'kids', 'kartun', 'ceria'];

const MOOD_PLAYLISTS = [
  {
    key: 'fokus',
    label: 'Fokus',
    queries: ['focus instrumental study', 'lofi deep focus'],
    include: ['focus', 'instrumental', 'study', 'lofi', 'piano', 'ambient'],
    exclude: ['sedih', 'heartbreak'],
  },
  {
    key: 'sedih',
    label: 'Sedih',
    queries: ['lagu galau indonesia', 'sad ballad indonesia'],
    include: ['sedih', 'galau', 'sad', 'hati', 'rindu', 'sendiri', 'patah'],
    exclude: ['happy', 'party', 'workout'],
  },
  {
    key: 'senang',
    label: 'Senang',
    queries: ['happy upbeat pop', 'lagu semangat indonesia'],
    include: ['happy', 'upbeat', 'semangat', 'ceria', 'party', 'dance'],
    exclude: ['sedih', 'galau', 'heartbreak'],
  },
  {
    key: 'heartbreak',
    label: 'Heartbreak',
    queries: ['heartbreak breakup songs', 'lagu patah hati indonesia'],
    include: ['heartbreak', 'breakup', 'patah', 'hati', 'galau', 'sad'],
    exclude: ['happy', 'workout'],
  },
  {
    key: 'percintaan',
    label: 'Percintaan',
    queries: ['lagu cinta romantis', 'romantic love songs'],
    include: ['cinta', 'love', 'romantis', 'sayang', 'kasih'],
    exclude: ['workout', 'party'],
  },
  {
    key: 'energi',
    label: 'Energi',
    queries: ['workout energy hits', 'gym motivation songs'],
    include: ['energy', 'workout', 'gym', 'power', 'dance', 'motivation'],
    exclude: ['chill', 'relax', 'sedih'],
  },
  {
    key: 'rileks',
    label: 'Rileks',
    queries: ['chill relaxing songs', 'calm acoustic chill'],
    include: ['chill', 'relax', 'calm', 'acoustic', 'ambient', 'lofi'],
    exclude: ['workout', 'party', 'hardcore'],
  },
] as const;

type MoodConfig = (typeof MOOD_PLAYLISTS)[number];
type MoodKey = MoodConfig['key'];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function buildSongSearchText(song: Song) {
  const artistText = [...song.artists.primary, ...song.artists.featured, ...song.artists.all]
    .map((artist) => artist.name)
    .join(' ');
  return normalizeText(`${song.name} ${artistText} ${song.album?.name ?? ''}`);
}

function containsAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function scoreSongForMood(song: Song, mood: MoodConfig) {
  const text = buildSongSearchText(song);

  if (containsAnyKeyword(text, GLOBAL_EXCLUDED_TERMS)) return -100;

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

function dedupeSongs(songs: Song[]) {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMood, setSelectedMood] = useState<MoodKey>('fokus');
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => getHomeFeed(),
  });
  const selectedMoodConfig =
    MOOD_PLAYLISTS.find((mood) => mood.key === selectedMood) ?? MOOD_PLAYLISTS[0];
  const { data: moodSongsData, isLoading: isMoodSongsLoading } = useQuery<Song[]>({
    queryKey: ['homeMoodSongs', 'v2', selectedMoodConfig.key],
    queryFn: async () => {
      const responses = await Promise.all(selectedMoodConfig.queries.map((query) => searchSongs(query)));
      const mergedResults: Song[] = responses.flatMap((res) => res?.results ?? []);
      const uniqueSongs = dedupeSongs(mergedResults);
      const ranked = uniqueSongs
        .map((song) => ({ song, score: scoreSongForMood(song, selectedMoodConfig) }))
        .filter((item) => item.score >= 2)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.song);

      // Fallback: tetap tampilkan sesuatu kalau hasil strict filter terlalu sedikit.
      if (ranked.length >= 8) return ranked;
      return uniqueSongs
        .map((song) => ({ song, score: scoreSongForMood(song, selectedMoodConfig) }))
        .filter((item) => item.score > -100)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.song);
    },
    staleTime: 1000 * 60 * 10,
  });

  const { playTrack } = usePlayer();

  const getSongWindow = (songs: Song[], start: number, limit = 10) => {
    if (!songs.length) return [];
    const count = Math.min(limit, songs.length);
    return Array.from({ length: count }, (_, i) => songs[(start + i) % songs.length]);
  };

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('section'),
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <>
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  const trendingSongs = homeData?.trending?.songs || [];
  const newReleaseAlbums = homeData?.albums || [];
  const recentlyPlayedSongs = getSongWindow(trendingSongs, 2, 12);
  const moodSongs: Song[] = moodSongsData?.slice(0, 12) ?? [];

  return (
    <>
      <div ref={containerRef} className="space-y-8 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between pt-4 px-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Home</h1>
        </header>
        {/* Top Picks Section */}
        <section className="px-2">
          <h2 className="text-[22px] font-bold text-white mb-4">Top Picks for You</h2>

          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {trendingSongs.slice(0, 10).map((song: Song, index: number) => (
              <div
                key={song.id}
                className="group relative flex-shrink-0 w-[240px] md:w-[280px] aspect-[4/5] rounded-[24px] overflow-hidden snap-start cursor-pointer shadow-lg"
                onClick={() => playTrack(song, trendingSongs)}
              >
                <Image
                  src={getBestImageUrl(song.image)}
                  alt={song.name}
                  fill
                  sizes="(max-width: 768px) 240px, 280px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 p-5 w-full">
                  <p className="text-white/80 text-xs font-medium mb-1 truncate uppercase tracking-wider">
                    {index % 2 === 0 ? 'Mood for You' : 'New Release'}
                  </p>
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
                    {song.name}
                  </h3>
                  <p className="text-[15px] text-white/70 truncate">
                    {song.artists.primary.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-2">
          <h2 className="text-[22px] font-bold text-white mb-4">Diputar Baru-Baru Ini</h2>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {recentlyPlayedSongs.map((song: Song, index: number) => (
              <button
                key={`${song.id}-recent-${index}`}
                type="button"
                className="group flex-shrink-0 w-[170px] text-left"
                onClick={() => playTrack(song, recentlyPlayedSongs)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                  <Image
                    src={getBestImageUrl(song.image)}
                    alt={song.name}
                    fill
                    sizes="170px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="text-white font-semibold text-sm line-clamp-1">{song.name}</p>
                <p className="text-white/60 text-xs line-clamp-1">
                  {song.artists.primary.map(a => a.name).join(', ')}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="px-2">
          <h2 className="text-[22px] font-bold text-white mb-4">Temukan Suasana Hari Ini</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {MOOD_PLAYLISTS.map((mood) => {
              const isActive = mood.key === selectedMood;
              return (
                <button
                  key={mood.key}
                  type="button"
                  onClick={() => setSelectedMood(mood.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {mood.label}
                </button>
              );
            })}
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {isMoodSongsLoading && (
              [...Array(6)].map((_, i) => (
                <div
                  key={`mood-loading-${i}`}
                  className="flex-shrink-0 w-[220px] aspect-[4/3] rounded-2xl bg-white/10 animate-pulse"
                />
              ))
            )}
            {!isMoodSongsLoading && moodSongs.map((song: Song, index: number) => (
              <button
                key={`${song.id}-mood-${selectedMood}-${index}`}
                type="button"
                className="group relative flex-shrink-0 w-[220px] aspect-[4/3] rounded-2xl overflow-hidden text-left"
                onClick={() => playTrack(song, moodSongs)}
              >
                <Image
                  src={getBestImageUrl(song.image)}
                  alt={song.name}
                  fill
                  sizes="220px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <p className="text-white/80 text-[11px] uppercase tracking-wider mb-1">{selectedMoodConfig.label}</p>
                  <p className="text-white font-semibold line-clamp-1">{song.name}</p>
                </div>
              </button>
            ))}
            {!isMoodSongsLoading && moodSongs.length === 0 && (
              <p className="text-sm text-white/60">Belum ada lagu untuk mood ini, coba mood lain.</p>
            )}
          </div>
        </section>

        <section className="px-2">
          <h2 className="text-[22px] font-bold text-white mb-4">Rilisan Baru Untuk Anda</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newReleaseAlbums.slice(0, 8).map((album: any, index: number) => (
              <div
                key={`${album.id}-release-${index}`}
                className="group rounded-2xl bg-white/5 hover:bg-white/10 transition-colors p-3 text-left"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <Image
                    src={getBestImageUrl(album.image)}
                    alt={album.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="text-white font-semibold text-sm line-clamp-1">{album.name}</p>
                <p className="text-white/60 text-xs line-clamp-1">
                  {album.primaryArtists?.map((artist: { name: string }) => artist.name).join(', ') || 'Various Artists'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
