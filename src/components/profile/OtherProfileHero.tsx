import { Users, UserCheck, Globe, Share2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import FollowButton from '@/components/ui/FollowButton';

interface OtherProfileHeroProps {
  userId: string;
  profile: any;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowStatusLoading: boolean;
  openFollowModal: (tab: 'followers' | 'following') => void;
}

export default function OtherProfileHero({
  userId,
  profile,
  followerCount,
  followingCount,
  isFollowing,
  isFollowStatusLoading,
  openFollowModal,
}: OtherProfileHeroProps) {
  const displayName = profile.display_name || profile.username || 'User';
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#FA243C]/[0.04] blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center pt-4 md:pt-8 pb-8 px-6">
        {/* Avatar */}
        <div className="relative">
          <div className="relative w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-full overflow-hidden ring-[3px] ring-white/10 ring-offset-4 ring-offset-black/0 shadow-[0_0_40px_rgba(250,36,60,0.08)]">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                sizes="150px"
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
        </div>

        {/* Name */}
        <div className="flex items-center gap-3 mt-5">
          <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight text-white">
            {displayName}
          </h1>
        </div>

        {profile.username && profile.display_name && (
          <p className="text-[13px] text-white/40 mt-1">
            @{profile.username}
          </p>
        )}

        {profile.bio && (
          <p className="text-[14px] text-white/70 mt-3 max-w-sm text-center leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Badge & Share */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06]">
            <Globe size={12} className="text-white/30" />
            <span className="text-[11px] text-white/40 font-medium">Public Profile</span>
          </div>
          <button 
            onClick={() => {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music-labs-beryl.vercel.app');
              const url = profile?.username ? `${appUrl}/@${profile.username}` : `${appUrl}/user/${userId}`;
              navigator.clipboard.writeText(url);
              toast.success('Profile link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
          >
            <Share2 size={12} className="text-white/60" />
            <span className="text-[11px] text-white/60 font-medium">Share</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 md:gap-12 mt-6">
          <button
            type="button"
            onClick={() => openFollowModal('followers')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Users size={15} className="text-[#FA243C]" />
              <span className="text-[22px] md:text-[26px] font-bold text-white tabular-nums group-hover:text-[#FA243C] transition-colors">
                {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/60 transition-colors">
              Followers
            </span>
          </button>

          <div className="w-px h-8 bg-white/10" />

          <button
            type="button"
            onClick={() => openFollowModal('following')}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <UserCheck size={15} className="text-[#FA243C]" />
              <span className="text-[22px] md:text-[26px] font-bold text-white tabular-nums group-hover:text-[#FA243C] transition-colors">
                {followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}k` : followingCount}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/60 transition-colors">
              Following
            </span>
          </button>
        </div>

        {/* Follow button */}
        <div className="mt-6">
          <FollowButton
            targetUserId={userId}
            isFollowing={isFollowing}
            isLoading={isFollowStatusLoading}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
