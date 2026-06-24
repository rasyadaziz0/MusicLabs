import { Users, UserCheck, Globe, Share2, CheckCircle2, ListMusic, ArrowLeft, Bell } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { gooeyToast as toast } from 'goey-toast';
import FollowButton from '@/components/ui/FollowButton';
import { TikTokIcon, InstagramIcon, XIcon } from '@/components/icons/SocialIcons';

interface OtherProfileHeroProps {
  userId: string;
  profile: any;
  followerCount: number;
  followingCount: number;
  playlistCount?: number;
  isFollowing: boolean;
  isFollowStatusLoading?: boolean;
  openFollowModal: (tab: 'followers' | 'following') => void;
}

export default function MobileOtherProfileHero({
  userId,
  profile,
  followerCount,
  followingCount,
  playlistCount = 0,
  isFollowing,
  isFollowStatusLoading,
  openFollowModal,
}: OtherProfileHeroProps) {
  const router = useRouter();
  const displayName = profile.display_name || profile.username || 'User';
  const usernameDisplay = profile.username;
  const bio = profile.bio;
  const bannerUrl = profile.banner_url;
  const avatarUrl = profile.avatar_url;
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Social links
  const hasSocials = profile?.social_instagram || profile?.social_twitter || profile?.social_tiktok;

  return (
    <div data-animate className="relative w-[calc(100%+2rem)] -mx-4 -mt-4 pt-4 pb-6 px-5 text-white bg-transparent">
      {/* Banner Background */}
      <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden h-[220px] -z-10">
        <Image
          src={bannerUrl || avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random`}
          alt="Banner Background"
          fill
          className={`object-cover ${bannerUrl ? 'opacity-80 blur-0' : 'opacity-55 blur-[15px]'} scale-105 transition-all duration-300`}
          priority
        />
        {/* Gradient overlay to fade banner into background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#111115]/50 to-[#111115]" />
      </div>

      {/* Top Navbar */}
      <div className="flex items-center justify-between mb-0 pt-0 relative z-50">
        <button
          onClick={() => {
            if (window.history.length > 2) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="p-1 -ml-1 text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeft size={26} />
        </button>
        <div className="flex items-center gap-4">
          <button className="text-white hover:text-white/80 transition-colors">
            <Bell size={24} />
          </button>
          <button
            onClick={() => {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music-labs-beryl.vercel.app');
              const url = profile?.username ? `${appUrl}/@${profile.username}` : `${appUrl}/user/${userId}`;
              navigator.clipboard.writeText(url);
              toast.success('Profile link copied to clipboard!');
            }}
            className="text-white hover:text-white/80 transition-colors"
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Info & Avatar Row */}
      <div className="flex justify-between items-center mt-2 mb-4">
        <div className="flex flex-col flex-1 pr-4">
          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight">
            {displayName}
          </h1>
          {usernameDisplay && (
            <div className="flex items-center gap-1.5 mt-1 text-[14px] text-white/70">
              <span>@{usernameDisplay}</span>
              {profile?.username?.toLowerCase() === 'rasyadaziz' && (
                <div className="bg-[#FA243C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                  <CheckCircle2 size={10} />
                  Developer
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Avatar Right */}
        <div className="relative shrink-0 w-[84px] h-[84px] rounded-full overflow-hidden border border-white/20">
          <Image
            src={avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random`}
            alt={displayName}
            fill
            sizes="84px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-8 mb-5">
        <button onClick={() => openFollowModal('following')} className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{followingCount}</span>
          <span className="text-[13px] text-white/60">Mengikuti</span>
        </button>
        <button onClick={() => openFollowModal('followers')} className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{followerCount}</span>
          <span className="text-[13px] text-white/60">Pengikut</span>
        </button>
        <div className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{playlistCount}</span>
          <span className="text-[13px] text-white/60">Playlists</span>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-[14px] text-white/90 mb-5 leading-snug">
          {bio}
        </p>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <FollowButton
            targetUserId={userId}
            isFollowing={isFollowing}
            isLoading={isFollowStatusLoading}
            size="md"
            className="w-full justify-center h-10 rounded-[8px] font-semibold text-[15px] bg-[#FA243C] hover:bg-[#E01E35] text-white border-none"
          />
        </div>
        
        {/* Share Button */}
        <button
          onClick={() => {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music-labs-beryl.vercel.app');
            const url = profile?.username ? `${appUrl}/@${profile.username}` : `${appUrl}/user/${userId}`;
            navigator.clipboard.writeText(url);
            toast.success('Profile link copied to clipboard!');
          }}
          className="w-10 h-10 bg-white/10 hover:bg-white/15 active:bg-white/20 flex items-center justify-center rounded-[8px] transition-colors shrink-0"
        >
          <Share2 size={18} />
        </button>
        
        {/* Socials */}
        {profile?.social_instagram && (
          <a href={`https://instagram.com/${profile.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-white/15 active:bg-white/20 flex items-center justify-center rounded-[8px] transition-colors shrink-0">
            <InstagramIcon size={18} />
          </a>
        )}
        {profile?.social_tiktok && (
          <a href={`https://tiktok.com/@${profile.social_tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-white/15 active:bg-white/20 flex items-center justify-center rounded-[8px] transition-colors shrink-0">
            <TikTokIcon size={18} />
          </a>
        )}
      </div>

    </div>
  );
}
