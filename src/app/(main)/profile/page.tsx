'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import {
  LogOut,
  ChevronRight,
  Music,
  Heart,
  Headphones,
  ListMusic,
  Settings,
  User,
} from 'lucide-react';
import { useProfileViewModel } from '@/hooks/useProfileViewModel';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';

export default function ProfilePage() {
  const router = useRouter();
  const { loading } = useAuth();
  const {
    user,
    playlists,
    likedSongs,
    recentlyPlayed,
    stats,
    isLoading,
    handleSignOut,
  } = useProfileViewModel();
  const { playTrack } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // GSAP entrance animation
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('[data-animate]'),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    }
  }, [isLoading]);

  if (loading || !user) return null;

  if (isLoading) {
    return (
      <div className="pb-32 pt-2 max-w-[1400px] mx-auto animate-pulse">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center pt-12 pb-8 px-6">
          <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full bg-white/5" />
          <div className="h-8 w-48 bg-white/5 rounded-lg mt-6" />
          <div className="h-4 w-36 bg-white/5 rounded mt-3" />
          <div className="flex gap-10 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-7 w-12 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="px-5 md:px-8 mt-6 space-y-8">
          <div className="h-6 w-40 bg-white/5 rounded" />
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-[160px] aspect-square bg-white/5 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url?.trim().replace(/^`+|`+$/g, '');
  const displayName = user.user_metadata?.name || user.user_metadata?.full_name || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={containerRef} className="pb-32 pt-2 max-w-[1400px] mx-auto">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <div data-animate className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#FA243C]/[0.06] blur-[120px]" />
        </div>

        <div className="relative flex flex-col items-center pt-10 md:pt-14 pb-8 px-6">
          {/* Avatar */}
          <div className="relative">
            <div className="relative w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full overflow-hidden ring-[3px] ring-[#FA243C]/30 ring-offset-4 ring-offset-black/0 shadow-[0_0_60px_rgba(250,36,60,0.15)]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  sizes="160px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C] to-[#FF6275] flex items-center justify-center">
                  <span className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            {/* Online dot */}
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-[#121212]" />
          </div>

          {/* Name & email */}
          <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white mt-5">
            {displayName}
          </h1>
          <p className="text-[13px] text-white/40 mt-1">{user.email}</p>

          {/* Stats row */}
          <div className="flex items-center gap-8 md:gap-12 mt-7">
            <StatItem value={stats.playlistCount} label="Playlists" icon={<ListMusic size={15} className="text-[#FA243C]" />} />
            <div className="w-px h-8 bg-white/10" />
            <StatItem value={stats.likedCount} label="Liked" icon={<Heart size={15} className="text-[#FA243C]" />} />
            <div className="w-px h-8 bg-white/10" />
            <StatItem value={stats.listenedCount} label="Listened" icon={<Headphones size={15} className="text-[#FA243C]" />} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-7">
            <Link
              href="/profile/edit"
              className="px-6 py-2 rounded-full bg-white/[0.08] border border-white/10 text-[13px] font-semibold text-white hover:bg-white/[0.15] transition-colors"
            >
              <span className="flex items-center gap-2">
                <User size={14} />
                Edit Profile
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 rounded-full bg-transparent border border-[#FA243C]/30 text-[13px] font-semibold text-[#FA243C] hover:bg-[#FA243C]/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut size={14} />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-5 md:px-8">
        <div className="h-px w-full bg-white/[0.06]" />
      </div>

      {/* ── Recently Played ───────────────────────────────────── */}
      {recentlyPlayed.length > 0 && (
        <div data-animate className="px-5 md:px-8">
          <HorizontalScrollSection title="Recently Played">
            {recentlyPlayed.map((song: Song, index: number) => (
              <button
                key={`${song.id}-recent-${index}`}
                type="button"
                className="group flex-shrink-0 w-[150px] md:w-[170px] text-left"
                onClick={() => playTrack(song, recentlyPlayed)}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-white/5 border border-white/5 shadow-sm">
                  {getBestImageUrl(song.image) && (
                    <Image
                      src={getBestImageUrl(song.image)!}
                      alt={song.name}
                      fill
                      sizes="170px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <p className="text-white font-medium text-[13px] line-clamp-1 leading-snug">
                  {song.name}
                </p>
                <p className="text-white/40 text-[12px] line-clamp-1 mt-0.5">
                  {song.artists.primary.map((a) => a.name).join(', ')}
                </p>
              </button>
            ))}
          </HorizontalScrollSection>
        </div>
      )}

      {/* ── Your Playlists ────────────────────────────────────── */}
      <div data-animate className="px-5 md:px-8 mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold text-white tracking-tight">Your Playlists</h2>
          <Link
            href="/library/playlists"
            className="text-[13px] text-[#FA243C] font-medium hover:underline flex items-center gap-0.5"
          >
            See All
            <ChevronRight size={14} />
          </Link>
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-7">
            {playlists.slice(0, 6).map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-white/5 shadow-md border border-white/5 transition-transform duration-300 group-hover:scale-[1.03]">
                  {playlist.cover_url ? (
                    <Image
                      src={playlist.cover_url}
                      alt={playlist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 flex items-center justify-center">
                      <Music size={32} className="text-[#FA243C]/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="px-0.5 mt-0.5">
                  <p className="text-[14px] font-medium text-white/95 truncate leading-snug">
                    {playlist.name}
                  </p>
                  <p className="text-[12px] text-white/40 truncate mt-0.5">Playlist</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
            <p className="text-[15px] text-white/50 mb-5">No playlists yet.</p>
            <Link
              href="/playlist/create"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Create New Playlist
            </Link>
          </div>
        )}
      </div>

      {/* ── Favourite Songs (Preview) ─────────────────────────── */}
      {likedSongs.length > 0 && (
        <div data-animate className="px-5 md:px-8 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-white tracking-tight">Favourite Songs</h2>
            <Link
              href="/library/liked"
              className="text-[13px] text-[#FA243C] font-medium hover:underline flex items-center gap-0.5"
            >
              See All
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
            {likedSongs.slice(0, 5).map((song: Song, index: number) => (
              <button
                key={song.id}
                type="button"
                onClick={() => playTrack(song, likedSongs)}
                className={`group w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left ${
                  index < Math.min(likedSongs.length, 5) - 1
                    ? 'border-b border-white/[0.04]'
                    : ''
                }`}
              >
                {/* Artwork */}
                <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                  {getBestImageUrl(song.image) ? (
                    <Image
                      src={getBestImageUrl(song.image)!}
                      alt={song.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#FA243C]/10" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-white truncate">{song.name}</p>
                  <p className="text-[12px] text-white/40 truncate">
                    {song.artists.primary.map((a) => a.name).join(', ')}
                  </p>
                </div>
                {/* Duration */}
                <span className="text-[12px] text-white/30 tabular-nums flex-shrink-0">
                  {Math.floor(song.duration / 60)}:
                  {(song.duration % 60).toString().padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Account Settings ──────────────────────────────────── */}
      <div data-animate className="px-5 md:px-8 mt-10 mb-8">
        <h2 className="text-[20px] font-bold text-white tracking-tight mb-4">Account</h2>
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
          <Link
            href="/profile/edit"
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04]"
          >
            <span className="flex items-center gap-3 text-[15px] text-white/90">
              <User size={18} className="text-[#FA243C]" />
              Edit Profile
            </span>
            <ChevronRight size={18} className="text-white/20" />
          </Link>
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04]"
            onClick={() => {/* future */}}
          >
            <span className="flex items-center gap-3 text-[15px] text-white/90">
              <Settings size={18} className="text-[#FA243C]" />
              Preferences
            </span>
            <ChevronRight size={18} className="text-white/20" />
          </button>
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors"
            onClick={handleSignOut}
          >
            <span className="flex items-center gap-3 text-[15px] text-[#FA243C] font-medium">
              <LogOut size={18} />
              Sign Out
            </span>
            <ChevronRight size={18} className="text-white/20" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Item Sub-component ───────────────────────────────── */
function StatItem({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[22px] md:text-[26px] font-bold text-white tabular-nums">
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </span>
      </div>
      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
