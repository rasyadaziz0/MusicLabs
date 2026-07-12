'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalRoot } from '@/lib/utils/portalRoot';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gooeyToast as toast } from 'goey-toast';
import { LogOut, ListMusic, Heart, Users, UserCheck, User, Share2, ArrowLeft, Globe, CheckCircle2, Menu, Bell, Settings, Edit3, X, ChevronRight } from 'lucide-react';
import { UserProfile } from '@/types/profile';
import { TikTokIcon, InstagramIcon, XIcon } from '@/components/icons/SocialIcons';

interface ProfileHeroProps {
  user: any;
  profile: UserProfile | null;
  stats: {
    playlistCount: number;
    likedCount: number;
    followerCount: number;
    followingCount: number;
  };
  handleSignOut?: () => void;
  setFollowModalTab: (tab: 'followers' | 'following') => void;
  setFollowModalOpen: (open: boolean) => void;
}

export function MobileProfileHero({
  user,
  profile,
  stats,
  handleSignOut,
  setFollowModalTab,
  setFollowModalOpen,
}: ProfileHeroProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url?.trim().replace(/^`+|`+$/g, '');
  const bannerUrl = profile?.banner_url;
  const displayName = profile?.display_name || profile?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'User';
  const usernameDisplay = profile?.username;
  const bio = profile?.bio;
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
            onClick={() => setIsSidebarOpen(true)}
            className="text-white hover:text-white/80 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Info & Avatar Row */}
      <div className="flex justify-between items-center mt-2 mb-4">
        <div className="flex flex-col flex-1 pr-4">
          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight">
            {displayName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-[14px] text-white/70">
            <span>{usernameDisplay ? `@${usernameDisplay}` : user.email}</span>
            {(profile?.username?.toLowerCase() === 'rasyadaziz' || (user?.email === 'wdy5612@gmail.com' && profile?.id === user?.id)) && (
              <div className="bg-[#FA243C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <CheckCircle2 size={10} />
                Developer
              </div>
            )}
          </div>
        </div>
        
        {/* Avatar Right */}
        <div className="relative shrink-0 w-[84px] h-[84px] rounded-full overflow-hidden border border-white/20">
          <Image
            src={avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random`}
            alt="Profile"
            fill
            sizes="84px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-8 mb-5">
        <button onClick={() => { setFollowModalTab('following'); setFollowModalOpen(true); }} className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{stats.followingCount}</span>
          <span className="text-[13px] text-white/60">Mengikuti</span>
        </button>
        <button onClick={() => { setFollowModalTab('followers'); setFollowModalOpen(true); }} className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{stats.followerCount}</span>
          <span className="text-[13px] text-white/60">Pengikut</span>
        </button>
        <div className="flex flex-col items-start text-left">
          <span className="font-bold text-[17px]">{stats.playlistCount}</span>
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
          <Link
            href="/profile/edit"
            className="flex items-center justify-center w-full h-10 rounded-[8px] font-semibold text-[15px] bg-white/10 hover:bg-white/15 active:bg-white/20 text-white transition-colors"
          >
            Edit Profile
          </Link>
        </div>
        
        {/* Share Button */}
        <button
          onClick={() => {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://music.rasyadazizan.site');
            const url = profile?.username ? `${appUrl}/@${profile.username}` : `${appUrl}/user/${user.id}`;
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

      {/* Sidebar Overlay via Portal */}
      {mounted && createPortal(
        <div 
          className={`fixed inset-0 flex justify-end transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ zIndex: 99999 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div 
            className={`relative w-[75%] max-w-[320px] h-full bg-[#111115] border-l border-white/10 flex flex-col transition-transform duration-300 ease-out ${
              isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <span className="font-bold text-lg text-white">Menu</span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 -mr-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2">
              <Link 
                href="/profile/edit"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group"
              >
                <Edit3 size={22} className="text-white/50 group-hover:text-white transition-colors" />
                <span className="font-medium text-[16px] text-white/90 group-hover:text-white transition-colors">Edit Profile</span>
                <ChevronRight size={18} className="ml-auto text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
              
              <Link 
                href="/settings"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group"
              >
                <Settings size={22} className="text-white/50 group-hover:text-white transition-colors" />
                <span className="font-medium text-[16px] text-white/90 group-hover:text-white transition-colors">Settings</span>
                <ChevronRight size={18} className="ml-auto text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
            </div>
            
            {/* Footer / Logout */}
            {handleSignOut && (
              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-[12px] bg-white/5 text-[#FA243C] hover:bg-[#FA243C]/10 transition-colors font-semibold text-[15px]"
                >
                  <LogOut size={20} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        getPortalRoot()
      )}

    </div>
  );
}
