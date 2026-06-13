'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ChevronLeft } from 'lucide-react';
import FollowListModal from '@/components/social/FollowListModal';
import OtherProfileHero from './OtherProfileHero';
import OtherProfilePlaylists from './OtherProfilePlaylists';
import { UserProfile } from '@/types/profile';
import type { PlaylistRecord } from '@/lib/supabase/music';

export interface OtherProfileInitialData {
  userId: string;
  profile: UserProfile;
  publicPlaylists: PlaylistRecord[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
}

interface OtherProfileProps {
  initialData: OtherProfileInitialData;
}

export default function OtherProfile({ initialData }: OtherProfileProps) {
  const {
    userId,
    profile,
    publicPlaylists,
    followerCount,
    followingCount,
    isFollowing,
  } = initialData;

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');

  // GSAP entrance animation
  useEffect(() => {
    if (containerRef.current) {
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
  }, []);

  const openFollowModal = (tab: 'followers' | 'following') => {
    setFollowModalTab(tab);
    setFollowModalOpen(true);
  };

  return (
    <>
      <div ref={containerRef} className="pb-32 pt-2 max-w-[1400px] mx-auto">
        {/* ── Back Button ─────────────────────────────────────── */}
        <div className="px-5 md:px-8 pt-2 mb-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>

        <OtherProfileHero
          userId={userId}
          profile={profile}
          followerCount={followerCount}
          followingCount={followingCount}
          playlistCount={publicPlaylists.length}
          isFollowing={isFollowing}
          isFollowStatusLoading={false}
          openFollowModal={openFollowModal}
        />

        {/* Divider */}
        <div className="px-5 md:px-8">
          <div className="h-px w-full bg-white/[0.06]" />
        </div>

        <OtherProfilePlaylists publicPlaylists={publicPlaylists} />
      </div>

      {/* Follow List Modal */}
      <FollowListModal
        userId={userId}
        initialTab={followModalTab}
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        followerCount={followerCount}
        followingCount={followingCount}
      />
    </>
  );
}
