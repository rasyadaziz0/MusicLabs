'use client';

import { getHomeFeed, getBestImageUrl, searchSongs } from '@/lib/api/musicApi';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getRecentPlays } from '@/lib/supabase/music';
import { usePlayer } from '@/context/PlayerContext';
import { Song } from '@/types/music';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodKey>('fokus');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => getHomeFeed(),
  });
  const { data: dbRecentPlays, isLoading: isRecentLoading } = useQuery({
    queryKey: ['recentPlays', user?.id],
    queryFn: () => getRecentPlays(user!.id),
    enabled: !!user?.id,
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
  const recentlyPlayedSongs = user && dbRecentPlays && dbRecentPlays.length > 0 
    ? dbRecentPlays 
    : getSongWindow(trendingSongs, 2, 12);
  const moodSongs: Song[] = moodSongsData?.slice(0, 12) ?? [];

  // AcadMusic style solid gradients
  const topPicksGradients = [
    'linear-gradient(135deg, #FA243C, #FF6275)',
    'linear-gradient(135deg, #E6D02A, #C8B625)',
    'linear-gradient(135deg, #162E93, #2F2FE4)',
    'linear-gradient(135deg, #8A2BE2, #B026FF)',
    'linear-gradient(135deg, #10B981, #34D399)',
  ];

  return (
    <>
      <div ref={containerRef} className="space-y-10 pb-12 pt-2">
        {/* Header */}
        <div className="px-2">
          <header className="flex items-center justify-between">
            <h1 className="text-[34px] font-bold tracking-tight text-white mb-2">Home</h1>
            {user && (
              <div className="relative z-50 md:hidden mb-2">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-white/10 relative border border-white/10"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image src={user.user_metadata.avatar_url.trim().replace(/^`+|`+$/g, '')} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FA243C]" />
                  )}
                </button>
                
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 top-11 w-48 bg-[#2c2c2e] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden py-1">
                      <div className="px-4 py-2 border-b border-white/5 mb-1">
                        <p className="text-[13px] font-semibold text-white/90 truncate">{user.user_metadata?.name || 'User'}</p>
                        <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </header>
          <div className="h-[1px] w-full bg-white/10 mt-2" />
        </div>

        {/* Top Picks Section */}
        <section className="px-2">
          <h2 className="text-[20px] font-bold text-white mb-4">Top Picks for You</h2>

          <div className="flex overflow-x-auto gap-4 md:gap-5 pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {trendingSongs.slice(0, 8).map((song: Song, index: number) => {
              const bgGradient = topPicksGradients[index % topPicksGradients.length];
              return (
                <div
                  key={song.id}
                  className="group relative flex-shrink-0 w-[260px] md:w-[310px] aspect-[4/5] rounded-[16px] overflow-hidden cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
                  onClick={() => playTrack(song, trendingSongs)}
                  style={{ background: bgGradient }}
                >
                  {/* Subtle AcadMusic Logo in top right */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80">
                    <span className="text-[12px] font-bold text-white tracking-tight">AcadMusic</span>
                  </div>

                  {/* Optional centered image collage effect for variety */}
                  {index % 2 === 1 && getBestImageUrl(song.image) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-black/10">
                      <Image
                        src={getBestImageUrl(song.image)!}
                        alt={song.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 p-5 w-full bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white/90 text-[11px] font-semibold mb-1 uppercase tracking-widest">
                      {index % 2 === 0 ? 'Made for You' : 'New Release'}
                    </p>
                    <h3 className="text-2xl md:text-[28px] font-bold text-white mb-1 line-clamp-2 leading-tight">
                      {index % 2 === 0 ? 'New Music' : song.name}
                    </h3>
                    <p className="text-[14px] text-white/80 line-clamp-2 leading-snug">
                      {index % 2 === 0 
                        ? `${song.artists.primary.map(a => a.name).join(', ')} and more`
                        : `${song.artists.primary.map(a => a.name).join(', ')}`
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-2">
          <div className="flex items-center gap-1 mb-4">
            <h2 className="text-[20px] font-bold text-white">{user ? 'Recently Played' : 'Trending Now'}</h2>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted ml-1 opacity-70"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <div className="flex overflow-x-auto gap-4 md:gap-5 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {isRecentLoading && user ? (
              [...Array(6)].map((_, i) => (
                <div
                  key={`recent-loading-${i}`}
                  className="flex-shrink-0 w-[160px] md:w-[180px] aspect-square rounded-[12px] bg-white/5 animate-pulse"
                />
              ))
            ) : recentlyPlayedSongs.length > 0 ? (
              recentlyPlayedSongs.map((song: Song, index: number) => (
                <button
                  key={`${song.id}-recent-${index}`}
                  type="button"
                  className="group flex-shrink-0 w-[160px] md:w-[180px] text-left"
                  onClick={() => playTrack(song, recentlyPlayedSongs)}
                >
                  <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
                    {getBestImageUrl(song.image) && (
                      <Image
                        src={getBestImageUrl(song.image)!}
                        alt={song.name}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    )}
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">{song.name}</p>
                  <p className="text-muted text-[13px] line-clamp-1 mt-0.5">
                    {song.artists.primary.map(a => a.name).join(', ')}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted">No recently played songs.</p>
            )}
          </div>
        </section>

        {/* Guest Sign-In Banner */}
        {!user && (
          <section className="px-2">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FA243C]/20 via-[#FA243C]/10 to-transparent border border-[#FA243C]/20 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-white mb-1">Get the full experience</h3>
                <p className="text-[13px] text-white/50">Sign in to save songs, create playlists, and listen to full tracks.</p>
              </div>
              <a
                href="/login"
                className="flex-shrink-0 ml-4 px-5 py-2 rounded-full bg-[#FA243C] text-white text-[13px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
              >
                Sign In
              </a>
            </div>
          </section>
        )}

        {/* Restyled Mood / Browse Section */}
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
              <button
                key={`${song.id}-mood-${selectedMood}-${index}`}
                type="button"
                className="group flex-shrink-0 w-[160px] md:w-[180px] text-left"
                onClick={() => playTrack(song, moodSongs)}
              >
                <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/5 shadow-sm">
                  {getBestImageUrl(song.image) && (
                    <Image
                      src={getBestImageUrl(song.image)!}
                      alt={song.name}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">{song.name}</p>
                <p className="text-muted text-[13px] line-clamp-1 mt-0.5">
                  {song.artists.primary.map(a => a.name).join(', ')}
                </p>
              </button>
            ))}
            {!isMoodSongsLoading && moodSongs.length === 0 && (
              <p className="text-sm text-muted">No songs available for this mood.</p>
            )}
          </div>
        </section>

      </div>
    </>
  );
}
