'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ListMusic, Heart, Users, UserCheck, User, Share2, ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/lib/supabase/social';

interface ProfileHeroProps {
  user: any;
  profile: UserProfile | null;
  stats: {
    playlistCount: number;
    likedCount: number;
    followerCount: number;
    followingCount: number;
  };
  handleSignOut: () => void;
  setFollowModalTab: (tab: 'followers' | 'following') => void;
  setFollowModalOpen: (open: boolean) => void;
}

export function ProfileHero({
  user,
  profile,
  stats,
  handleSignOut,
  setFollowModalTab,
  setFollowModalOpen,
}: ProfileHeroProps) {
  const router = useRouter();
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url?.trim().replace(/^`+|`+$/g, '');
  const displayName = profile?.display_name || profile?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'User';
  const usernameDisplay = profile?.username;
  const bio = profile?.bio;
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div data-animate className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#FA243C]/[0.06] blur-[120px]" />
      </div>

      {/* Back button */}
      <button
        onClick={() => {
          if (window.history.length > 2) {
            router.back();
          } else {
            router.push('/');
          }
        }}
        className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-20 md:hidden"
      >
        <ArrowLeft size={20} />
      </button>

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
        <div className="flex items-center gap-3 mt-5">
          <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white">
            {displayName}
          </h1>
        </div>
        
        {usernameDisplay ? (
          <p className="text-[14px] text-white/40 mt-1">@{usernameDisplay}</p>
        ) : (
          <p className="text-[13px] text-white/40 mt-1">{user.email}</p>
        )}

        {bio && (
          <p className="text-[14px] text-white/70 mt-3 max-w-sm text-center leading-relaxed">
            {bio}
          </p>
        )}

        {/* Share profile button */}
        <button 
          onClick={() => {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music-labs-beryl.vercel.app');
            const url = profile?.username ? `${appUrl}/@${profile.username}` : `${appUrl}/user/${user.id}`;
            navigator.clipboard.writeText(url);
            alert('Profile link copied to clipboard!');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 mt-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
        >
          <Share2 size={12} className="text-white/60" />
          <span className="text-[11px] text-white/60 font-medium">Share Profile</span>
        </button>

        {/* Stats row */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-12 mt-7 w-full justify-center overflow-x-auto scrollbar-hide max-w-full">
          <StatItem value={stats.playlistCount} label="Playlists" icon={<ListMusic size={15} className="text-[#FA243C]" />} />
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <StatItem value={stats.likedCount} label="Liked" icon={<Heart size={15} className="text-[#FA243C]" />} />
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <button
            type="button"
            onClick={() => { setFollowModalTab('followers'); setFollowModalOpen(true); }}
            className="group cursor-pointer shrink-0"
          >
            <StatItem value={stats.followerCount} label="Followers" icon={<Users size={15} className="text-[#FA243C]" />} clickable />
          </button>
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <button
            type="button"
            onClick={() => { setFollowModalTab('following'); setFollowModalOpen(true); }}
            className="group cursor-pointer shrink-0"
          >
            <StatItem value={stats.followingCount} label="Following" icon={<UserCheck size={15} className="text-[#FA243C]" />} clickable />
          </button>
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
  clickable = false,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  clickable?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-[22px] md:text-[26px] font-bold text-white tabular-nums ${clickable ? 'group-hover:text-[#FA243C] transition-colors' : ''}`}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </span>
      </div>
      <span className={`text-[11px] font-semibold text-white/40 uppercase tracking-wider ${clickable ? 'group-hover:text-white/60 transition-colors' : ''}`}>
        {label}
      </span>
    </div>
  );
}
