import { Users, UserCheck, Globe, Share2, CheckCircle2, ListMusic } from 'lucide-react';
import Image from 'next/image';
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
  isFollowStatusLoading: boolean;
  openFollowModal: (tab: 'followers' | 'following') => void;
}

export default function OtherProfileHero({
  userId,
  profile,
  followerCount,
  followingCount,
  playlistCount = 0,
  isFollowing,
  isFollowStatusLoading,
  openFollowModal,
}: OtherProfileHeroProps) {
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
    <div data-animate className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] mx-4 md:mx-8 mt-0.5 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {bannerUrl ? (
          <>
            <Image
              src={bannerUrl}
              alt="Profile Banner"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-[#121212]" />
          </>
        ) : (
          <>
            <Image
              src={avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random`}
              alt="Blurred Banner"
              fill
              className="object-cover blur-[60px] opacity-30 scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#121212]/80 to-[#121212]" />
          </>
        )}
      </div>

      <div className={`relative flex flex-col items-center pb-8 px-6 sm:px-10 ${bannerUrl ? 'pt-12 md:pt-16 mt-16 md:mt-24' : 'pt-10 md:pt-14 mt-8'} bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] md:rounded-[2.5rem] w-fit max-w-[95%] md:max-w-xl mx-auto mb-8 md:mb-12 transition-all`}>
        {/* Avatar */}
        <div className="relative group">
          <div className="relative w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full overflow-hidden ring-[3px] ring-[#FA243C]/30 ring-offset-4 ring-offset-black/0 shadow-[0_0_60px_rgba(250,36,60,0.15)]">
            <Image
              src={avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random`}
              alt={displayName}
              fill
              sizes="160px"
              className="object-cover"
              priority
            />
          </div>
          {profile?.username?.toLowerCase() === 'rasyadaziz' && (
            <div className="absolute -bottom-2 -right-2 bg-[#FA243C] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-[#121212] flex items-center gap-1 z-20 pointer-events-none">
              <CheckCircle2 size={10} className="text-white" />
              Developer
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex items-center gap-3 mt-5">
          <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white">
            {displayName}
          </h1>
        </div>

        {usernameDisplay && (
          <p className="text-[14px] text-white/40 mt-1">
            @{usernameDisplay}
          </p>
        )}

        {bio && (
          <p className="text-[14px] text-white/70 mt-3 max-w-sm text-center leading-relaxed">
            {bio}
          </p>
        )}

        {/* Social Links */}
        {hasSocials && (
          <div className="flex items-center gap-3 mt-3">
            {profile?.social_instagram && (
              <a
                href={`https://instagram.com/${profile.social_instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <InstagramIcon size={14} className="text-white/60" />
              </a>
            )}
            {profile?.social_twitter && (
              <a
                href={`https://x.com/${profile.social_twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                title="X / Twitter"
              >
                <XIcon size={13} className="text-white/60" />
              </a>
            )}
            {profile?.social_tiktok && (
              <a
                href={`https://tiktok.com/@${profile.social_tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                title="TikTok"
              >
                <TikTokIcon size={13} className="text-white/60" />
              </a>
            )}
          </div>
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
        <div className="flex items-center gap-3 sm:gap-6 mt-7 w-full justify-center overflow-x-auto scrollbar-hide max-w-full">
          <StatItem value={playlistCount} label="Playlists" icon={<ListMusic size={15} className="text-[#FA243C]" />} />
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <button
            type="button"
            onClick={() => openFollowModal('followers')}
            className="group cursor-pointer shrink-0"
          >
            <StatItem value={followerCount} label="Followers" icon={<Users size={15} className="text-[#FA243C]" />} clickable />
          </button>
          <div className="w-px h-8 bg-white/10 shrink-0" />
          <button
            type="button"
            onClick={() => openFollowModal('following')}
            className="group cursor-pointer shrink-0"
          >
            <StatItem value={followingCount} label="Following" icon={<UserCheck size={15} className="text-[#FA243C]" />} clickable />
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
    <div className={`flex flex-col items-center gap-1 ${clickable ? 'group-hover:opacity-80 transition-opacity' : ''}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-[18px] md:text-[20px] font-bold text-white tabular-nums ${clickable ? 'group-hover:text-[#FA243C] transition-colors' : ''}`}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </span>
      </div>
      <span className={`text-[10px] font-semibold text-white/40 uppercase tracking-wider ${clickable ? 'group-hover:text-white/60 transition-colors' : ''}`}>
        {label}
      </span>
    </div>
  );
}
